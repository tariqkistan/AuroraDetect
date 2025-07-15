const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

// Initialize DynamoDB client
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Table name
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'AuroraDetect-Transactions';

async function scanTransactions() {
    try {
        console.log(`Scanning DynamoDB table: ${DYNAMODB_TABLE}`);
        
        const params = {
            TableName: DYNAMODB_TABLE
        };
        
        const result = await dynamodb.scan(params).promise();
        
        console.log(`Found ${result.Items.length} transactions:`);
        console.log(JSON.stringify(result.Items, null, 2));
        
        // Group transactions by fraud status
        const fraudTransactions = result.Items.filter(item => item.flagged);
        const normalTransactions = result.Items.filter(item => !item.flagged);
        
        console.log(`\nFraud Transactions (${fraudTransactions.length}):`);
        fraudTransactions.forEach(item => {
            console.log(`- ID: ${item.transactionId}`);
            console.log(`  Card: ${item.cardId}`);
            console.log(`  Amount: $${item.amount}`);
            console.log(`  Location: ${item.location}`);
            console.log(`  Timestamp: ${item.timestamp}`);
            console.log(`  Fraud Reasons: ${item.fraudReasons.join(', ')}`);
            console.log('');
        });
        
        console.log(`\nNormal Transactions (${normalTransactions.length}):`);
        normalTransactions.forEach(item => {
            console.log(`- ID: ${item.transactionId}`);
            console.log(`  Card: ${item.cardId}`);
            console.log(`  Amount: $${item.amount}`);
            console.log(`  Location: ${item.location}`);
            console.log(`  Timestamp: ${item.timestamp}`);
            console.log('');
        });
        
        return result.Items;
    } catch (error) {
        console.error('Error scanning DynamoDB:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    scanTransactions()
        .then(() => {
            console.log('DynamoDB scan completed successfully!');
        })
        .catch(error => {
            console.error('DynamoDB scan failed:', error);
            process.exit(1);
        });
}

module.exports = { scanTransactions }; 