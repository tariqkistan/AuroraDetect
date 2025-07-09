# Contributing to AuroraDetect

Thank you for your interest in contributing to AuroraDetect! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- AWS CLI configured
- Git
- AWS account with appropriate permissions

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/AuroraDetect.git
   cd AuroraDetect
   ```

2. **Install dependencies**
   ```bash
   cd backend/lambda/fraud-detection
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp backend/lambda/fraud-detection/.env.example backend/lambda/fraud-detection/.env
   # Edit .env with your AWS configuration
   ```

4. **Run local tests**
   ```bash
   npm run local
   ```

## 🔄 Development Workflow

### Branch Strategy

- `main` - Production branch (auto-deploys to prod)
- `develop` - Development branch (auto-deploys to dev)
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency fixes

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards below
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   cd backend/lambda/fraud-detection
   npm run local
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new fraud detection rule"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Coding Standards

### JavaScript/Node.js

- Use ES6+ features
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Handle errors appropriately

### Example:
```javascript
/**
 * Validate transaction data structure
 * @param {Object} transaction - Transaction object to validate
 * @returns {string|null} Error message or null if valid
 */
function validateTransaction(transaction) {
    // Implementation
}
```

### AWS Infrastructure

- Use CloudFormation for infrastructure as code
- Follow AWS best practices for security
- Tag all resources appropriately
- Use least privilege principle for IAM

## 🧪 Testing

### Local Testing

```bash
cd backend/lambda/fraud-detection
npm run local
```

### Unit Tests

```bash
npm test
```

### Integration Tests

Deploy to development environment and test with real AWS services.

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code follows project standards
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No sensitive information in code
- [ ] Branch is up to date with develop

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Local tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 🐛 Reporting Issues

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Logs/screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case and benefits
- Proposed implementation approach
- Any breaking changes

## 🔒 Security

- Never commit AWS credentials or sensitive data
- Use environment variables for configuration
- Follow AWS security best practices
- Report security issues privately

## 📞 Getting Help

- Create an issue for bugs or feature requests
- Use discussions for questions
- Check existing issues before creating new ones

## 🏷️ Commit Message Convention

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

Examples:
```
feat: add velocity-based fraud detection
fix: handle missing timestamp in transactions
docs: update deployment instructions
```

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in the project README and release notes.

Thank you for contributing to AuroraDetect! 🌟 