'use client'

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  cardId: string
  amount: number
  location: string
  timestamp: string
  status: 'normal' | 'fraud' | 'pending'
  fraudFlag: boolean
  fraudReasons?: string[]
}

interface TransactionTableProps {
  transactions: Transaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const getStatusIcon = (status: string, fraudFlag: boolean) => {
    if (status === 'pending') return <Clock className="h-4 w-4 text-yellow-500" />
    if (fraudFlag) return <XCircle className="h-4 w-4 text-red-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getStatusBadge = (status: string, fraudFlag: boolean) => {
    if (status === 'pending') return <Badge variant="secondary">Pending</Badge>
    if (fraudFlag) return <Badge variant="destructive">Fraud</Badge>
    return <Badge variant="default" className="bg-green-100 text-green-800">Normal</Badge>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Card ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="flex items-center space-x-2">
                {getStatusIcon(transaction.status, transaction.fraudFlag)}
                {getStatusBadge(transaction.status, transaction.fraudFlag)}
              </TableCell>
              <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
              <TableCell className="font-mono text-sm">{transaction.cardId}</TableCell>
              <TableCell className="font-semibold">
                ${transaction.amount.toLocaleString()}
              </TableCell>
              <TableCell>{transaction.location}</TableCell>
              <TableCell className="text-sm text-gray-500">
                {format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm:ss')}
              </TableCell>
              <TableCell>
                {transaction.fraudReasons && transaction.fraudReasons.length > 0 ? (
                  <div className="text-sm text-red-600">
                    {transaction.fraudReasons.join(', ')}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 