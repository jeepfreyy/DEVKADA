'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Calendar, Mail, Cloud, Sparkles } from 'lucide-react'
import MessageBubble from './MessageBubble'
import ActionCard from './ActionCard'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actionResult?: {
    type: 'calendar' | 'email' | 'weather' | 'ui'
    data: any
    success: boolean
    message?: string
  }
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI assistant. I can help you:\n\n📅 Create calendar events\n📧 Send emails\n🌤️ Check weather\n🎨 Generate UI elements\n\nWhat would you like to do?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'I processed your request.',
        timestamp: new Date(),
        actionResult: data.actionResult,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = [
    { icon: Calendar, text: 'Schedule meeting', prompt: 'Schedule a meeting tomorrow at 2pm about the project' },
    { icon: Mail, text: 'Send email', prompt: 'Send an email to john@example.com with subject "Meeting Confirmation"' },
    { icon: Cloud, text: 'Check weather', prompt: 'What is the weather in New York?' },
    { icon: Sparkles, text: 'Generate UI', prompt: 'Generate a card showing project timeline with 3 milestones' },
  ]

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col h-[600px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <MessageBubble message={message} />
            {message.actionResult && (
              <div className="mt-2">
                <ActionCard result={message.actionResult} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-white/70">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-3 border-t border-white/10">
        <div className="flex gap-2 flex-wrap">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(action.prompt)
                setTimeout(() => handleSend(), 100)
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <action.icon className="w-3 h-3" />
              <span>{action.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

