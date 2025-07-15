/**
 * Mock AWS services for local testing
 */

// In-memory storage for transactions
const transactionStore = new Map();

// Mock DynamoDB implementation
const mockDynamoDB = {
    put: (params) => {
        return {
            promise: () => {
                console.log(`[Mock DynamoDB] Storing transaction: ${params.Item.transactionId}`);
                // Store in memory
                const item = params.Item;
                if (!transactionStore.has(params.TableName)) {
                    transactionStore.set(params.TableName, new Map());
                }
                transactionStore.get(params.TableName).set(item.transactionId, item);
                return Promise.resolve({ success: true });
            }
        };
    },
    query: (params) => {
        return {
            promise: () => {
                console.log(`[Mock DynamoDB] Querying table: ${params.TableName}`);
                // Query in-memory store
                const tableData = transactionStore.get(params.TableName) || new Map();
                const items = Array.from(tableData.values());
                // Filter by key condition expression (simplified implementation)
                let filteredItems = items;
                if (params.KeyConditionExpression && params.KeyConditionExpression.includes('cardId')) {
                    const cardId = params.ExpressionAttributeValues[':cardId'];
                    filteredItems = items.filter(item => item.cardId === cardId);
                }
                return Promise.resolve({ Items: filteredItems });
            }
        };
    }
};

// Mock SNS implementation
const mockSNS = {
    publish: (params) => {
        return {
            promise: () => {
                console.log(`[Mock SNS] Published message: ${params.Subject}`);
                console.log(`[Mock SNS] Message: ${params.Message.substring(0, 100)}...`);
                return Promise.resolve({ MessageId: `mock-message-${Date.now()}` });
            }
        };
    }
};

module.exports = {
    DynamoDB: {
        DocumentClient: function() {
            return mockDynamoDB;
        }
    },
    SNS: function() {
        return mockSNS;
    }
}; 