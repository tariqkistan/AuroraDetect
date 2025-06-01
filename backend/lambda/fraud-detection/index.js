const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

// In-memory cache for tracking recent transactions per card
// In production, consider using Redis or DynamoDB for persistence
const transactionCache = new Map();

// Configuration
const FRAUD_AMOUNT_THRESHOLD = 20000;
const TRANSACTION_COUNT_THRESHOLD = 3;
const TIME_WINDOW_MINUTES = 1;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'Transactions';
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

/**
 * Main Lambda handler for processing Kinesis stream events
 */
exports.handler = async (event) => {
    console.log('Received Kinesis event:', JSON.stringify(event, null, 2));
    
    const results = [];
    
    try {
        // Process each record in the Kinesis event
        for (const record of event.Records) {
            const result = await processTransaction(record);
            results.push(result);
        }
        
        console.log('Processing completed:', results);
        return {
            statusCode: 200,
            batchItemFailures: results.filter(r => !r.success).map(r => ({ itemIdentifier: r.recordId }))
        };
    } catch (error) {
        console.error('Error processing Kinesis event:', error);
        throw error;
    }
};

/**
 * Process a single transaction record
 */
async function processTransaction(record) {
    const recordId = record.kinesis.sequenceNumber;
    
    try {
        // Decode and parse the transaction data
        const transactionData = JSON.parse(
            Buffer.from(record.kinesis.data, 'base64').toString('utf-8')
        );
        
        console.log('Processing transaction:', transactionData);
        
        // Validate transaction structure
        const validationError = validateTransaction(transactionData);
        if (validationError) {
            console.error('Transaction validation failed:', validationError);
            return { success: false, recordId, error: validationError };
        }
        
        // Apply fraud detection rules
        const fraudFlags = await detectFraud(transactionData);
        const isFlagged = fraudFlags.length > 0;
        
        // Prepare transaction record for DynamoDB
        const transactionRecord = {
            transactionId: transactionData.transactionId,
            cardId: transactionData.cardId,
            amount: transactionData.amount,
            location: transactionData.location,
            timestamp: transactionData.timestamp,
            flagged: isFlagged,
            fraudReasons: fraudFlags,
            processedAt: new Date().toISOString()
        };
        
        // Store transaction in DynamoDB
        await storeTransaction(transactionRecord);
        
        // Send fraud alert if flagged
        if (isFlagged) {
            await sendFraudAlert(transactionRecord);
        }
        
        return { success: true, recordId, flagged: isFlagged };
        
    } catch (error) {
        console.error('Error processing transaction record:', error);
        return { success: false, recordId, error: error.message };
    }
}

/**
 * Validate transaction data structure
 */
function validateTransaction(transaction) {
    const requiredFields = ['transactionId', 'cardId', 'amount', 'location', 'timestamp'];
    
    for (const field of requiredFields) {
        if (!transaction[field]) {
            return `Missing required field: ${field}`;
        }
    }
    
    if (typeof transaction.amount !== 'number' || transaction.amount < 0) {
        return 'Amount must be a positive number';
    }
    
    if (!isValidISOString(transaction.timestamp)) {
        return 'Timestamp must be a valid ISO string';
    }
    
    return null;
}

/**
 * Apply fraud detection rules
 */
async function detectFraud(transaction) {
    const fraudFlags = [];
    
    // Rule 1: High amount threshold
    if (transaction.amount > FRAUD_AMOUNT_THRESHOLD) {
        fraudFlags.push(`High amount: $${transaction.amount} exceeds threshold of $${FRAUD_AMOUNT_THRESHOLD}`);
    }
    
    // Rule 2: Multiple transactions in short time window
    const cardId = transaction.cardId;
    const transactionTime = new Date(transaction.timestamp);
    
    // Get or initialize transaction history for this card
    if (!transactionCache.has(cardId)) {
        transactionCache.set(cardId, []);
    }
    
    const cardTransactions = transactionCache.get(cardId);
    
    // Remove transactions older than the time window
    const cutoffTime = new Date(transactionTime.getTime() - (TIME_WINDOW_MINUTES * 60 * 1000));
    const recentTransactions = cardTransactions.filter(t => new Date(t.timestamp) > cutoffTime);
    
    // Add current transaction
    recentTransactions.push({
        transactionId: transaction.transactionId,
        timestamp: transaction.timestamp,
        amount: transaction.amount
    });
    
    // Update cache
    transactionCache.set(cardId, recentTransactions);
    
    // Check if threshold exceeded
    if (recentTransactions.length > TRANSACTION_COUNT_THRESHOLD) {
        fraudFlags.push(`Multiple transactions: ${recentTransactions.length} transactions in ${TIME_WINDOW_MINUTES} minute(s)`);
    }
    
    return fraudFlags;
}

/**
 * Store transaction in DynamoDB
 */
async function storeTransaction(transaction) {
    const params = {
        TableName: DYNAMODB_TABLE,
        Item: transaction
    };
    
    try {
        await dynamodb.put(params).promise();
        console.log('Transaction stored successfully:', transaction.transactionId);
    } catch (error) {
        console.error('Error storing transaction:', error);
        throw error;
    }
}

/**
 * Send fraud alert to SNS
 */
async function sendFraudAlert(transaction) {
    if (!SNS_TOPIC_ARN) {
        console.warn('SNS_TOPIC_ARN not configured, skipping alert');
        return;
    }
    
    const alertMessage = {
        alertType: 'FRAUD_DETECTED',
        transactionId: transaction.transactionId,
        cardId: transaction.cardId,
        amount: transaction.amount,
        location: transaction.location,
        timestamp: transaction.timestamp,
        fraudReasons: transaction.fraudReasons,
        severity: transaction.amount > FRAUD_AMOUNT_THRESHOLD ? 'HIGH' : 'MEDIUM'
    };
    
    const params = {
        TopicArn: SNS_TOPIC_ARN,
        Message: JSON.stringify(alertMessage),
        Subject: `Fraud Alert - Transaction ${transaction.transactionId}`,
        MessageAttributes: {
            alertType: {
                DataType: 'String',
                StringValue: 'FRAUD_DETECTED'
            },
            severity: {
                DataType: 'String',
                StringValue: alertMessage.severity
            }
        }
    };
    
    try {
        const result = await sns.publish(params).promise();
        console.log('Fraud alert sent successfully:', result.MessageId);
    } catch (error) {
        console.error('Error sending fraud alert:', error);
        throw error;
    }
}

/**
 * Validate ISO string format
 */
function isValidISOString(dateString) {
    try {
        const date = new Date(dateString);
        return date.toISOString() === dateString;
    } catch {
        return false;
    }
} 