# 🌟 AuroraDetect Frontend Dashboard

A beautiful, modern Next.js dashboard for monitoring the AuroraDetect real-time fraud detection system.

## ✨ Features

- **Real-time Monitoring**: Live transaction processing visualization
- **Fraud Detection Dashboard**: Overview of fraud patterns and alerts
- **Transaction Management**: View and analyze transaction history
- **Test Interface**: Send test transactions to verify system functionality
- **AWS Integration**: Direct connection to DynamoDB, Kinesis, and CloudWatch
- **Modern UI**: Built with Next.js 15, TypeScript, Tailwind CSS, and Shadcn UI

## 🏗️ Architecture

```
Frontend Dashboard (Next.js)
    ↓
API Routes (/api/*)
    ↓
AWS Services (DynamoDB, Kinesis, CloudWatch)
    ↓
AuroraDetect Backend (Lambda, SNS)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- AWS account with AuroraDetect backend deployed
- AWS credentials configured

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd aurora-detect-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your AWS configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open dashboard**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with your AWS configuration:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# DynamoDB Configuration
DYNAMODB_TABLE=aurora-detect-dev-transactions

# Kinesis Configuration
KINESIS_STREAM_NAME=aurora-detect-dev-transaction-stream

# Lambda Configuration
LAMBDA_FUNCTION_NAME=aurora-detect-dev-fraud-detection

# SNS Configuration
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:907651659588:aurora-detect-dev-fraud-alerts
```

## 📊 Dashboard Sections

### 1. Overview Tab
- **Key Metrics**: Total transactions, fraud detected, processing time, system health
- **Fraud Trends Chart**: 24-hour fraud detection patterns
- **Recent Alerts**: Latest fraud detection events

### 2. Transactions Tab
- **Transaction History**: Complete list of processed transactions
- **Fraud Indicators**: Visual fraud flags and reasons
- **Filtering**: Search and filter capabilities

### 3. Real-time Tab
- **Live Monitoring**: Real-time transaction processing simulation
- **Processing Stats**: Live metrics and performance data
- **Transaction Stream**: Live feed of incoming transactions

### 4. Testing Tab
- **Quick Tests**: Predefined fraud detection scenarios
- **Custom Transactions**: Send custom test transactions
- **Results Monitoring**: Track test transaction results

## 🛠️ API Endpoints

### GET /api/transactions
Fetch transactions from DynamoDB

**Query Parameters:**
- `limit`: Number of transactions to fetch (default: 10)
- `fraudOnly`: Return only fraud transactions (default: false)

**Response:**
```json
{
  "success": true,
  "transactions": [...],
  "count": 10
}
```

### POST /api/transactions
Send transaction to Kinesis stream

**Request Body:**
```json
{
  "cardId": "card_test_1234",
  "amount": "150.75",
  "location": "New York, NY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction sent successfully",
  "transactionId": "txn_web_1234567890",
  "shardId": "shardId-000000000000",
  "sequenceNumber": "49664832642582568714737337394864095001148878384305012738"
}
```

### GET /api/stats
Fetch system statistics and metrics

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalTransactions": 1247,
    "fraudDetected": 23,
    "fraudRate": 1.8,
    "avgProcessingTime": 245,
    "systemHealth": 99.9,
    "activeCards": 8432
  },
  "timestamp": "2025-07-03T14:51:23.863Z"
}
```

## 🎨 UI Components

Built with **Shadcn UI** components:

- **Cards**: Metric displays and content containers
- **Tables**: Transaction history and data display
- **Charts**: Fraud trend visualization (Recharts)
- **Forms**: Test transaction input
- **Alerts**: Status and notification display
- **Badges**: Status indicators and labels

## 🔍 Monitoring & Debugging

### Development Tools
- **Next.js Dev Tools**: Built-in development features
- **TypeScript**: Type safety and IntelliSense
- **ESLint**: Code quality and consistency
- **Tailwind CSS**: Utility-first styling

### Production Monitoring
- **Vercel Analytics**: Performance monitoring (when deployed)
- **AWS CloudWatch**: Backend service monitoring
- **Error Boundaries**: Graceful error handling

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect repository to Vercel**
2. **Configure environment variables**
3. **Deploy automatically**

### Manual Deployment
```bash
# Build production version
npm run build

# Start production server
npm start
```

## 🧪 Testing Fraud Detection

### Quick Test Scenarios

1. **Normal Transaction**
   - Amount: $150.75
   - Expected: No fraud detection

2. **High Amount Fraud**
   - Amount: $25,000
   - Expected: Fraud alert (exceeds $20,000 threshold)

3. **Velocity Fraud**
   - Multiple transactions in short time
   - Expected: Fraud alert (velocity detection)

### Custom Testing
Use the Testing tab to send custom transactions with:
- Custom card IDs
- Specific amounts
- Different locations
- Various fraud scenarios

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- **Desktop**: Full dashboard experience
- **Tablet**: Optimized layout
- **Mobile**: Compact view with essential features

## 🔒 Security

- **Environment Variables**: Sensitive data stored securely
- **API Routes**: Server-side AWS SDK usage
- **Input Validation**: Form and API input sanitization
- **Error Handling**: Graceful error management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the [main AuroraDetect documentation](../README.md)
- Create an issue in the GitHub repository
- Contact the AuroraDetect team

---

**Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and Shadcn UI** 
