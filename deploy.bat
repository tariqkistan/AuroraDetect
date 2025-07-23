@echo off
echo Setting up Vercel deployment...

echo Adding environment variables...
call vercel env add AWS_REGION
echo us-east-1

echo Adding DYNAMODB_TABLE...
call vercel env add DYNAMODB_TABLE
echo AuroraDetect-Transactions

echo Adding KINESIS_STREAM_NAME...
call vercel env add KINESIS_STREAM_NAME
echo aurora-detect-dev-transaction-stream

echo Deploying to Vercel...
call vercel --prod

echo Deployment process completed! 