# Deploy to Vercel PowerShell Script

Write-Host "Setting up Vercel deployment..." -ForegroundColor Green

# Add environment variables
Write-Host "Adding environment variables..." -ForegroundColor Yellow
vercel env add AWS_REGION production us-east-1
vercel env add DYNAMODB_TABLE production AuroraDetect-Transactions
vercel env add KINESIS_STREAM_NAME production aurora-detect-dev-transaction-stream

# Ask for AWS credentials
$AWS_ACCESS_KEY_ID = Read-Host "Enter your AWS Access Key ID"
$AWS_SECRET_ACCESS_KEY = Read-Host "Enter your AWS Secret Access Key" -AsSecureString
$AWS_SECRET_ACCESS_KEY_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AWS_SECRET_ACCESS_KEY))

# Add AWS credentials
Write-Host "Adding AWS credentials..." -ForegroundColor Yellow
vercel env add AWS_ACCESS_KEY_ID production $AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY production $AWS_SECRET_ACCESS_KEY_PLAIN

# Deploy to production
Write-Host "Deploying to Vercel..." -ForegroundColor Green
vercel --prod

Write-Host "Deployment process completed!" -ForegroundColor Green 