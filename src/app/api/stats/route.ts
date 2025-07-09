import { NextResponse } from 'next/server'
import AWS from 'aws-sdk'

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const dynamodb = new AWS.DynamoDB.DocumentClient()
const cloudwatch = new AWS.CloudWatch()

export async function GET() {
  try {
    // Get transaction counts from DynamoDB
    const totalTransactionsParams = {
      TableName: process.env.DYNAMODB_TABLE || 'aurora-detect-dev-transactions',
      Select: 'COUNT'
    }

    const fraudTransactionsParams = {
      TableName: process.env.DYNAMODB_TABLE || 'aurora-detect-dev-transactions',
      FilterExpression: '#flagged = :flagged',
      ExpressionAttributeNames: {
        '#flagged': 'flagged'
      },
      ExpressionAttributeValues: {
        ':flagged': true
      },
      Select: 'COUNT'
    }

    const [totalResult, fraudResult] = await Promise.all([
      dynamodb.scan(totalTransactionsParams).promise(),
      dynamodb.scan(fraudTransactionsParams).promise()
    ])

    const totalTransactions = totalResult.Count || 0
    const fraudDetected = fraudResult.Count || 0
    const fraudRate = totalTransactions > 0 ? (fraudDetected / totalTransactions) * 100 : 0

    // Get CloudWatch metrics for Lambda function
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 3600000) // 1 hour ago

    const lambdaMetricsParams = {
      Namespace: 'AWS/Lambda',
      MetricName: 'Duration',
      Dimensions: [
        {
          Name: 'FunctionName',
          Value: process.env.LAMBDA_FUNCTION_NAME || 'aurora-detect-dev-fraud-detection'
        }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: ['Average']
    }

    let avgProcessingTime = 245 // Default fallback
    try {
      const metricsResult = await cloudwatch.getMetricStatistics(lambdaMetricsParams).promise()
      if (metricsResult.Datapoints && metricsResult.Datapoints.length > 0) {
        const latestDatapoint = metricsResult.Datapoints.sort((a, b) => 
          new Date(b.Timestamp!).getTime() - new Date(a.Timestamp!).getTime()
        )[0]
        avgProcessingTime = Math.round(latestDatapoint.Average || 245)
      }
    } catch (error) {
      console.warn('Could not fetch CloudWatch metrics:', error)
    }

    // Calculate system health (simplified)
    const systemHealth = fraudRate < 5 ? 99.9 : fraudRate < 10 ? 99.5 : 98.0

    // Get unique card count (simplified - in production, use a more efficient method)
    const uniqueCardsParams = {
      TableName: process.env.DYNAMODB_TABLE || 'aurora-detect-dev-transactions',
      ProjectionExpression: 'cardId'
    }

    let activeCards = 0
    try {
      const cardsResult = await dynamodb.scan(uniqueCardsParams).promise()
      const uniqueCardIds = new Set(cardsResult.Items?.map(item => item.cardId) || [])
      activeCards = uniqueCardIds.size
    } catch (error) {
      console.warn('Could not fetch unique cards:', error)
      activeCards = Math.floor(totalTransactions * 0.7) // Estimate
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalTransactions,
        fraudDetected,
        fraudRate: parseFloat(fraudRate.toFixed(2)),
        avgProcessingTime,
        systemHealth,
        activeCards
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 