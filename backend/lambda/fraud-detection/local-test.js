const { handler } = require('./index');
require('dotenv').config();

// Mock Kinesis event for testing
const createMockKinesisEvent = (transactions) => {
    return {
        Records: transactions.map((transaction, index) => ({
            kinesis: {
                kinesisSchemaVersion: "1.0",
                partitionKey: transaction.cardId,
                sequenceNumber: `${Date.now()}-${index}`,
                data: Buffer.from(JSON.stringify(transaction)).toString('base64'),
                approximateArrivalTimestamp: Date.now() / 1000
            },
            eventSource: "aws:kinesis",
            eventVersion: "1.0",
            eventID: `shardId-000000000000:${Date.now()}-${index}`,
            eventName: "aws:kinesis:record",
            invokeIdentityArn: "arn:aws:iam::123456789012:role/lambda-kinesis-role",
            awsRegion: "us-east-1",
            eventSourceARN: "arn:aws:kinesis:us-east-1:123456789012:stream/TransactionStream"
        }))
    };
};

// Test scenarios
const testScenarios = [
    {
        name: "Normal Transaction",
        transactions: [
            {
                transactionId: "txn_normal_001",
                cardId: "card_test_001",
                amount: 50.00,
                location: "Coffee Shop, NYC",
                timestamp: new Date().toISOString()
            }
        ]
    },
    {
        name: "High Amount Fraud",
        transactions: [
            {
                transactionId: "txn_fraud_001",
                cardId: "card_test_002",
                amount: 25000.00,
                location: "Luxury Store, Miami",
                timestamp: new Date().toISOString()
            }
        ]
    },
    {
        name: "Multiple Transactions Fraud",
        transactions: [
            {
                transactionId: "txn_multi_001",
                cardId: "card_test_003",
                amount: 100.00,
                location: "Store A, Chicago",
                timestamp: new Date().toISOString()
            },
            {
                transactionId: "txn_multi_002",
                cardId: "card_test_003",
                amount: 200.00,
                location: "Store B, Chicago",
                timestamp: new Date(Date.now() + 10000).toISOString() // 10 seconds later
            },
            {
                transactionId: "txn_multi_003",
                cardId: "card_test_003",
                amount: 300.00,
                location: "Store C, Chicago",
                timestamp: new Date(Date.now() + 20000).toISOString() // 20 seconds later
            },
            {
                transactionId: "txn_multi_004",
                cardId: "card_test_003",
                amount: 400.00,
                location: "Store D, Chicago",
                timestamp: new Date(Date.now() + 30000).toISOString() // 30 seconds later
            }
        ]
    }
];

async function runTests() {
    console.log('🚀 Starting AuroraDetect Lambda Function Tests\n');
    
    for (const scenario of testScenarios) {
        console.log(`📋 Testing: ${scenario.name}`);
        console.log('=' .repeat(50));
        
        try {
            const mockEvent = createMockKinesisEvent(scenario.transactions);
            const result = await handler(mockEvent);
            
            console.log('✅ Test Result:', JSON.stringify(result, null, 2));
            console.log('\n');
        } catch (error) {
            console.error('❌ Test Failed:', error.message);
            console.log('\n');
        }
    }
    
    console.log('🏁 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { createMockKinesisEvent, testScenarios }; 