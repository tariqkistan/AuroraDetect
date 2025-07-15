# 🌟 AuroraDetect

Real-time fraud detection system built with AWS and Next.js

## Architecture

```
Frontend (Next.js/Vercel) → AWS Kinesis → Lambda → DynamoDB + SNS
```

## Quick Start

### Backend Deployment

1. **Configure AWS credentials**
   ```bash
   aws configure
   ```

2. **Deploy infrastructure**
   ```bash
   chmod +x backend/scripts/deploy.sh
   ./backend/scripts/deploy.sh dev
   ```

3. **Test the system**
   ```bash
   cd backend/lambda/fraud-detection
   npm install
   npm run local
   ```

### Frontend Development

1. **Install dependencies**
   ```bash
   cd aurora-detect-frontend
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Features

- **Real-time processing** via Kinesis Data Streams
- **Fraud detection rules**:
  - High amount threshold (>$20,000)
  - Velocity checks (>3 transactions/minute)
- **Data storage** in DynamoDB
- **Alert system** via SNS
- **Monitoring** with CloudWatch

## 🔧 Configuration

See `backend/lambda/fraud-detection/README.md` for detailed configuration.

## License

MIT License
