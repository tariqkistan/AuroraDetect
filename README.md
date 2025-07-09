# AuroraDetect - Fraud Detection System

AuroraDetect is a real-time fraud detection system that monitors financial transactions and identifies potentially fraudulent activities.

## Features

- Real-time transaction monitoring
- Fraud detection using AWS Lambda and Kinesis
- Dashboard with transaction metrics and visualization
- API endpoints for transaction processing and statistics

## Architecture

The system consists of:

1. **Frontend**: Next.js application with a dashboard for monitoring transactions and fraud alerts
2. **Backend**: AWS Lambda function for fraud detection, triggered by Kinesis streams
3. **Storage**: DynamoDB for storing transaction data
4. **Notifications**: SNS for fraud alerts

## Getting Started

### Prerequisites

- Node.js 18+
- AWS CLI configured with appropriate permissions
- AWS resources deployed (see backend setup)

### Frontend Development

1. Clone the repository
2. Install dependencies:
   ```
   cd aurora-detect-frontend
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend Setup

The backend uses AWS CloudFormation for infrastructure as code:

1. Deploy the CloudFormation stack:
   ```
   cd backend/scripts
   ./deploy.sh
   ```

2. This will create:
   - Kinesis Data Stream for transaction processing
   - Lambda function for fraud detection
   - DynamoDB table for transaction storage
   - SNS topic for fraud alerts

## API Endpoints

### `/api/transactions`

- `GET`: Retrieve recent transactions
- `POST`: Submit a new transaction for fraud detection

### `/api/stats`

- `GET`: Get system statistics and fraud metrics

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure the following environment variables:
   - `AWS_REGION`: The AWS region where your resources are deployed
   - `AWS_ACCESS_KEY_ID`: AWS access key with permissions for DynamoDB, Kinesis, and CloudWatch
   - `AWS_SECRET_ACCESS_KEY`: AWS secret key

4. Deploy using the Vercel dashboard or CLI:
   ```
   vercel --prod
   ```

## Testing

You can test the fraud detection system by:

1. Using the test transaction form in the dashboard
2. Directly calling the API endpoints with tools like Postman
3. Running the automated tests in the backend:
   ```
   cd backend/lambda/fraud-detection
   npm test
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
