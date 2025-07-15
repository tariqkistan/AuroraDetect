// Set to false to use real AWS services
process.env.LOCAL_TEST = 'false';
console.log('Using real AWS services for testing');

// Load environment variables from .env file
require('dotenv').config();

// Import the handler after setting the environment variables
const { handler } = require('./index');

// Mock Kinesis event for testing
const createMockKinesisEvent = (transactions) => {
    return {
        Records: transactions.map((transaction, index) => ({
            kinesis: {
                kinesisSchemaVersion: '1.0',
                partitionKey: transaction.cardId,
                sequenceNumber: `${Date.now()}-${index}`,
                data: Buffer.from(JSON.stringify(transaction)).toString('base64'),
                approximateArrivalTimestamp: Date.now() / 1000
            },
            eventSource: 'aws:kinesis',
            eventVersion: '1.0',
            eventID: `shardId-000000000000:${Date.now()}-${index}`,
            eventName: 'aws:kinesis:record',
            invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-kinesis-role',
            awsRegion: 'us-east-1',
            eventSourceARN: 'arn:aws:kinesis:us-east-1:123456789012:stream/TransactionStream'
        }))
    };
};

// Test scenarios
const testScenarios = [
    {
        name: 'Normal Transaction',
        transactions: [
            {
                transactionId: 'txn_normal_001',
                cardId: 'card_test_001',
                amount: 50.00,
                location: 'Coffee Shop, NYC',
                timestamp: new Date().toISOString()
            }
        ]
    },
    {
        name: 'High Amount Fraud',
        transactions: [
            {
                transactionId: 'txn_fraud_001',
                cardId: 'card_test_002',
                amount: 25000.00,
                location: 'Luxury Store, Miami',
                timestamp: new Date().toISOString()
            }
        ]
    },
    {
        name: 'Multiple Transactions Fraud',
        transactions: [
            {
                transactionId: 'txn_multi_001',
                cardId: 'card_test_003',
                amount: 100.00,
                location: 'Store A, Chicago',
                timestamp: new Date().toISOString()
            },
            {
                transactionId: 'txn_multi_002',
                cardId: 'card_test_003',
                amount: 200.00,
                location: 'Store B, Chicago',
                timestamp: new Date(Date.now() + 10000).toISOString() // 10 seconds later
            },
            {
                transactionId: 'txn_multi_003',
                cardId: 'card_test_003',
                amount: 300.00,
                location: 'Store C, Chicago',
                timestamp: new Date(Date.now() + 20000).toISOString() // 20 seconds later
            },
            {
                transactionId: 'txn_multi_004',
                cardId: 'card_test_003',
                amount: 400.00,
                location: 'Store D, Chicago',
                timestamp: new Date(Date.now() + 30000).toISOString() // 30 seconds later
            }
        ]
    },
    {
        name: 'Impossible Travel Fraud',
        transactions: [
            {
                transactionId: 'txn_travel_001',
                cardId: 'card_test_004',
                amount: 150.00,
                location: 'New York, NY',
                timestamp: new Date().toISOString()
            },
            {
                transactionId: 'txn_travel_002',
                cardId: 'card_test_004',
                amount: 200.00,
                location: 'Los Angeles, CA', // ~4,500 km from NY
                timestamp: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour later
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
            
            // Print fraud detection results
            console.log('✅ Test Results:');
            
            // Check for detected fraud
            const { detectedFraud, transactionCache } = require('./index');
            
            // Debug transaction cache for this scenario
            if (scenario.name === 'Impossible Travel Fraud') {
                console.log('\n🔍 Transaction Cache for Impossible Travel Test:');
                const cardId = 'card_test_004';
                if (transactionCache && transactionCache.has(cardId)) {
                    const transactions = transactionCache.get(cardId);
                    console.log(`Found ${transactions.length} transactions for card ${cardId}:`);
                    transactions.forEach((tx, i) => {
                        console.log(`Transaction ${i + 1}:`);
                        console.log(`  - ID: ${tx.transactionId}`);
                        console.log(`  - Location: ${tx.location}`);
                        console.log(`  - Timestamp: ${tx.timestamp}`);
                        console.log(`  - Amount: ${tx.amount}`);
                    });
                    
                    // If we have 2 transactions, calculate the distance and speed
                    if (transactions.length === 2) {
                        const geolib = require('geolib');
                        const t1 = transactions[0];
                        const t2 = transactions[1];
                        
                        // Get coordinates
                        const getLocationCoordinates = (locationStr) => {
                            const hardcodedCoordinates = {
                                'New York, NY': { latitude: 40.7128, longitude: -74.0060 },
                                'Los Angeles, CA': { latitude: 34.0522, longitude: -118.2437 }
                            };
                            return hardcodedCoordinates[locationStr];
                        };
                        
                        const coords1 = getLocationCoordinates(t1.location);
                        const coords2 = getLocationCoordinates(t2.location);
                        
                        if (coords1 && coords2) {
                            const distanceKm = geolib.getDistance(coords1, coords2) / 1000;
                            const time1 = new Date(t1.timestamp);
                            const time2 = new Date(t2.timestamp);
                            const timeDiffHours = Math.abs((time2 - time1) / (1000 * 60 * 60));
                            const requiredSpeedKmh = distanceKm / timeDiffHours;
                            
                            console.log('\n📊 Travel Analysis:');
                            console.log(`  - Distance: ${distanceKm.toFixed(2)} km`);
                            console.log(`  - Time difference: ${timeDiffHours.toFixed(2)} hours`);
                            console.log(`  - Required speed: ${requiredSpeedKmh.toFixed(2)} km/h`);
                            console.log(`  - Threshold: 900 km/h`);
                            console.log(`  - Should be flagged: ${requiredSpeedKmh > 900 ? 'YES' : 'NO'}`);
                        }
                    }
                } else {
                    console.log(`No transactions found for card ${cardId}`);
                }
            }
            
            if (detectedFraud && detectedFraud.length > 0) {
                console.log('\n🚨 Fraud detected:');
                detectedFraud.forEach(fraud => {
                    console.log(`- Transaction: ${fraud.transaction.transactionId}`);
                    console.log(`  Amount: $${fraud.transaction.amount}`);
                    console.log(`  Location: ${fraud.transaction.location}`);
                    console.log(`  Time: ${fraud.transaction.timestamp}`);
                    console.log('  Fraud flags:');
                    fraud.fraudFlags.forEach(flag => console.log(`    * ${flag}`));
                    console.log();
                });
            } else {
                console.log('\n✓ No fraud detected');
            }
            
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