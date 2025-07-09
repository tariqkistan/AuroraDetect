const { handler } = require('../index');
const AWS = require('aws-sdk');

// Get mocked AWS services
const mockDynamoDB = new AWS.DynamoDB.DocumentClient();
const mockSNS = new AWS.SNS();

describe('Fraud Detection Lambda Handler', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Reset the transaction cache
        const index = require('../index');
        if (index.transactionCache) {
            index.transactionCache.clear();
        }
    });

    describe('handler', () => {
        it('should process valid transaction successfully', async () => {
            const transaction = createMockTransaction();
            const kinesisEvent = {
                Records: [createMockKinesisRecord(transaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(0);
            expect(mockDynamoDB.put).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple transactions in batch', async () => {
            const transaction1 = createMockTransaction({ transactionId: 'txn_1' });
            const transaction2 = createMockTransaction({ transactionId: 'txn_2' });
            
            const kinesisEvent = {
                Records: [
                    createMockKinesisRecord(transaction1),
                    createMockKinesisRecord(transaction2)
                ]
            };

            const result = await handler(kinesisEvent);

            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(0);
            expect(mockDynamoDB.put).toHaveBeenCalledTimes(2);
        });

        it('should handle invalid transaction data', async () => {
            const invalidTransaction = { transactionId: 'txn_invalid' }; // Missing required fields
            const kinesisEvent = {
                Records: [createMockKinesisRecord(invalidTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(1);
            expect(mockDynamoDB.put).not.toHaveBeenCalled();
        });

        it('should handle malformed JSON in Kinesis record', async () => {
            const kinesisEvent = {
                Records: [{
                    kinesis: {
                        sequenceNumber: 'test-sequence-123',
                        data: Buffer.from('invalid json').toString('base64')
                    }
                }]
            };

            const result = await handler(kinesisEvent);

            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(1);
        });
    });

    describe('fraud detection rules', () => {
        it('should flag high amount transactions', async () => {
            const highAmountTransaction = createMockTransaction({ 
                amount: 25000, // Above $20,000 threshold
                cardId: 'card_high_amount_test' // Use unique card ID
            });
            const kinesisEvent = {
                Records: [createMockKinesisRecord(highAmountTransaction)]
            };

            await handler(kinesisEvent);

            // Check that DynamoDB was called with flagged transaction
            const dynamoCall = mockDynamoDB.put.mock.calls[0][0];
            expect(dynamoCall.Item.flagged).toBe(true);
            expect(dynamoCall.Item.fraudReasons).toEqual(
                expect.arrayContaining([expect.stringContaining('High amount')])
            );

            // Check that SNS alert was sent
            expect(mockSNS.publish).toHaveBeenCalledTimes(1);
        });

        it('should flag velocity-based fraud', async () => {
            const cardId = 'card_velocity_test';
            const baseTime = new Date();
            
            // Create 4 transactions within 1 minute (exceeds threshold of 3)
            const transactions = Array.from({ length: 4 }, (_, i) => 
                createMockTransaction({
                    cardId,
                    transactionId: `txn_velocity_${i}`,
                    timestamp: new Date(baseTime.getTime() + (i * 10000)).toISOString() // 10 seconds apart
                })
            );

            // Process transactions sequentially to build up velocity
            for (let i = 0; i < transactions.length; i++) {
                const kinesisEvent = {
                    Records: [createMockKinesisRecord(transactions[i])]
                };
                await handler(kinesisEvent);
            }

            // The 4th transaction should be flagged for velocity
            const lastDynamoCall = mockDynamoDB.put.mock.calls[3][0];
            expect(lastDynamoCall.Item.flagged).toBe(true);
            expect(lastDynamoCall.Item.fraudReasons).toEqual(
                expect.arrayContaining([expect.stringContaining('Multiple transactions')])
            );
        });

        it('should not flag normal transactions', async () => {
            const normalTransaction = createMockTransaction({
                amount: 50.00, // Below threshold
                cardId: 'card_normal_test' // Use unique card ID
            });
            const kinesisEvent = {
                Records: [createMockKinesisRecord(normalTransaction)]
            };

            await handler(kinesisEvent);

            const dynamoCall = mockDynamoDB.put.mock.calls[0][0];
            expect(dynamoCall.Item.flagged).toBe(false);
            expect(dynamoCall.Item.fraudReasons).toHaveLength(0);
            expect(mockSNS.publish).not.toHaveBeenCalled();
        });
    });

    describe('data storage', () => {
        it('should store transaction with correct structure', async () => {
            const transaction = createMockTransaction();
            const kinesisEvent = {
                Records: [createMockKinesisRecord(transaction)]
            };

            await handler(kinesisEvent);

            const dynamoCall = mockDynamoDB.put.mock.calls[0][0];
            expect(dynamoCall.TableName).toBe('test-transactions');
            expect(dynamoCall.Item).toMatchObject({
                transactionId: transaction.transactionId,
                cardId: transaction.cardId,
                amount: transaction.amount,
                location: transaction.location,
                timestamp: transaction.timestamp,
                flagged: expect.any(Boolean),
                fraudReasons: expect.any(Array),
                processedAt: expect.any(String)
            });
        });

        it('should handle DynamoDB errors gracefully', async () => {
            // Mock DynamoDB to throw an error
            mockDynamoDB.put.mockReturnValueOnce({
                promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
            });

            const transaction = createMockTransaction();
            const kinesisEvent = {
                Records: [createMockKinesisRecord(transaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.batchItemFailures).toHaveLength(1);
        });
    });

    describe('fraud alerts', () => {
        it('should send SNS alert for flagged transactions', async () => {
            const fraudTransaction = createMockTransaction({ 
                amount: 25000,
                cardId: 'card_fraud_alert_test' // Use unique card ID
            });
            const kinesisEvent = {
                Records: [createMockKinesisRecord(fraudTransaction)]
            };

            await handler(kinesisEvent);

            expect(mockSNS.publish).toHaveBeenCalledTimes(1);
            
            const snsCall = mockSNS.publish.mock.calls[0][0];
            expect(snsCall.TopicArn).toBe('arn:aws:sns:us-east-1:123456789012:test-fraud-alerts');
            expect(snsCall.Subject).toContain('Fraud Alert');
            
            const message = JSON.parse(snsCall.Message);
            expect(message.alertType).toBe('FRAUD_DETECTED');
            expect(message.transactionId).toBe(fraudTransaction.transactionId);
            expect(message.severity).toBe('HIGH');
        });

        it('should handle SNS errors gracefully', async () => {
            // Mock SNS to throw an error
            mockSNS.publish.mockReturnValueOnce({
                promise: jest.fn().mockRejectedValue(new Error('SNS error'))
            });

            const fraudTransaction = createMockTransaction({ 
                amount: 25000,
                cardId: 'card_sns_error_test' // Use unique card ID
            });
            const kinesisEvent = {
                Records: [createMockKinesisRecord(fraudTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.batchItemFailures).toHaveLength(1);
        });

        it('should not send alerts for normal transactions', async () => {
            const normalTransaction = createMockTransaction({ 
                amount: 50.00,
                cardId: 'card_no_alert_test' // Use unique card ID
            });
            const kinesisEvent = {
                Records: [createMockKinesisRecord(normalTransaction)]
            };

            await handler(kinesisEvent);

            expect(mockSNS.publish).not.toHaveBeenCalled();
        });
    });
}); 