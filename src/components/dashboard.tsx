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
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react'
import { FraudChart } from './fraud-chart'
import { useTheme } from 'next-themes'

// Define types for our data
interface StatsData {
  totalTransactions: number;
  fraudDetected: number;
  fraudRate: number;
  avgProcessingTime: number;
  systemHealth: number;
  activeCards: number;
}

interface Transaction {
  id: string;
  cardId: string;
  amount: number;
  location: string;
  timestamp: string;
  status: string;
  fraudFlag: boolean;
  fraudReasons?: string[];
}

// Default data for initial render
const defaultStats: StatsData = {
  totalTransactions: 0,
  fraudDetected: 0,
  fraudRate: 0,
  avgProcessingTime: 0,
  systemHealth: 99.9,
  activeCards: 0
}

const defaultTransactions: Transaction[] = []

export function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [stats, setStats] = useState<StatsData>(defaultStats)
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Fetch data function
  const fetchData = async () => {
    setIsRefreshing(true)
    setError(null)
    
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/stats')
      const statsData = await statsResponse.json()
      
      if (statsData.success) {
        setStats(statsData.stats)
      } else {
        console.error('Error fetching stats:', statsData.message)
      }
      
      // Fetch transactions
      const transactionsResponse = await fetch('/api/transactions')
      const transactionsData = await transactionsResponse.json()
      
      if (transactionsData.success) {
        setTransactions(transactionsData.transactions)
      } else {
        console.error('Error fetching transactions:', transactionsData.message)
      }
      
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch data. Please try again.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch data on component mount and set mounted state
  useEffect(() => {
    fetchData()
    setMounted(true)
  }, [])

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AuroraDetect</h1>
            <p className="text-gray-600 dark:text-gray-300">Real-time Fraud Detection System</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Only render the time when component is mounted (client-side) */}
          {mounted && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <Button 
            onClick={fetchData} 
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="mr-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className="rounded-full"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* System Status Alert */}
      {!error && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            System is operational. All services running normally.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats.totalTransactions?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Processed transactions
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Fraud Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.fraudDetected || '0'}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              {stats.fraudRate || '0'}% fraud rate
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats.avgProcessingTime || '0'}ms</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.systemHealth || '0'}%</div>
            <Progress value={stats.systemHealth || 0} className="mt-2 dark:bg-gray-700" />
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Active Cards</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats.activeCards || '0'}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Unique cards processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800">
          <TabsTrigger value="overview" className="dark:data-[state=active]:bg-gray-700">Overview</TabsTrigger>
          <TabsTrigger value="chart" className="dark:data-[state=active]:bg-gray-700">Fraud Chart</TabsTrigger>
          <TabsTrigger value="transactions" className="dark:data-[state=active]:bg-gray-700">Recent Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Fraud Detection Overview</CardTitle>
              <CardDescription className="dark:text-gray-400">
                System performance and fraud detection metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium dark:text-gray-300">Fraud Detection Rate</span>
                  <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">{stats.fraudRate || '0'}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium dark:text-gray-300">Average Processing Time</span>
                  <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">{stats.avgProcessingTime || '0'}ms</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium dark:text-gray-300">System Uptime</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{stats.systemHealth || '0'}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Fraud Detection Trends</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Transaction volume and fraud detection over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FraudChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Recent Transactions</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Latest processed transactions with fraud detection results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No transactions found
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {transaction.fraudFlag ? (
                          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                        )}
                        <div>
                          <p className="font-medium dark:text-white">${transaction.amount?.toLocaleString() || '0'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{transaction.cardId} • {transaction.location}</p>
                        </div>
                      </div>
                      <Badge variant={transaction.fraudFlag ? 'destructive' : 'default'} className={transaction.fraudFlag ? 'dark:bg-red-900 dark:text-red-200' : 'dark:bg-blue-900 dark:text-blue-200'}>
                        {transaction.fraudFlag ? 'FRAUD' : 'NORMAL'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 