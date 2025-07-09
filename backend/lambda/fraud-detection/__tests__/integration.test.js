const { handler } = require('../index');
const AWS = require('aws-sdk');

// Get mocked AWS services
const mockDynamoDB = new AWS.DynamoDB.DocumentClient();
const mockSNS = new AWS.SNS();

describe('Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset the transaction cache
        const index = require('../index');
        if (index.transactionCache) {
            index.transactionCache.clear();
        }
    });

    describe('End-to-End Transaction Processing', () => {
        it('should process normal transaction end-to-end', async () => {
            const transaction = createMockTransaction({
                transactionId: 'txn_integration_normal',
                cardId: 'card_integration_test',
                amount: 150.75,
                location: 'San Francisco, CA'
            });

            const kinesisEvent = {
                Records: [createMockKinesisRecord(transaction)]
            };

            const result = await handler(kinesisEvent);

            // Verify successful processing
            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(0);

            // Verify DynamoDB storage
            expect(mockDynamoDB.put).toHaveBeenCalledTimes(1);
            const dynamoCall = mockDynamoDB.put.mock.calls[0][0];
            expect(dynamoCall.TableName).toBe('test-transactions');
            expect(dynamoCall.Item).toMatchObject({
                transactionId: 'txn_integration_normal',
                cardId: 'card_integration_test',
                amount: 150.75,
                location: 'San Francisco, CA',
                flagged: false,
                fraudReasons: []
            });

            // Verify no SNS alert sent
            expect(mockSNS.publish).not.toHaveBeenCalled();
        });

        it('should process high-amount fraud transaction end-to-end', async () => {
            const fraudTransaction = createMockTransaction({
                transactionId: 'txn_integration_fraud',
                cardId: 'card_integration_fraud',
                amount: 50000, // High amount
                location: 'Unknown Location'
            });

            const kinesisEvent = {
                Records: [createMockKinesisRecord(fraudTransaction)]
            };

            const result = await handler(kinesisEvent);

            // Verify successful processing
            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(0);

            // Verify DynamoDB storage with fraud flag
            expect(mockDynamoDB.put).toHaveBeenCalledTimes(1);
            const dynamoCall = mockDynamoDB.put.mock.calls[0][0];
            expect(dynamoCall.Item.flagged).toBe(true);
            expect(dynamoCall.Item.fraudReasons).toEqual(
                expect.arrayContaining([expect.stringContaining('High amount')])
            );

            // Verify SNS alert sent
            expect(mockSNS.publish).toHaveBeenCalledTimes(1);
            const snsCall = mockSNS.publish.mock.calls[0][0];
            expect(snsCall.TopicArn).toBe('arn:aws:sns:us-east-1:123456789012:test-fraud-alerts');
            
            const alertMessage = JSON.parse(snsCall.Message);
            expect(alertMessage).toMatchObject({
                alertType: 'FRAUD_DETECTED',
                transactionId: 'txn_integration_fraud',
                cardId: 'card_integration_fraud',
                amount: 50000,
                severity: 'HIGH'
            });
        });

        it('should process velocity fraud scenario end-to-end', async () => {
            const cardId = 'card_velocity_integration';
            const baseTime = new Date();
            
            // Create 4 rapid transactions
            const transactions = [
                createMockTransaction({
                    transactionId: 'txn_vel_1',
                    cardId,
                    amount: 100,
                    timestamp: new Date(baseTime.getTime()).toISOString()
                }),
                createMockTransaction({
                    transactionId: 'txn_vel_2',
                    cardId,
                    amount: 200,
                    timestamp: new Date(baseTime.getTime() + 15000).toISOString() // 15 seconds later
                }),
                createMockTransaction({
                    transactionId: 'txn_vel_3',
                    cardId,
                    amount: 300,
                    timestamp: new Date(baseTime.getTime() + 30000).toISOString() // 30 seconds later
                }),
                createMockTransaction({
                    transactionId: 'txn_vel_4',
                    cardId,
                    amount: 400,
                    timestamp: new Date(baseTime.getTime() + 45000).toISOString() // 45 seconds later
                })
            ];

            // Process each transaction
            for (let i = 0; i < transactions.length; i++) {
                const kinesisEvent = {
                    Records: [createMockKinesisRecord(transactions[i])]
                };
                
                const result = await handler(kinesisEvent);
                expect(result.statusCode).toBe(200);
            }

            // Verify all transactions were stored
            expect(mockDynamoDB.put).toHaveBeenCalledTimes(4);

            // Verify the 4th transaction was flagged for velocity
            const lastDynamoCall = mockDynamoDB.put.mock.calls[3][0];
            expect(lastDynamoCall.Item.flagged).toBe(true);
            expect(lastDynamoCall.Item.fraudReasons).toEqual(
                expect.arrayContaining([expect.stringContaining('Multiple transactions')])
            );

            // Verify SNS alert was sent for the velocity fraud
            expect(mockSNS.publish).toHaveBeenCalledTimes(1);
        });

        it('should handle mixed batch with normal and fraud transactions', async () => {
            const normalTransaction = createMockTransaction({
                transactionId: 'txn_mixed_normal',
                cardId: 'card_mixed_normal',
                amount: 50.00
            });

            const fraudTransaction = createMockTransaction({
                transactionId: 'txn_mixed_fraud',
                cardId: 'card_mixed_fraud',
                amount: 25000
            });

            const kinesisEvent = {
                Records: [
                    createMockKinesisRecord(normalTransaction),
                    createMockKinesisRecord(fraudTransaction)
                ]
            };

            const result = await handler(kinesisEvent);

            // Verify successful processing
            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(0);

            // Verify both transactions were stored
            expect(mockDynamoDB.put).toHaveBeenCalledTimes(2);

            // Verify normal transaction not flagged
            const normalDynamoCall = mockDynamoDB.put.mock.calls[0][0];
            expect(normalDynamoCall.Item.flagged).toBe(false);

            // Verify fraud transaction flagged
            const fraudDynamoCall = mockDynamoDB.put.mock.calls[1][0];
            expect(fraudDynamoCall.Item.flagged).toBe(true);

            // Verify only one SNS alert sent (for fraud transaction)
            expect(mockSNS.publish).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle partial batch failures gracefully', async () => {
            const validTransaction = createMockTransaction({
                transactionId: 'txn_valid'
            });

            const invalidTransaction = {
                transactionId: 'txn_invalid'
                // Missing required fields
            };

            const kinesisEvent = {
                Records: [
                    createMockKinesisRecord(validTransaction),
                    createMockKinesisRecord(invalidTransaction)
                ]
            };

            const result = await handler(kinesisEvent);

            // Should return partial failure
            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(1);

            // Valid transaction should be processed
            expect(mockDynamoDB.put).toHaveBeenCalledTimes(1);
        });

        it('should handle DynamoDB failures in batch processing', async () => {
            // Mock DynamoDB to fail on second call
            mockDynamoDB.put
                .mockReturnValueOnce({
                    promise: jest.fn().mockResolvedValue({})
                })
                .mockReturnValueOnce({
                    promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
                });

            const transaction1 = createMockTransaction({ 
                transactionId: 'txn_1',
                cardId: 'card_db_test_1'
            });
            const transaction2 = createMockTransaction({ 
                transactionId: 'txn_2',
                cardId: 'card_db_test_2'
            });

            const kinesisEvent = {
                Records: [
                    createMockKinesisRecord(transaction1),
                    createMockKinesisRecord(transaction2)
                ]
            };

            const result = await handler(kinesisEvent);

            // Should handle partial failure
            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(1);
        });
    });

    describe('Performance and Scale', () => {
        it('should handle large batch of transactions', async () => {
            const batchSize = 10;
            const transactions = Array.from({ length: batchSize }, (_, i) =>
                createMockTransaction({
                    transactionId: `txn_batch_${i}`,
                    cardId: `card_batch_${i}`,
                    amount: 100 + i
                })
            );

            const kinesisEvent = {
                Records: transactions.map(t => createMockKinesisRecord(t))
            };

            const startTime = Date.now();
            const result = await handler(kinesisEvent);
            const endTime = Date.now();

            // Verify all processed successfully
            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(0);
            expect(mockDynamoDB.put).toHaveBeenCalledTimes(batchSize);

            // Verify reasonable performance (should complete in under 1 second for 10 transactions)
            expect(endTime - startTime).toBeLessThan(1000);
        });

        it('should maintain velocity tracking across multiple batches', async () => {
            const cardId = 'card_multi_batch_unique';
            const baseTime = new Date();

            // First batch - 2 transactions
            const batch1 = [
                createMockTransaction({
                    transactionId: 'txn_mb_1',
                    cardId,
                    timestamp: new Date(baseTime.getTime()).toISOString()
                }),
                createMockTransaction({
                    transactionId: 'txn_mb_2',
                    cardId,
                    timestamp: new Date(baseTime.getTime() + 15000).toISOString()
                })
            ];

            await handler({
                Records: batch1.map(t => createMockKinesisRecord(t))
            });

            // Second batch - 2 more transactions (should trigger velocity fraud)
            const batch2 = [
                createMockTransaction({
                    transactionId: 'txn_mb_3',
                    cardId,
                    timestamp: new Date(baseTime.getTime() + 30000).toISOString()
                }),
                createMockTransaction({
                    transactionId: 'txn_mb_4',
                    cardId,
                    timestamp: new Date(baseTime.getTime() + 45000).toISOString()
                })
            ];

            await handler({
                Records: batch2.map(t => createMockKinesisRecord(t))
            });

            // Verify the 4th transaction was flagged
            const lastDynamoCall = mockDynamoDB.put.mock.calls[3][0];
            expect(lastDynamoCall.Item.flagged).toBe(true);
            expect(lastDynamoCall.Item.fraudReasons).toEqual(
                expect.arrayContaining([expect.stringContaining('Multiple transactions')])
            );
        });
    });
}); 