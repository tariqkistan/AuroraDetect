#!/bin/bash

# AuroraDetect Deployment Script
# This script deploys the fraud detection Lambda function and infrastructure

set -e  # Exit on any error

# Configuration
PROJECT_NAME="aurora-detect"
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
LAMBDA_DIR="backend/lambda/fraud-detection"
INFRASTRUCTURE_DIR="backend/infrastructure"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured. Please run 'aws configure'."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure..."
    
    local stack_name="${PROJECT_NAME}-${ENVIRONMENT}-infrastructure"
    local template_file="${INFRASTRUCTURE_DIR}/cloudformation-template.yaml"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$AWS_REGION" &> /dev/null; then
        log_info "Updating existing stack: $stack_name"
        aws cloudformation update-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --parameters ParameterKey=ProjectName,ParameterValue="$PROJECT_NAME" \
                        ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "$AWS_REGION"
    else
        log_info "Creating new stack: $stack_name"
        aws cloudformation create-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --parameters ParameterKey=ProjectName,ParameterValue="$PROJECT_NAME" \
                        ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "$AWS_REGION"
    fi
    
    log_info "Waiting for stack operation to complete..."
    aws cloudformation wait stack-update-complete --stack-name "$stack_name" --region "$AWS_REGION" 2>/dev/null || \
    aws cloudformation wait stack-create-complete --stack-name "$stack_name" --region "$AWS_REGION"
    
    log_success "Infrastructure deployment completed"
}

# Package Lambda function
package_lambda() {
    log_info "Packaging Lambda function..."
    
    cd "$LAMBDA_DIR"
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install --production
    
    # Create deployment package
    log_info "Creating deployment package..."
    zip -r "../../../fraud-detection-lambda.zip" . -x "*.git*" "node_modules/.cache/*" "*.env*" "local-test.js" "*.md"
    
    cd - > /dev/null
    
    log_success "Lambda function packaged successfully"
}

# Deploy Lambda function
deploy_lambda() {
    log_info "Deploying Lambda function..."
    
    local function_name="${PROJECT_NAME}-${ENVIRONMENT}-fraud-detection"
    local stack_name="${PROJECT_NAME}-${ENVIRONMENT}-infrastructure"
    
    # Get environment variables from CloudFormation outputs
    local dynamodb_table=$(aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='DynamoDBTableName'].OutputValue" \
        --output text)
    
    local sns_topic_arn=$(aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='SNSTopicArn'].OutputValue" \
        --output text)
    
    # Update Lambda function code
    log_info "Updating Lambda function code..."
    aws lambda update-function-code \
        --function-name "$function_name" \
        --zip-file fileb://fraud-detection-lambda.zip \
        --region "$AWS_REGION"
    
    # Update environment variables
    log_info "Updating environment variables..."
    aws lambda update-function-configuration \
        --function-name "$function_name" \
        --environment "Variables={DYNAMODB_TABLE=$dynamodb_table,SNS_TOPIC_ARN=$sns_topic_arn,NODE_ENV=$ENVIRONMENT}" \
        --region "$AWS_REGION"
    
    # Wait for update to complete
    aws lambda wait function-updated --function-name "$function_name" --region "$AWS_REGION"
    
    log_success "Lambda function deployed successfully"
}

# Get stack outputs
get_outputs() {
    log_info "Getting deployment outputs..."
    
    local stack_name="${PROJECT_NAME}-${ENVIRONMENT}-infrastructure"
    
    echo ""
    echo "=== Deployment Outputs ==="
    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$AWS_REGION" \
        --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" \
        --output table
    echo ""
}

# Cleanup
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f fraud-detection-lambda.zip
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    echo "🚀 AuroraDetect Deployment Script"
    echo "=================================="
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo ""
    
    check_prerequisites
    deploy_infrastructure
    package_lambda
    deploy_lambda
    get_outputs
    cleanup
    
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test the Lambda function with sample data"
    echo "2. Set up monitoring and alerts"
    echo "3. Configure your frontend to send data to the Kinesis stream"
}

# Handle script arguments
case "${1:-}" in
    "dev"|"staging"|"prod")
        main
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [environment]"
        echo ""
        echo "Arguments:"
        echo "  environment    Deployment environment (dev, staging, prod). Default: dev"
        echo ""
        echo "Environment variables:"
        echo "  AWS_REGION     AWS region for deployment. Default: us-east-1"
        echo ""
        echo "Examples:"
        echo "  $0 dev         Deploy to development environment"
        echo "  $0 prod        Deploy to production environment"
        ;;
    *)
        if [ -n "${1:-}" ]; then
            log_error "Invalid environment: $1"
            echo "Valid environments: dev, staging, prod"
            exit 1
        else
            main
        fi
        ;;
esac 