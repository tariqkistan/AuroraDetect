'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

interface ChartDataPoint {
  date: string;
  transactions: number;
  frauds: number;
}

// Mock data for the chart
const generateMockData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = []
  const now = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    const transactions = Math.floor(Math.random() * 100) + 50
    const frauds = Math.floor(transactions * (Math.random() * 0.2))
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      transactions,
      frauds
    })
  }
  
  return data
}

export function FraudChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  
  useEffect(() => {
    setChartData(generateMockData())
    setMounted(true)
  }, [])
  
  // Calculate the maximum value for scaling
  const maxTransactions = Math.max(...chartData.map(d => d.transactions), 0)
  
  // Colors based on theme
  const getColors = () => {
    if (!mounted) return { bar: '#e5e7eb', fraud: '#ef4444', text: '#6b7280', grid: '#e5e7eb' }
    
    return theme === 'dark' 
      ? { bar: '#374151', fraud: '#f87171', text: '#9ca3af', grid: '#374151' }
      : { bar: '#e5e7eb', fraud: '#ef4444', text: '#6b7280', grid: '#e5e7eb' }
  }
  
  const colors = getColors()

  return (
    <div className="w-full h-64 relative">
      {/* Chart container */}
      <div className="absolute inset-0 flex items-end">
        {chartData.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full space-y-1">
            {/* Fraud bar */}
            <div 
              className="w-6 bg-red-500 dark:bg-red-400 rounded-t"
              style={{ 
                height: `${(day.frauds / maxTransactions) * 100}%`,
                backgroundColor: colors.fraud
              }}
            ></div>
            
            {/* Normal transactions bar */}
            <div 
              className="w-6 bg-gray-200 dark:bg-gray-700 rounded-t"
              style={{ 
                height: `${((day.transactions - day.frauds) / maxTransactions) * 100}%`,
                backgroundColor: colors.bar
              }}
            ></div>
            
            {/* Date label */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1" style={{ color: colors.text }}>
              {day.date}
            </div>
          </div>
        ))}
      </div>
      
      {/* Y-axis grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {[0, 1, 2, 3, 4].map((_, i) => (
          <div 
            key={i} 
            className="w-full h-px bg-gray-200 dark:bg-gray-700"
            style={{ backgroundColor: colors.grid }}
          ></div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="absolute top-0 right-0 flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" style={{ backgroundColor: colors.bar }}></div>
          <span className="text-xs text-gray-500 dark:text-gray-400" style={{ color: colors.text }}>Normal</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-sm bg-red-500 dark:bg-red-400" style={{ backgroundColor: colors.fraud }}></div>
          <span className="text-xs text-gray-500 dark:text-gray-400" style={{ color: colors.text }}>Fraud</span>
        </div>
      </div>
    </div>
  )
} 