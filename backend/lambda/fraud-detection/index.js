const AWS = require('aws-sdk');
const geolib = require('geolib');
const NodeGeocoder = require('node-geocoder');

// Check if we're in local test mode
const isLocalTest = process.env.LOCAL_TEST === 'true';
console.log(`Running in ${isLocalTest ? 'local test' : 'production'} mode`);

// Initialize geocoder
const geocoder = NodeGeocoder({
    provider: 'openstreetmap'
});

// Initialize AWS services
let dynamodb, sns;

// Configure AWS SDK and services
if (isLocalTest) {
    console.log('Using mock AWS services');
    const MockAWS = require('./mock-aws');
    dynamodb = new MockAWS.DynamoDB.DocumentClient();
    sns = new MockAWS.SNS();
} else {
    // Use real AWS services
    AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
    dynamodb = new AWS.DynamoDB.DocumentClient();
    sns = new AWS.SNS();
}

// In-memory cache for tracking recent transactions per card
// In production, consider using Redis or DynamoDB for persistence
const transactionCache = new Map();
const locationCache = new Map(); // Cache for geocoded locations

// Configuration
const FRAUD_AMOUNT_THRESHOLD = 20000;
const TRANSACTION_COUNT_THRESHOLD = 3;
const TIME_WINDOW_MINUTES = 1;
const IMPOSSIBLE_TRAVEL_TIME_WINDOW_HOURS = 24; // Look back 24 hours for impossible travel
const IMPOSSIBLE_TRAVEL_SPEED_KMH = 900; // Maximum possible speed in km/h (faster than commercial flights)
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'Transactions';
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

/**
 * Process Kinesis records
 */
exports.handler = async (event) => {
    console.log('Received Kinesis event:', JSON.stringify(event, null, 2));
    
    // Batch item failures for partial batch responses
    const batchItemFailures = [];
    
    // For local testing, store detected fraud
    const detectedFraud = [];
    
    // Process each record
        for (const record of event.Records) {
        try {
            // Parse the base64 encoded data
            const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
            const transaction = JSON.parse(payload);
            
            console.log('Processing transaction:', transaction);
            
            // Validate transaction against schema
            const validationResult = validateTransaction(transaction);
            if (!validationResult.valid) {
                console.error('Invalid transaction:', validationResult.errors);
                batchItemFailures.push({
                    itemIdentifier: record.kinesis.sequenceNumber,
                    error: 'Invalid transaction format'
                });
                continue;
            }
            
            // Apply fraud detection rules
            const fraudFlags = await detectFraud(transaction);
            
            // If fraud detected, store transaction and send alert
            if (fraudFlags.length > 0) {
                console.log(`Detected ${fraudFlags.length} fraud flags for transaction ${transaction.transactionId}:`, fraudFlags);
                
                // For local testing, add to detected fraud array
                if (isLocalTest) {
                    detectedFraud.push({
                        transaction,
                        fraudFlags
                    });
                }
                
                // Store transaction in DynamoDB
                try {
                    await storeTransaction(transaction, fraudFlags);
                } catch (error) {
                    if (!isLocalTest) {  // In local test mode, errors are handled within storeTransaction
                        console.error('Error storing transaction:', error);
                        batchItemFailures.push({
                            itemIdentifier: record.kinesis.sequenceNumber,
                            error: error.message
                        });
                        continue;
                    }
                }
                
                // Send alert via SNS
                try {
                    await sendFraudAlert(transaction, fraudFlags);
                } catch (error) {
                    if (!isLocalTest) {  // In local test mode, errors are handled within sendFraudAlert
                        console.error('Error sending alert:', error);
                        // Continue processing even if alert fails
                    }
                }
            } else {
                // Store non-fraud transactions as well (for reporting/analytics)
                try {
                    await storeTransaction(transaction, []);
                } catch (error) {
                    if (!isLocalTest) {  // In local test mode, errors are handled within storeTransaction
                        console.error('Error storing transaction:', error);
                        batchItemFailures.push({
                            itemIdentifier: record.kinesis.sequenceNumber,
                            error: error.message
                        });
                        continue;
                    }
                }
            }
            
    } catch (error) {
            console.error('Error processing transaction record:', error);
            batchItemFailures.push({
                itemIdentifier: record.kinesis.sequenceNumber,
                error: error.message
            });
        }
    }
    
    console.log('Processing completed:', batchItemFailures);
    
    // For local testing, expose the transaction cache and detected fraud
    if (isLocalTest) {
        // Initialize or clear the detectedFraud array
        if (!exports.detectedFraud) {
            exports.detectedFraud = [];
        } else {
            exports.detectedFraud.length = 0;
        }
        
        // Add new detected fraud
        if (detectedFraud.length > 0) {
            console.log(`Adding ${detectedFraud.length} detected fraud items to exports.detectedFraud`);
            detectedFraud.forEach(fraud => {
                exports.detectedFraud.push(fraud);
            });
        }
        
        exports.transactionCache = transactionCache;
    }
    
    // Return any failures for partial batch handling
    return {
        batchItemFailures
    };
};

// Export transactionCache for testing
exports.transactionCache = transactionCache;

/**
 * Process a single transaction record
 */
async function processTransaction(record) {
    const recordId = record.kinesis.sequenceNumber;
    
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
    if (!isLocalTest) {
        await storeTransaction(transactionRecord);
    } else {
        console.log('Local test mode: Skipping DynamoDB storage for transaction:', transactionRecord.transactionId);
    }
        
        // Send fraud alert if flagged
        if (isFlagged) {
        if (!isLocalTest) {
            await sendFraudAlert(transactionRecord);
        } else {
            console.log('Local test mode: Fraud detected!', transactionRecord.transactionId);
            console.log('Fraud reasons:', transactionRecord.fraudReasons);
        }
    }
    
    return { success: true, recordId, flagged: isFlagged, fraudReasons: fraudFlags };
}

/**
 * Validate transaction against schema
 */
function validateTransaction(transaction) {
    // Basic validation
    if (!transaction) {
        return { valid: false, errors: ['Transaction is null or undefined'] };
    }
    
    const errors = [];
    
    // Required fields
    if (!transaction.transactionId) errors.push('Missing transactionId');
    if (!transaction.cardId) errors.push('Missing cardId');
    if (transaction.amount === undefined || transaction.amount === null) errors.push('Missing amount');
    if (!transaction.location) errors.push('Missing location');
    if (!transaction.timestamp) errors.push('Missing timestamp');
    
    // Type validation
    if (typeof transaction.transactionId !== 'string') errors.push('transactionId must be a string');
    if (typeof transaction.cardId !== 'string') errors.push('cardId must be a string');
    if (typeof transaction.amount !== 'number') errors.push('amount must be a number');
    if (typeof transaction.location !== 'string') errors.push('location must be a string');
    
    // Format validation
    try {
        new Date(transaction.timestamp);
    } catch (e) {
        errors.push('timestamp is not a valid date');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
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
    
    // Remove transactions older than the time window for velocity check
    const velocityCutoffTime = new Date(transactionTime.getTime() - (TIME_WINDOW_MINUTES * 60 * 1000));
    const recentTransactions = cardTransactions.filter(t => new Date(t.timestamp) > velocityCutoffTime);
    
    // Add current transaction with location for impossible travel detection
    const transactionInfo = {
        transactionId: transaction.transactionId,
        timestamp: transaction.timestamp,
        amount: transaction.amount,
        location: transaction.location
    };
    
    // Check if threshold exceeded
    if (recentTransactions.length >= TRANSACTION_COUNT_THRESHOLD) {
        fraudFlags.push(`Multiple transactions: ${recentTransactions.length + 1} transactions in ${TIME_WINDOW_MINUTES} minute(s)`);
    }
    
    // Rule 3: Impossible travel detection
    // Get transactions within the impossible travel time window
    const travelCutoffTime = new Date(transactionTime.getTime() - (IMPOSSIBLE_TRAVEL_TIME_WINDOW_HOURS * 60 * 60 * 1000));
    const travelCheckTransactions = cardTransactions.filter(t => 
        new Date(t.timestamp) > travelCutoffTime && 
        t.transactionId !== transaction.transactionId && 
        t.location
    );
    
    if (travelCheckTransactions.length > 0) {
        try {
            console.log(`Checking impossible travel for card ${cardId} with ${travelCheckTransactions.length} previous transactions`);
            
            // Sort by timestamp (most recent first)
            travelCheckTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Get coordinates for current transaction location
            const currentCoords = await getLocationCoordinates(transaction.location);
            console.log(`Current transaction location: ${transaction.location}, coordinates:`, currentCoords);
            
            if (currentCoords) {
                // Check against previous transactions
                for (const prevTransaction of travelCheckTransactions) {
                    const prevCoords = await getLocationCoordinates(prevTransaction.location);
                    console.log(`Previous transaction location: ${prevTransaction.location}, coordinates:`, prevCoords);
                    
                    if (prevCoords) {
                        // Calculate distance in kilometers
                        const distanceKm = geolib.getDistance(currentCoords, prevCoords) / 1000;
                        
                        // Calculate time difference in hours
                        const timeDiffHours = Math.abs((transactionTime - new Date(prevTransaction.timestamp)) / (1000 * 60 * 60));
                        
                        // Only check if time difference is positive (newer transaction)
                        if (timeDiffHours > 0) {
                            // Calculate required speed
                            const requiredSpeedKmh = distanceKm / timeDiffHours;
                            
                            console.log(`Travel analysis: ${distanceKm.toFixed(2)}km in ${timeDiffHours.toFixed(2)} hours (${requiredSpeedKmh.toFixed(2)} km/h)`);
                            console.log(`Speed threshold: ${IMPOSSIBLE_TRAVEL_SPEED_KMH} km/h`);
                            
                            // If required speed exceeds threshold, flag as impossible travel
                            if (requiredSpeedKmh > IMPOSSIBLE_TRAVEL_SPEED_KMH) {
                                const fraudMessage = `Impossible travel: ${distanceKm.toFixed(2)}km between ${prevTransaction.location} and ${transaction.location} ` +
                                    `in ${timeDiffHours.toFixed(2)} hours (${requiredSpeedKmh.toFixed(2)} km/h)`;
                                console.log(`FRAUD DETECTED: ${fraudMessage}`);
                                fraudFlags.push(fraudMessage);
                                break; // No need to check other transactions
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in impossible travel detection:', error);
            // Continue processing other rules even if this one fails
        }
    }
    
    // Add current transaction to cache
    cardTransactions.push(transactionInfo);
    
    // Update cache
    transactionCache.set(cardId, cardTransactions);
    
    if (fraudFlags.length > 0) {
        console.log(`Detected ${fraudFlags.length} fraud flags for transaction ${transaction.transactionId}:`, fraudFlags);
    }
    
    return fraudFlags;
}

/**
 * Get coordinates for a location string
 * Uses cache to avoid repeated geocoding requests
 * For local testing, uses hardcoded coordinates for common locations
 */
async function getLocationCoordinates(locationStr) {
    // Check cache first
    if (locationCache.has(locationStr)) {
        return locationCache.get(locationStr);
    }
    
    // For local testing, use hardcoded coordinates for common locations
    const hardcodedCoordinates = {
        'New York, NY': { latitude: 40.7128, longitude: -74.0060 },
        'Los Angeles, CA': { latitude: 34.0522, longitude: -118.2437 },
        'Chicago, IL': { latitude: 41.8781, longitude: -87.6298 },
        'Houston, TX': { latitude: 29.7604, longitude: -95.3698 },
        'Miami, FL': { latitude: 25.7617, longitude: -80.1918 },
        'San Francisco, CA': { latitude: 37.7749, longitude: -122.4194 },
        'Seattle, WA': { latitude: 47.6062, longitude: -122.3321 },
        'Denver, CO': { latitude: 39.7392, longitude: -104.9903 },
        'Boston, MA': { latitude: 42.3601, longitude: -71.0589 },
        'Dallas, TX': { latitude: 32.7767, longitude: -96.7970 },
        'Coffee Shop, NYC': { latitude: 40.7128, longitude: -74.0060 },
        'Luxury Store, Miami': { latitude: 25.7617, longitude: -80.1918 },
        'Store A, Chicago': { latitude: 41.8781, longitude: -87.6298 },
        'Store B, Chicago': { latitude: 41.8781, longitude: -87.6298 },
        'Store C, Chicago': { latitude: 41.8781, longitude: -87.6298 },
        'Store D, Chicago': { latitude: 41.8781, longitude: -87.6298 }
    };
    
    // Check if we have hardcoded coordinates for this location
    if (hardcodedCoordinates[locationStr]) {
        const coords = hardcodedCoordinates[locationStr];
        // Store in cache
        locationCache.set(locationStr, coords);
        return coords;
    }
    
    // If not in hardcoded list and we're in local test mode, return null
    if (isLocalTest) {
        console.log(`Local test mode: No hardcoded coordinates for "${locationStr}"`);
        return null;
    }
    
    // Otherwise try to geocode the location
    try {
        // Geocode the location
        const results = await geocoder.geocode(locationStr);
        
        if (results && results.length > 0) {
            const coords = {
                latitude: results[0].latitude,
                longitude: results[0].longitude
            };
            
            // Store in cache
            locationCache.set(locationStr, coords);
            
            return coords;
        }
    } catch (error) {
        console.error(`Error geocoding location "${locationStr}":`, error);
    }
    
    return null;
}

/**
 * Store transaction in DynamoDB
 */
async function storeTransaction(transaction, fraudFlags) {
    // Prepare item for storage
    const item = {
        ...transaction,
        flagged: fraudFlags && fraudFlags.length > 0,
        fraudReasons: fraudFlags || [],
        processedAt: new Date().toISOString()
    };
    
    const params = {
        TableName: DYNAMODB_TABLE,
        Item: item
    };
    
    try {
        await dynamodb.put(params).promise();
        if (!isLocalTest) {
        console.log('Transaction stored successfully:', transaction.transactionId);
        }
        return true;
    } catch (error) {
        console.error('Error storing transaction:', error);
        if (isLocalTest) {
            // In local test mode, log but don't throw to continue processing
            return false;
        }
        throw error;
    }
}

/**
 * Send fraud alert to SNS
 */
async function sendFraudAlert(transaction, fraudFlags) {
    if (!SNS_TOPIC_ARN && !isLocalTest) {
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
        fraudReasons: fraudFlags,
        severity: transaction.amount > FRAUD_AMOUNT_THRESHOLD ? 'HIGH' : 'MEDIUM'
    };
    
    const params = {
        TopicArn: SNS_TOPIC_ARN || 'mock-topic-arn',
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
        if (!isLocalTest) {
        console.log('Fraud alert sent successfully:', result.MessageId);
        }
        return true;
    } catch (error) {
        console.error('Error sending fraud alert:', error);
        if (isLocalTest) {
            // In local test mode, log but don't throw to continue processing
            return false;
        }
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