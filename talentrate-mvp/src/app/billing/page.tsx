'use client'

import { useState } from 'react'

type Pack = {
  id: string
  name: string
  credits: number
  priceIdEnv: string
  description: string
}

const CREDIT_PACKS: Pack[] = [
  {
    id: 'pack-50',
    name: 'Starter',
    credits: 50,
    priceIdEnv: 'STRIPE_PRICE_CREDITS_50',
    description: 'Great for trying TalentRate'
  },
  {
    id: 'pack-200',
    name: 'Pro',
    credits: 200,
    priceIdEnv: 'STRIPE_PRICE_CREDITS_200',
    description: 'For regular hiring cycles'
  },
  {
    id: 'pack-500',
    name: 'Scale',
    credits: 500,
    priceIdEnv: 'STRIPE_PRICE_CREDITS_500',
    description: 'Best value for teams'
  }
]

export default function BillingPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function startCheckout(pack: Pack) {
    try {
      setLoadingId(pack.id)
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: pack.credits,
          priceIdEnv: pack.priceIdEnv
        })
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to create checkout session')
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (e) {
      console.error(e)
      alert('Unable to start checkout. Please try again.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Buy credits</h1>
        <p className="text-gray-600 mb-8">Choose a credit pack and complete checkout.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CREDIT_PACKS.map((pack) => (
            <div key={pack.id} className="bg-white rounded-lg shadow border p-6 flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900">{pack.name}</h2>
              <p className="text-gray-600 mt-1">{pack.description}</p>
              <div className="mt-4 text-3xl font-bold text-blue-600">{pack.credits} credits</div>
              <button
                onClick={() => startCheckout(pack)}
                disabled={loadingId === pack.id}
                className="mt-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {loadingId === pack.id ? 'Redirecting…' : 'Buy'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-sm text-gray-500">
          After successful payment you will be redirected back here and your
          header balance will update automatically.
        </div>
      </div>
    </div>
  )
}
