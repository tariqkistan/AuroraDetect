const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });

// Initialize AWS services
const dynamodb = new AWS.DynamoDB();
const sns = new AWS.SNS();

// Resource names
const DYNAMODB_TABLE = 'AuroraDetect-Transactions';
const SNS_TOPIC_NAME = 'AuroraDetect-Alerts';

async function setupAWSResources() {
    try {
        console.log('Setting up AWS resources for AuroraDetect...');
        
        // Create DynamoDB table
        console.log(`Creating DynamoDB table: ${DYNAMODB_TABLE}`);
        try {
            const tableParams = {
                TableName: DYNAMODB_TABLE,
                KeySchema: [
                    { AttributeName: 'transactionId', KeyType: 'HASH' }
                ],
                AttributeDefinitions: [
                    { AttributeName: 'transactionId', AttributeType: 'S' },
                    { AttributeName: 'cardId', AttributeType: 'S' }
                ],
                GlobalSecondaryIndexes: [
                    {
                        IndexName: 'CardIndex',
                        KeySchema: [
                            { AttributeName: 'cardId', KeyType: 'HASH' }
                        ],
                        Projection: {
                            ProjectionType: 'ALL'
                        },
                        ProvisionedThroughput: {
                            ReadCapacityUnits: 5,
                            WriteCapacityUnits: 5
                        }
                    }
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            };
            
            await dynamodb.createTable(tableParams).promise();
            console.log(`DynamoDB table ${DYNAMODB_TABLE} created successfully.`);
        } catch (error) {
            if (error.code === 'ResourceInUseException') {
                console.log(`DynamoDB table ${DYNAMODB_TABLE} already exists.`);
            } else {
                throw error;
            }
        }
        
        // Create SNS topic
        console.log(`Creating SNS topic: ${SNS_TOPIC_NAME}`);
        let topicArn;
        try {
            const topicResponse = await sns.createTopic({ Name: SNS_TOPIC_NAME }).promise();
            topicArn = topicResponse.TopicArn;
            console.log(`SNS topic created with ARN: ${topicArn}`);
        } catch (error) {
            console.error('Error creating SNS topic:', error);
            throw error;
        }
        
        // Create .env file
        const envContent = `AWS_REGION=us-east-1
DYNAMODB_TABLE=${DYNAMODB_TABLE}
SNS_TOPIC_ARN=${topicArn}`;
        
        fs.writeFileSync(path.join(__dirname, '.env'), envContent);
        console.log('.env file created with AWS resource configuration.');
        
        console.log('AWS resources setup complete!');
        console.log(`DynamoDB Table: ${DYNAMODB_TABLE}`);
        console.log(`SNS Topic ARN: ${topicArn}`);
        
        return {
            dynamodbTable: DYNAMODB_TABLE,
            snsTopicArn: topicArn
        };
    } catch (error) {
        console.error('Error setting up AWS resources:', error);
        throw error;
    }
}

// Run setup if executed directly
if (require.main === module) {
    setupAWSResources()
        .then(resources => {
            console.log('Setup completed successfully!');
        })
        .catch(error => {
            console.error('Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupAWSResources }; 