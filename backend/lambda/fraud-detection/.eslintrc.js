module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    globals: {
        'process': 'readonly',
        'Buffer': 'readonly',
        '__dirname': 'readonly',
        '__filename': 'readonly',
        createMockTransaction: 'readonly',
        createMockKinesisRecord: 'readonly'
    },
    rules: {
        // Code style
        'indent': ['error', 4],
        'linebreak-style': 'off', // Disable for Windows compatibility
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        
        // Best practices
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'no-console': 'off', // Allow console.log for Lambda logging
        'prefer-const': 'error',
        'no-var': 'error',
        
        // AWS Lambda specific
        'no-process-exit': 'error',
        'handle-callback-err': 'error',
        'no-sync': 'off' // Allow sync operations in Lambda
    }
}; 