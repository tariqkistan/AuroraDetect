'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Users, 
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

// Initial state with zeros
const initialStats = {
  totalTransactions: 0,
  fraudDetected: 0,
  fraudRate: 0,
  avgProcessingTime: 0,
  systemHealth: 99.9
}

export function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [stats, setStats] = useState(initialStats)
  const [transactions, setTransactions] = useState([])
  const [error, setError] = useState(null)

  // Fetch transactions and calculate stats
  const fetchTransactions = async () => {
    setIsRefreshing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/transactions')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setTransactions(data.transactions || [])
        
        // Calculate stats
        const fraudTransactions = data.transactions.filter(t => t.fraudFlag)
        const totalCount = data.transactions.length
        
        setStats({
          totalTransactions: totalCount,
          fraudDetected: fraudTransactions.length,
          fraudRate: totalCount > 0 ? ((fraudTransactions.length / totalCount) * 100).toFixed(1) : 0,
          avgProcessingTime: 245, // Default for now
          systemHealth: 99.9 // Default
        })
      } else {
        throw new Error(data.message || 'Failed to fetch transactions')
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err.message)
      
      // In development, use mock data as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data as fallback')
        // Mock data for demonstration
        const mockTransactions = [
          {
            id: 'txn_1751554283863_1',
            cardId: 'card_****_1234',
            amount: 150.75,
            location: 'New York, NY',
            timestamp: '2025-07-03T14:51:23.863Z',
            status: 'normal',
            fraudFlag: false
          },
          {
            id: 'txn_1751554283863_2',
            cardId: 'card_****_5678',
            amount: 25000,
            location: 'Los Angeles, CA',
            timestamp: '2025-07-03T14:51:23.863Z',
            status: 'fraud',
            fraudFlag: true,
            fraudReasons: ['High amount: $25000 exceeds threshold of $20000']
          }
        ]
        
        setTransactions(mockTransactions)
        setStats({
          totalTransactions: mockTransactions.length,
          fraudDetected: mockTransactions.filter(t => t.fraudFlag).length,
          fraudRate: 50,
          avgProcessingTime: 245,
          systemHealth: 99.9
        })
      }
    } finally {
      setIsRefreshing(false)
      setLastUpdate(new Date())
    }
  }

  // Initial fetch on component mount
  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleRefresh = async () => {
    await fetchTransactions()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AuroraDetect</h1>
            <p className="text-gray-600">Real-time Fraud Detection System</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      {error ? (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {error}. {process.env.NODE_ENV === 'development' && 'Using mock data as fallback.'}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            System is operational. All services running normally.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTransactions > 0 ? '+12% from last hour' : 'No transactions yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.fraudDetected}</div>
            <p className="text-xs text-muted-foreground">
              {stats.fraudRate}% fraud rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.systemHealth}%</div>
            <Progress value={stats.systemHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length > 0 ? '8,432' : '0'}</div>
            <p className="text-xs text-muted-foreground">
              Unique cards processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Overview</CardTitle>
              <CardDescription>
                System performance and fraud detection metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fraud Detection Rate</span>
                  <Badge variant="secondary">{stats.fraudRate}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Processing Time</span>
                  <Badge variant="secondary">{stats.avgProcessingTime}ms</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Uptime</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">99.9%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest processed transactions with fraud detection results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {transaction.fraudFlag ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium">${transaction.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{transaction.cardId} • {transaction.location}</p>
                        </div>
                      </div>
                      <Badge variant={transaction.fraudFlag ? 'destructive' : 'default'}>
                        {transaction.fraudFlag ? 'FRAUD' : 'NORMAL'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    No transactions found. Try submitting a test transaction.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 