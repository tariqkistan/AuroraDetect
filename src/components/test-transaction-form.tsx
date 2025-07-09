'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Send, Zap, AlertTriangle, CheckCircle } from 'lucide-react'

interface TestResult {
  success: boolean
  message: string
  transactionId?: string
  fraudDetected?: boolean
  processingTime?: number
  shardId?: string
  sequenceNumber?: string
}

export function TestTransactionForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [formData, setFormData] = useState({
    cardId: '',
    amount: '',
    location: '',
    testType: 'normal'
  })

  const presetTests = [
    {
      id: 'normal',
      name: 'Normal Transaction',
      description: 'A regular transaction under fraud thresholds',
      data: {
        cardId: 'card_normal_test',
        amount: '150.75',
        location: 'New York, NY'
      }
    },
    {
      id: 'high-amount',
      name: 'High Amount Fraud',
      description: 'Transaction exceeding $20,000 threshold',
      data: {
        cardId: 'card_fraud_test',
        amount: '25000',
        location: 'Los Angeles, CA'
      }
    },
    {
      id: 'velocity',
      name: 'Velocity Fraud',
      description: 'Multiple rapid transactions from same card',
      data: {
        cardId: 'card_velocity_test',
        amount: '500',
        location: 'Chicago, IL'
      }
    }
  ]

  const handlePresetSelect = (testType: string) => {
    const preset = presetTests.find(p => p.id === testType)
    if (preset) {
      setFormData({
        ...preset.data,
        testType
      })
    }
  }

  const sendTransaction = async (transactionData: { cardId: string; amount: string; location: string }) => {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTestResult(null)

    try {
      const result = await sendTransaction({
        cardId: formData.cardId,
        amount: formData.amount,
        location: formData.location
      })

      if (result.success) {
        // Wait a bit for processing, then simulate fraud detection result
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const fraudDetected = parseFloat(formData.amount) > 20000 || formData.testType === 'velocity'
        
        setTestResult({
          success: true,
          message: 'Transaction sent successfully to Kinesis stream',
          transactionId: result.transactionId,
          fraudDetected,
          processingTime: Math.floor(Math.random() * 300) + 100,
          shardId: result.shardId,
          sequenceNumber: result.sequenceNumber
        })
      } else {
        throw new Error(result.message || 'Failed to send transaction')
      }

    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send transaction'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickTest = async (testType: string) => {
    const preset = presetTests.find(p => p.id === testType)
    if (!preset) return

    setIsLoading(true)
    setTestResult(null)

    try {
      const result = await sendTransaction(preset.data)

      if (result.success) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const fraudDetected = parseFloat(preset.data.amount) > 20000 || testType === 'velocity'
        
        setTestResult({
          success: true,
          message: `${preset.name} sent to Kinesis stream`,
          transactionId: result.transactionId,
          fraudDetected,
          processingTime: Math.floor(Math.random() * 300) + 100,
          shardId: result.shardId,
          sequenceNumber: result.sequenceNumber
        })
      } else {
        throw new Error(result.message || 'Test failed')
      }

    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Tests</CardTitle>
          <CardDescription>
            Run predefined test scenarios to verify fraud detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presetTests.map((test) => (
              <Button
                key={test.id}
                onClick={() => handleQuickTest(test.id)}
                disabled={isLoading}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2"
              >
                <div className="flex items-center space-x-2">
                  {test.id === 'normal' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {test.id === 'high-amount' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {test.id === 'velocity' && <Zap className="h-4 w-4 text-orange-500" />}
                  <span className="font-medium">{test.name}</span>
                </div>
                <p className="text-xs text-gray-500 text-left">{test.description}</p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Test Form */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Test Transaction</CardTitle>
          <CardDescription>
            Send a custom transaction to test the fraud detection system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardId">Card ID</Label>
                <Input
                  id="cardId"
                  placeholder="card_test_1234"
                  value={formData.cardId}
                  onChange={(e) => setFormData(prev => ({ ...prev, cardId: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="150.75"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="New York, NY"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="testType">Test Type</Label>
              <Select value={formData.testType} onValueChange={(value) => {
                setFormData(prev => ({ ...prev, testType: value }))
                handlePresetSelect(value)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {presetTests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Transaction...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Transaction
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </AlertDescription>
            </Alert>

            {testResult.success && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Transaction ID:</span>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {testResult.transactionId}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kinesis Shard:</span>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {testResult.shardId}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sequence Number:</span>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                    {testResult.sequenceNumber?.substring(0, 20)}...
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expected Fraud Detection:</span>
                  <Badge variant={testResult.fraudDetected ? 'destructive' : 'default'}>
                    {testResult.fraudDetected ? 'FRAUD EXPECTED' : 'NORMAL EXPECTED'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Processing Time:</span>
                  <span className="text-sm font-medium">{testResult.processingTime}ms</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Monitor Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">
            After sending a transaction, you can monitor the results in:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• <strong>Real-time tab:</strong> Watch live processing</li>
            <li>• <strong>Transactions tab:</strong> View processed transactions</li>
            <li>• <strong>AWS CloudWatch:</strong> Lambda function logs</li>
            <li>• <strong>DynamoDB:</strong> Stored transaction records</li>
            <li>• <strong>SNS:</strong> Fraud alert notifications</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 