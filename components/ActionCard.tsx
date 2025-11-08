'use client'

import { Calendar, Mail, Cloud, Sparkles, CheckCircle2, XCircle } from 'lucide-react'

interface ActionResult {
  type: 'calendar' | 'email' | 'weather' | 'ui'
  data: any
  success: boolean
  message?: string
}

interface ActionCardProps {
  result: ActionResult
}

export default function ActionCard({ result }: ActionCardProps) {
  const icons = {
    calendar: Calendar,
    email: Mail,
    weather: Cloud,
    ui: Sparkles,
  }

  const colors = {
    calendar: 'bg-blue-500/20 border-blue-500/50',
    email: 'bg-green-500/20 border-green-500/50',
    weather: 'bg-cyan-500/20 border-cyan-500/50',
    ui: 'bg-purple-500/20 border-purple-500/50',
  }

  const Icon = icons[result.type]
  const colorClass = colors[result.type]

  return (
    <div className={`mt-2 p-4 rounded-lg border ${colorClass} backdrop-blur-sm`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {result.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white capitalize">
              {result.type} Action
            </span>
          </div>
          {result.message && (
            <p className="text-sm text-white/80 mb-2">{result.message}</p>
          )}
          {result.data && (
            <div className="mt-2 text-xs text-white/70">
              {result.type === 'calendar' && result.data.eventLink && (
                <a
                  href={result.data.eventLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  View Event →
                </a>
              )}
              {result.type === 'email' && result.data.emailId && (
                <p>Email ID: {result.data.emailId}</p>
              )}
              {result.type === 'weather' && result.data.temperature && (
                <div className="space-y-1">
                  <p>Temperature: {result.data.temperature}°C</p>
                  <p>Condition: {result.data.condition}</p>
                  <p>Humidity: {result.data.humidity}%</p>
                </div>
              )}
              {result.type === 'ui' && result.data.html && (
                <div
                  className="mt-2 p-2 bg-white/10 rounded"
                  dangerouslySetInnerHTML={{ __html: result.data.html }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

