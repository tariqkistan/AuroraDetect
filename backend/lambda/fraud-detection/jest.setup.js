// Jest setup file for AWS Lambda testing

// Mock AWS SDK
jest.mock('aws-sdk', () => {
    const mockDynamoDB = {
        put: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({})
        })
    };

    const mockSNS = {
        publish: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' })
        })
    };

    return {
        DynamoDB: {
            DocumentClient: jest.fn(() => mockDynamoDB)
        },
        SNS: jest.fn(() => mockSNS)
    };
});

// Set up environment variables for testing
process.env.DYNAMODB_TABLE = 'test-transactions';
process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-fraud-alerts';
process.env.AWS_REGION = 'us-east-1';

// Global test utilities
global.createMockKinesisRecord = (transactionData) => {
    return {
        kinesis: {
            sequenceNumber: 'test-sequence-' + Date.now(),
            data: Buffer.from(JSON.stringify(transactionData)).toString('base64')
        }
    };
};

global.createMockTransaction = (overrides = {}) => {
    return {
        transactionId: 'txn_' + Date.now(),
        cardId: 'card_test123',
        amount: 100.50,
        location: 'New York, NY',
        timestamp: new Date().toISOString(),
        ...overrides
    };
};

// Clear transaction cache before each test
beforeEach(() => {
    // Clear the in-memory transaction cache
    const index = require('./index');
    if (index.transactionCache) {
        index.transactionCache.clear();
    }
    
    // Reset all mocks
    jest.clearAllMocks();
}); 