'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Activity, Zap, Database, Bell, Play, Pause } from 'lucide-react'

interface LiveTransaction {
  id: string
  cardId: string
  amount: number
  location: string
  timestamp: string
  status: 'processing' | 'completed' | 'fraud'
  processingTime: number
}

export function RealTimeMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [liveTransactions, setLiveTransactions] = useState<LiveTransaction[]>([])
  const [stats, setStats] = useState({
    processed: 0,
    fraudDetected: 0,
    avgProcessingTime: 0
  })

  // Simulate real-time transactions
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      const newTransaction: LiveTransaction = {
        id: `txn_${Date.now()}`,
        cardId: `card_****_${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
        amount: Math.floor(Math.random() * 1000) + 10,
        location: ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'][Math.floor(Math.random() * 5)],
        timestamp: new Date().toISOString(),
        status: 'processing',
        processingTime: 0
      }

      setLiveTransactions(prev => [newTransaction, ...prev.slice(0, 9)])

      // Simulate processing completion
      setTimeout(() => {
        setLiveTransactions(prev => 
          prev.map(t => 
            t.id === newTransaction.id 
              ? { 
                  ...t, 
                  status: Math.random() > 0.95 ? 'fraud' : 'completed',
                  processingTime: Math.floor(Math.random() * 300) + 100
                }
              : t
          )
        )

        setStats(prev => ({
          processed: prev.processed + 1,
          fraudDetected: prev.fraudDetected + (Math.random() > 0.95 ? 1 : 0),
          avgProcessingTime: Math.floor(Math.random() * 300) + 100
        }))
      }, Math.random() * 2000 + 1000)
    }, Math.random() * 3000 + 2000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
    if (!isMonitoring) {
      setLiveTransactions([])
      setStats({ processed: 0, fraudDetected: 0, avgProcessingTime: 0 })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'fraud': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Activity className="h-4 w-4 animate-pulse" />
      case 'completed': return <Zap className="h-4 w-4" />
      case 'fraud': return <Bell className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Real-time Transaction Monitor</CardTitle>
              <CardDescription>
                Live view of transaction processing and fraud detection
              </CardDescription>
            </div>
            <Button
              onClick={toggleMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              className="flex items-center space-x-2"
            >
              {isMonitoring ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Stop Monitoring</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start Monitoring</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isMonitoring ? (
            <Alert className="border-green-200 bg-green-50">
              <Activity className="h-4 w-4 text-green-600 animate-pulse" />
              <AlertDescription className="text-green-800">
                Monitoring active - Processing transactions in real-time
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                Click "Start Monitoring" to begin real-time transaction processing simulation
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Live Stats */}
      {isMonitoring && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Processed</p>
                  <p className="text-2xl font-bold">{stats.processed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Fraud Detected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.fraudDetected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Avg Processing</p>
                  <p className="text-2xl font-bold">{stats.avgProcessingTime}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Transaction Stream */}
      <Card>
        <CardHeader>
          <CardTitle>Live Transaction Stream</CardTitle>
          <CardDescription>
            Real-time transaction processing events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {liveTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isMonitoring ? 'Waiting for transactions...' : 'Start monitoring to see live transactions'}
              </div>
            ) : (
              liveTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <p className="font-medium">{transaction.id}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.cardId} • ${transaction.amount.toLocaleString()} • {transaction.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {transaction.processingTime > 0 && (
                      <span className="text-xs text-gray-500">
                        {transaction.processingTime}ms
                      </span>
                    )}
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 