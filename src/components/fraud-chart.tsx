'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Mock data for the last 24 hours
const fraudData = [
  { time: '00:00', transactions: 45, fraud: 0 },
  { time: '01:00', transactions: 32, fraud: 1 },
  { time: '02:00', transactions: 28, fraud: 0 },
  { time: '03:00', transactions: 35, fraud: 0 },
  { time: '04:00', transactions: 42, fraud: 2 },
  { time: '05:00', transactions: 58, fraud: 1 },
  { time: '06:00', transactions: 78, fraud: 0 },
  { time: '07:00', transactions: 95, fraud: 1 },
  { time: '08:00', transactions: 125, fraud: 3 },
  { time: '09:00', transactions: 142, fraud: 2 },
  { time: '10:00', transactions: 156, fraud: 1 },
  { time: '11:00', transactions: 178, fraud: 4 },
  { time: '12:00', transactions: 195, fraud: 3 },
  { time: '13:00', transactions: 188, fraud: 2 },
  { time: '14:00', transactions: 172, fraud: 5 },
  { time: '15:00', transactions: 165, fraud: 1 },
  { time: '16:00', transactions: 148, fraud: 2 },
  { time: '17:00', transactions: 134, fraud: 1 },
  { time: '18:00', transactions: 125, fraud: 0 },
  { time: '19:00', transactions: 98, fraud: 1 },
  { time: '20:00', transactions: 85, fraud: 0 },
  { time: '21:00', transactions: 72, fraud: 1 },
  { time: '22:00', transactions: 58, fraud: 0 },
  { time: '23:00', transactions: 45, fraud: 0 }
]

export function FraudChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={fraudData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium">{`Time: ${label}`}</p>
                    <p className="text-blue-600">
                      {`Transactions: ${payload[0].value}`}
                    </p>
                    <p className="text-red-600">
                      {`Fraud: ${payload[1].value}`}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Line 
            type="monotone" 
            dataKey="transactions" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="fraud" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 