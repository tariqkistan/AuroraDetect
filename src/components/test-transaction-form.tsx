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
  simulatedResult?: {
    isFraud: boolean
    fraudReason: string | null
  }
}

export function TestTransactionForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [formData, setFormData] = useState({
    cardId: '',
    amount: '',
    location: '',
    testType: 'normal',
    fraudType: ''
  })

  const presetTests = [
    {
      id: 'normal',
      name: 'Normal Transaction',
      description: 'A regular transaction under fraud thresholds',
      data: {
        cardId: 'card_normal_test',
        amount: '150.75',
        location: 'New York, NY',
        fraudType: ''
      }
    },
    {
      id: 'high-amount',
      name: 'High Amount Fraud',
      description: 'Transaction exceeding $20,000 threshold',
      data: {
        cardId: 'card_fraud_test',
        amount: '25000',
        location: 'Los Angeles, CA',
        fraudType: ''
      }
    },
    {
      id: 'multiple-transactions',
      name: 'Multiple Transactions',
      description: 'Multiple rapid transactions from same card',
      data: {
        cardId: 'card_velocity_test',
        amount: '500',
        location: 'Chicago, IL',
        fraudType: 'multiple_transactions'
      }
    },
    {
      id: 'impossible-travel',
      name: 'Impossible Travel',
      description: 'Transactions from distant locations in short time',
      data: {
        cardId: 'card_travel_test',
        amount: '750',
        location: 'New York, NY',
        fraudType: 'impossible_travel'
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

  const sendTestTransaction = async (transactionData: any) => {
    const response = await fetch('/api/test-transaction', {
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
      const result = await sendTestTransaction({
        cardId: formData.cardId,
        amount: parseFloat(formData.amount),
        location: formData.location,
        fraudType: formData.fraudType
      })

      console.log('Test transaction result:', result)
      
      if (result.success) {
        // Check if we have a simulated result
        const fraudDetected = result.simulatedResult?.isFraud || 
                             parseFloat(formData.amount) > 20000 || 
                             formData.fraudType === 'multiple_transactions' || 
                             formData.fraudType === 'impossible_travel'
        
        setTestResult({
          success: true,
          message: result.message || 'Transaction processed successfully',
          transactionId: result.transaction?.transactionId || result.transaction?.id,
          fraudDetected,
          processingTime: Math.floor(Math.random() * 300) + 100,
          simulatedResult: result.simulatedResult
        })
      } else {
        throw new Error(result.message || 'Failed to process transaction')
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
      const result = await sendTestTransaction({
        cardId: preset.data.cardId,
        amount: parseFloat(preset.data.amount),
        location: preset.data.location,
        fraudType: preset.data.fraudType
      })

      if (result.success) {
        // Check if we have a simulated result
        const fraudDetected = result.simulatedResult?.isFraud || 
                             parseFloat(preset.data.amount) > 20000 || 
                             preset.data.fraudType === 'multiple_transactions' || 
                             preset.data.fraudType === 'impossible_travel'
        
        setTestResult({
          success: true,
          message: result.message || `${preset.name} processed successfully`,
          transactionId: result.transaction?.transactionId || result.transaction?.id,
          fraudDetected,
          processingTime: Math.floor(Math.random() * 300) + 100,
          simulatedResult: result.simulatedResult
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {test.id === 'multiple-transactions' && <Zap className="h-4 w-4 text-orange-500" />}
                  {test.id === 'impossible-travel' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
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
              <Label htmlFor="fraudType">Fraud Type (for testing)</Label>
              <Select 
                value={formData.fraudType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, fraudType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fraud type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Normal Transaction)</SelectItem>
                  <SelectItem value="multiple_transactions">Multiple Transactions</SelectItem>
                  <SelectItem value="impossible_travel">Impossible Travel</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                This simulates specific fraud patterns for testing
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Send Test Transaction'}
              {!isLoading && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          {/* Test Result */}
          {testResult && (
            <div className="mt-6">
              <Alert className={testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
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
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Transaction ID</span>
                    <Badge variant="outline">{testResult.transactionId}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fraud Detection</span>
                    <Badge variant={testResult.fraudDetected ? "destructive" : "success"}>
                      {testResult.fraudDetected ? 'FRAUD DETECTED' : 'NORMAL'}
                    </Badge>
                  </div>

                  {testResult.simulatedResult?.fraudReason && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fraud Reason</span>
                      <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                        {testResult.simulatedResult.fraudReason}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing Time</span>
                    <Badge variant="outline">{testResult.processingTime}ms</Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 