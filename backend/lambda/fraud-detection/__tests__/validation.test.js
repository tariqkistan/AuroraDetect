// Import the validation function by requiring the main module
// Since validateTransaction is not exported, we'll test it through the main handler
const { handler } = require('../index');

describe('Transaction Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateTransaction', () => {
        it('should accept valid transaction', async () => {
            const validTransaction = createMockTransaction();
            const kinesisEvent = {
                Records: [createMockKinesisRecord(validTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(0);
        });

        it('should reject transaction missing transactionId', async () => {
            const invalidTransaction = createMockTransaction();
            delete invalidTransaction.transactionId;
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(invalidTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.batchItemFailures).toHaveLength(1);
        });

        it('should reject transaction missing cardId', async () => {
            const invalidTransaction = createMockTransaction();
            delete invalidTransaction.cardId;
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(invalidTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.batchItemFailures).toHaveLength(1);
        });

        it('should reject transaction missing amount', async () => {
            const invalidTransaction = createMockTransaction();
            delete invalidTransaction.amount;
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(invalidTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.batchItemFailures).toHaveLength(1);
        });

        it('should reject transaction missing location', async () => {
            const invalidTransaction = createMockTransaction();
            delete invalidTransaction.location;
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(invalidTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.batchItemFailures).toHaveLength(1);
        });

        it('should reject transaction missing timestamp', async () => {
            const invalidTransaction = createMockTransaction();
            delete invalidTransaction.timestamp;
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(invalidTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.batchItemFailures).toHaveLength(1);
        });

        it('should reject transaction with negative amount', async () => {
            const invalidTransaction = createMockTransaction({
                amount: -100.50
            });
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(invalidTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.batchItemFailures).toHaveLength(1);
        });

        it('should reject transaction with non-numeric amount', async () => {
            const invalidTransaction = createMockTransaction({
                amount: 'not-a-number'
            });
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(invalidTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.batchItemFailures).toHaveLength(1);
        });

        it('should reject transaction with invalid timestamp format', async () => {
            const invalidTransaction = createMockTransaction({
                timestamp: 'not-a-valid-date'
            });
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(invalidTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.batchItemFailures).toHaveLength(1);
        });

        it('should accept transaction with zero amount', async () => {
            const validTransaction = createMockTransaction({
                amount: 0
            });
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(validTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(0);
        });

        it('should accept transaction with decimal amount', async () => {
            const validTransaction = createMockTransaction({
                amount: 123.45
            });
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(validTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(0);
        });

        it('should accept transaction with valid ISO timestamp', async () => {
            const validTransaction = createMockTransaction({
                timestamp: '2024-01-15T14:30:00.000Z'
            });
            
            const kinesisEvent = {
                Records: [createMockKinesisRecord(validTransaction)]
            };

            const result = await handler(kinesisEvent);

            expect(result.statusCode).toBe(200);
            expect(result.batchItemFailures).toHaveLength(0);
        });
    });
}); 