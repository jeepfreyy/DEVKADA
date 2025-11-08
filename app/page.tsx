'use client'

import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            RetornSsistant
          </h1>
          <p className="text-slate-300">
            I can help you with calendar events, emails, weather, and more!
          </p>
        </div>
        <ChatInterface />
      </div>
    </main>
  )
}

