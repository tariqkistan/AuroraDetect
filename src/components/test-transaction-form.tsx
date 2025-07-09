'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle } from 'lucide-react'

// Transaction form interface
interface TransactionFormData {
  cardId: string
  amount: string
  location: string
  type: string
}

// Default form values
const defaultFormData: TransactionFormData = {
  cardId: '',
  amount: '',
  location: '',
  type: 'normal'
}

export function TestTransactionForm() {
  const [formData, setFormData] = useState<TransactionFormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; fraudDetected?: boolean } | null>(null)

  const handleChange = (field: keyof TransactionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    try {
      // Validate form
      if (!formData.cardId || !formData.amount || !formData.location) {
        setResult({ success: false, message: 'All fields are required' })
        setIsSubmitting(false)
        return
      }

      // Parse amount as number
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        setResult({ success: false, message: 'Amount must be a positive number' })
        setIsSubmitting(false)
        return
      }

      // Prepare transaction data
      const transactionData = {
        cardId: formData.cardId,
        amount,
        location: formData.location,
        timestamp: new Date().toISOString(),
        type: formData.type
      }

      // Submit transaction to API
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: 'Transaction processed successfully',
          fraudDetected: data.fraudDetected
        })
        // Reset form if successful
        if (formData.type !== 'fraud') {
          setFormData(defaultFormData)
        }
      } else {
        setResult({
          success: false,
          message: data.message || 'Failed to process transaction'
        })
      }
    } catch (error) {
      console.error('Error submitting transaction:', error)
      setResult({
        success: false,
        message: 'An error occurred while processing the transaction'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Submit Test Transaction</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Create a test transaction to validate the fraud detection system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardId" className="dark:text-gray-300">Card ID</Label>
              <Input
                id="cardId"
                placeholder="Card ID (e.g., 4111-1111-1111-1111)"
                value={formData.cardId}
                onChange={(e) => handleChange('cardId', e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount" className="dark:text-gray-300">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Transaction amount"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="dark:text-gray-300">Location</Label>
              <Input
                id="location"
                placeholder="Transaction location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type" className="dark:text-gray-300">Transaction Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="normal">Normal Transaction</SelectItem>
                  <SelectItem value="fraud">Simulated Fraud</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Submit Transaction'}
            </Button>
          </form>
        </CardContent>
        
        {result && (
          <CardFooter>
            {result.success ? (
              <Alert className={
                result.fraudDetected 
                  ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800" 
                  : "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
              }>
                {result.fraudDetected ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
                <AlertDescription className={
                  result.fraudDetected 
                    ? "text-yellow-800 dark:text-yellow-300" 
                    : "text-green-800 dark:text-green-300"
                }>
                  {result.message}
                  {result.fraudDetected && " - Fraud detected!"}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-300">
                  {result.message}
                </AlertDescription>
              </Alert>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  )
} 