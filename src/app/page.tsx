import { Dashboard } from '@/components/dashboard'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto p-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
            AuroraDetect
          </Link>
          <nav className="flex space-x-4">
            <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Dashboard
            </Link>
            <Link href="/test" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Test Transactions
            </Link>
          </nav>
        </div>
      </header>
      <Dashboard />
    </div>
  )
}
