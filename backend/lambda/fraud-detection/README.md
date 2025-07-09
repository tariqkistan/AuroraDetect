# AuroraDetect Fraud Detection Lambda

This Lambda function is part of the AuroraDetect real-time fraud detection system. It processes transaction events from a Kinesis Data Stream, applies fraud detection rules, stores transactions in DynamoDB, and sends alerts via SNS.

## 🏗️ Architecture

```
Kinesis Data Stream (TransactionStream) 
    ↓
Lambda Function (fraud-detection)
    ↓
DynamoDB (Transactions) + SNS (fraud-alerts)
```

## 📋 Features

- **Real-time Processing**: Processes transactions from Kinesis Data Stream
- **Fraud Detection Rules**:
  - High amount threshold (>$20,000)
  - Multiple transactions per card in short time window (>3 in 1 minute)
- **Data Storage**: Stores all transactions in DynamoDB with fraud flags
- **Alert System**: Publishes fraud alerts to SNS topic
- **Error Handling**: Robust error handling with partial batch failure support

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or later
- AWS CLI configured
- AWS account with appropriate permissions

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS configuration
   ```

3. **Run Local Tests**
   ```bash
   npm run local
   ```

### Deployment

1. **Package the Function**
   ```bash
   zip -r fraud-detection-lambda.zip . -x "*.git*" "node_modules/.cache/*" "*.env*"
   ```

2. **Deploy via AWS CLI**
   ```bash
   aws lambda create-function \
     --function-name aurora-detect-fraud-detection \
     --runtime nodejs18.x \
     --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
     --handler index.handler \
     --zip-file fileb://fraud-detection-lambda.zip \
     --environment Variables='{DYNAMODB_TABLE=Transactions,SNS_TOPIC_ARN=arn:aws:sns:REGION:ACCOUNT:fraud-alerts}'
   ```

## 📊 Transaction Schema

```json
{
  "transactionId": "txn_1234567890",
  "cardId": "card_abcd1234",
  "amount": 150.75,
  "location": "New York, NY",
  "timestamp": "2024-01-15T14:30:00.000Z"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DYNAMODB_TABLE` | DynamoDB table name for storing transactions | Yes |
| `SNS_TOPIC_ARN` | SNS topic ARN for fraud alerts | Yes |
| `AWS_REGION` | AWS region | Yes |

### Fraud Detection Rules

| Rule | Threshold | Description |
|------|-----------|-------------|
| High Amount | >$20,000 | Flags transactions above threshold |
| Velocity Check | >3 transactions/minute | Flags rapid successive transactions |

## 🛡️ IAM Permissions

The Lambda function requires the following permissions:

- **CloudWatch Logs**: Create log groups and streams
- **Kinesis**: Read from TransactionStream
- **DynamoDB**: Read/write to Transactions table
- **SNS**: Publish to fraud-alerts topic

See `iam-policy.json` for the complete policy document.

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Local Testing
```bash
npm run local
```

### Test Scenarios

1. **Normal Transaction**: Regular transaction under thresholds
2. **High Amount Fraud**: Transaction exceeding $20,000
3. **Velocity Fraud**: Multiple transactions in short time window

## 📈 Monitoring

### CloudWatch Metrics

- Function duration
- Error rate
- Invocation count
- Throttles

### Custom Metrics

- Fraud detection rate
- Transaction processing volume
- Alert generation frequency

## 🔄 Scaling Considerations

### Current Implementation
- In-memory cache for velocity checks
- Single Lambda instance processing

### Production Recommendations
- Use Redis/ElastiCache for distributed caching
- Implement DynamoDB-based velocity tracking
- Add dead letter queues for failed processing
- Implement circuit breakers for external dependencies

## 🐛 Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all required environment variables are set
   - Check Lambda configuration in AWS Console

2. **DynamoDB Access Errors**
   - Verify IAM permissions
   - Check table exists and is in correct region

3. **SNS Publishing Failures**
   - Verify topic ARN is correct
   - Check SNS permissions in IAM policy

### Debugging

Enable detailed logging by setting log level:
```javascript
console.log('Debug info:', JSON.stringify(data, null, 2));
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact the AuroraDetect team 