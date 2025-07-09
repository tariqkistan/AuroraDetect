# Testing Guide for AuroraDetect Fraud Detection Lambda

This document provides comprehensive information about testing the fraud detection Lambda function.

## 🧪 Test Structure

### Test Files Organization

```
__tests__/
├── index.test.js          # Main handler and core functionality tests
├── validation.test.js     # Transaction validation tests
└── integration.test.js    # End-to-end integration tests

jest.setup.js             # Jest configuration and AWS mocks
jest.config.js             # Jest configuration file
.eslintrc.js              # ESLint configuration
```

### Test Categories

1. **Unit Tests** (`index.test.js`)
   - Lambda handler functionality
   - Fraud detection rules
   - Data storage operations
   - Alert system

2. **Validation Tests** (`validation.test.js`)
   - Transaction data validation
   - Input sanitization
   - Error handling for invalid data

3. **Integration Tests** (`integration.test.js`)
   - End-to-end transaction processing
   - AWS service interactions
   - Performance and scalability

## 🚀 Running Tests

### Prerequisites

```bash
cd backend/lambda/fraud-detection
npm install
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with verbose output
npm run test:verbose

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run both linting and tests
npm run validate
```

### Coverage Reports

After running `npm run test:coverage`, you can view coverage reports:

- **Terminal**: Coverage summary displayed in console
- **HTML Report**: Open `coverage/lcov-report/index.html` in browser
- **LCOV**: `coverage/lcov.info` for CI/CD integration

## 🎯 Test Scenarios

### Fraud Detection Rules

#### High Amount Threshold
```javascript
// Tests transactions above $20,000
const highAmountTransaction = {
    transactionId: 'txn_high_amount',
    cardId: 'card_test',
    amount: 25000, // Above threshold
    location: 'New York, NY',
    timestamp: new Date().toISOString()
};
```

#### Velocity Detection
```javascript
// Tests multiple transactions within 1 minute
const rapidTransactions = [
    { timestamp: '2024-01-15T14:30:00.000Z' },
    { timestamp: '2024-01-15T14:30:15.000Z' }, // 15 seconds later
    { timestamp: '2024-01-15T14:30:30.000Z' }, // 30 seconds later
    { timestamp: '2024-01-15T14:30:45.000Z' }  // 45 seconds later (triggers fraud)
];
```

### Error Handling

#### Invalid Transaction Data
- Missing required fields
- Invalid data types
- Malformed timestamps
- Negative amounts

#### AWS Service Failures
- DynamoDB connection errors
- SNS publishing failures
- Partial batch failures

### Performance Testing

#### Batch Processing
- Large batches (10+ transactions)
- Mixed valid/invalid transactions
- Concurrent processing simulation

#### Memory and Timing
- Memory usage monitoring
- Processing time benchmarks
- Velocity cache performance

## 🔧 Mock Configuration

### AWS SDK Mocking

The test suite uses Jest mocks for AWS services:

```javascript
// DynamoDB Mock
const mockDynamoDB = {
    put: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
    })
};

// SNS Mock
const mockSNS = {
    publish: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' })
    })
};
```

### Test Utilities

Global helper functions available in all tests:

```javascript
// Create mock Kinesis record
const record = createMockKinesisRecord(transactionData);

// Create mock transaction
const transaction = createMockTransaction({
    amount: 100.50,
    cardId: 'custom_card_id'
});
```

## 📊 Test Coverage Goals

### Current Coverage Targets

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 95%
- **Lines**: > 90%

### Coverage Areas

✅ **Well Covered**
- Main handler function
- Fraud detection rules
- Transaction validation
- Error handling

🔄 **Needs Improvement**
- Edge cases in velocity detection
- AWS service error scenarios
- Performance edge cases

## 🐛 Debugging Tests

### Common Issues

1. **Mock Not Working**
   ```bash
   # Clear Jest cache
   npx jest --clearCache
   ```

2. **Async Test Failures**
   ```javascript
   // Ensure proper async/await usage
   it('should handle async operation', async () => {
       const result = await handler(event);
       expect(result).toBeDefined();
   });
   ```

3. **Environment Variables**
   ```javascript
   // Check jest.setup.js for proper env var setup
   process.env.DYNAMODB_TABLE = 'test-transactions';
   ```

### Debug Mode

Run tests with debug output:

```bash
# Enable debug logging
DEBUG=* npm test

# Run specific test file
npm test -- __tests__/index.test.js

# Run specific test case
npm test -- --testNamePattern="should flag high amount transactions"
```

## 🔄 Continuous Integration

### GitHub Actions Integration

```yaml
# Example CI configuration
- name: Run Tests
  run: |
    cd backend/lambda/fraud-detection
    npm ci
    npm run validate
    npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./backend/lambda/fraud-detection/coverage/lcov.info
```

### Pre-commit Hooks

```bash
# Install pre-commit hook
npm run precommit
```

This runs linting and tests before each commit.

## 📝 Writing New Tests

### Test Template

```javascript
describe('New Feature', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should handle specific scenario', async () => {
        // Arrange
        const testData = createMockTransaction();
        
        // Act
        const result = await handler(createKinesisEvent(testData));
        
        // Assert
        expect(result.statusCode).toBe(200);
    });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, specific descriptions
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock Isolation**: Clear mocks between tests
4. **Edge Cases**: Test boundary conditions
5. **Error Scenarios**: Test failure paths

## 🎯 Next Steps

### Phase 2 Testing Enhancements

1. **Load Testing**: Add performance benchmarks
2. **Contract Testing**: API contract validation
3. **Security Testing**: Input sanitization tests
4. **Chaos Testing**: Failure injection tests

### Monitoring Integration

1. **Test Metrics**: Track test execution time
2. **Coverage Trends**: Monitor coverage over time
3. **Flaky Test Detection**: Identify unstable tests

---

For questions about testing, see the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) or create an issue in the repository. 