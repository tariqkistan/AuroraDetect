import { NextRequest, NextResponse } from 'next/server'
import AWS from 'aws-sdk'

// Use AWS CLI credentials from shared credentials file
// This will automatically use the credentials configured with AWS CLI
// Explicitly set the AWS region
AWS.config.update({ region: 'us-east-1' })

const dynamodb = new AWS.DynamoDB.DocumentClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const fraudOnly = searchParams.get('fraudOnly') === 'true'

    const params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: process.env.DYNAMODB_TABLE || 'aurora-detect-dev-transactions',
      Limit: limit
    }

    // Add filter for fraud transactions if requested
    if (fraudOnly) {
      params.FilterExpression = '#flagged = :flagged'
      params.ExpressionAttributeNames = {
        '#flagged': 'flagged'
      }
      params.ExpressionAttributeValues = {
        ':flagged': true
      }
    }

    const result = await dynamodb.scan(params).promise()
    
    // Transform the data to match our frontend interface
    const transactions = result.Items?.map(item => ({
      id: item.transactionId,
      cardId: item.cardId,
      amount: item.amount,
      location: item.location,
      timestamp: item.timestamp,
      status: item.flagged ? 'fraud' : 'normal',
      fraudFlag: item.flagged || false,
      fraudReasons: item.fraudReasons || []
    })) || []

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length
    })

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardId, amount, location } = body

    // Validate input
    if (!cardId || !amount || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create transaction for Kinesis
    const transaction = {
      transactionId: `txn_web_${Date.now()}`,
      cardId,
      amount: parseFloat(amount),
      location,
      timestamp: new Date().toISOString()
    }

    // Send to Kinesis stream
    const kinesis = new AWS.Kinesis()
    const kinesisParams = {
      StreamName: process.env.KINESIS_STREAM_NAME || 'aurora-detect-dev-transaction-stream',
      Data: JSON.stringify(transaction),
      PartitionKey: cardId
    }

    const result = await kinesis.putRecord(kinesisParams).promise()

    return NextResponse.json({
      success: true,
      message: 'Transaction sent successfully',
      transactionId: transaction.transactionId,
      shardId: result.ShardId,
      sequenceNumber: result.SequenceNumber
    })

  } catch (error) {
    console.error('Error sending transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 