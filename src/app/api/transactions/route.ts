import { NextRequest, NextResponse } from 'next/server'
import AWS from 'aws-sdk'

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

// Mock data for development environment
const mockTransactions = [
  {
    transactionId: 'txn_1751554283863_1',
    cardId: 'card_****_1234',
    amount: 150.75,
    location: 'New York, NY',
    timestamp: new Date().toISOString(),
    flagged: false,
    fraudReasons: []
  },
  {
    transactionId: 'txn_1751554283863_2',
    cardId: 'card_****_5678',
    amount: 25000,
    location: 'Los Angeles, CA',
    timestamp: new Date().toISOString(),
    flagged: true,
    fraudReasons: ['High amount: $25000 exceeds threshold of $20000']
  }
]

const dynamodb = new AWS.DynamoDB.DocumentClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const fraudOnly = searchParams.get('fraudOnly') === 'true'

    // In development mode without AWS credentials, return mock data
    if (process.env.NODE_ENV === 'development' && (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)) {
      console.log('Using mock transaction data in development mode')
      
      // Filter mock data if fraudOnly is true
      let filteredTransactions = mockTransactions
      if (fraudOnly) {
        filteredTransactions = mockTransactions.filter(t => t.flagged)
      }
      
      // Transform the mock data to match our frontend interface
      const transactions = filteredTransactions.map(item => ({
        id: item.transactionId,
        cardId: item.cardId,
        amount: item.amount,
        location: item.location,
        timestamp: item.timestamp,
        status: item.flagged ? 'fraud' : 'normal',
        fraudFlag: item.flagged || false,
        fraudReasons: item.fraudReasons || []
      }))

      return NextResponse.json({
        success: true,
        transactions,
        count: transactions.length,
        isMockData: true
      })
    }

    // Try to fetch real data from DynamoDB
    try {
      const params: AWS.DynamoDB.DocumentClient.ScanInput = {
        TableName: process.env.DYNAMODB_TABLE || 'AuroraDetect-Transactions',
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
    } catch (dbError) {
      console.error('DynamoDB error:', dbError)
      
      // If in development mode, fall back to mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('Falling back to mock data after DynamoDB error')
        
        // Transform the mock data to match our frontend interface
        const transactions = mockTransactions.map(item => ({
          id: item.transactionId,
          cardId: item.cardId,
          amount: item.amount,
          location: item.location,
          timestamp: item.timestamp,
          status: item.flagged ? 'fraud' : 'normal',
          fraudFlag: item.flagged || false,
          fraudReasons: item.fraudReasons || []
        }))

        return NextResponse.json({
          success: true,
          transactions,
          count: transactions.length,
          isMockData: true
        })
      }
      
      // In production, throw the error
      throw dbError
    }

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

    // In development mode without AWS credentials, simulate success
    if (process.env.NODE_ENV === 'development' && (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)) {
      console.log('Development mode: Simulating successful transaction submission')
      
      // Add to mock transactions
      mockTransactions.push({
        ...transaction,
        flagged: parseFloat(amount) > 20000,
        fraudReasons: parseFloat(amount) > 20000 ? ['High amount exceeds threshold of $20000'] : []
      })
      
      return NextResponse.json({
        success: true,
        message: 'Transaction simulated successfully',
        transactionId: transaction.transactionId,
        simulatedMode: true
      })
    }

    // Send to Kinesis stream
    try {
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
    } catch (kinesisError) {
      console.error('Kinesis error:', kinesisError)
      
      // If in development mode, simulate success
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Simulating successful transaction after Kinesis error')
        
        // Add to mock transactions
        mockTransactions.push({
          ...transaction,
          flagged: parseFloat(amount) > 20000,
          fraudReasons: parseFloat(amount) > 20000 ? ['High amount exceeds threshold of $20000'] : []
        })
        
        return NextResponse.json({
          success: true,
          message: 'Transaction simulated successfully (after Kinesis error)',
          transactionId: transaction.transactionId,
          simulatedMode: true
        })
      }
      
      // In production, throw the error
      throw kinesisError
    }

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