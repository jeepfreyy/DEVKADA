'use client'

import { Message } from './ChatInterface'
import { User, Bot } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary-600' : 'bg-purple-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block max-w-[80%] px-4 py-2 rounded-2xl ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-white/20 text-white backdrop-blur-sm'
        }`}>
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          <span className="text-xs opacity-70 mt-1 block">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

