'use client'

import Link from 'next/link'
import { useUser } from '@/lib/hooks/use-user'
import { signOut } from '@/lib/actions/auth'

export default function Header() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                TalentRate
              </Link>
            </div>
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </header>
    )
  }

  if (!user) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                TalentRate
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              TalentRate
            </Link>
          </div>

          {/* Navigation and Credits */}
          <div className="flex items-center space-x-6">
            {/* Credits Display */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Credits:</span>
              <span className="font-semibold text-blue-600">{user.credits}</span>
            </div>

            {/* Buy Credits Button */}
            <Link
              href="/billing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Buy Credits
            </Link>

            {/* Sign Out Button */}
            <form action={signOut}>
              <button
                type="submit"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
