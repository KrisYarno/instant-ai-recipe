'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface InlineModificationChatProps {
  recipe: {
    id: string
    title: string
    ingredients: Array<{ amount: string; item: string }>
    instructions: string[]
  }
  isOpen: boolean
  onClose: () => void
  onRecipeUpdate: (updatedRecipe: {
    id: string
    title: string
    description?: string
    prepTime: number
    cookTime: number
    totalTime: number
    servings: number
    difficulty?: string
    cuisine?: string
    ingredients: Array<{ amount: string; item: string }>
    instructions: string[]
    tips?: string
    customColor?: string
    customLabel?: string
  }) => void
}

export default function InlineModificationChat({
  recipe,
  isOpen,
  onClose,
  onRecipeUpdate
}: InlineModificationChatProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
  }>>([])

  const handleSend = async () => {
    if (!message.trim() || isLoading) return

    const userMessage = message
    setMessage('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/recipes/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          query: userMessage
        })
      })

      if (response.ok) {
        const data = await response.json()
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: data.modification 
        }])
      }
    } catch (error) {
      console.error('Modification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyModification = async () => {
    const lastAssistantMessage = chatHistory
      .filter(msg => msg.role === 'assistant')
      .pop()
    
    if (!lastAssistantMessage) return

    setIsProcessing(true)
    
    try {
      // Generate a new recipe with the modifications
      const response = await fetch('/api/recipes/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          modifications: lastAssistantMessage.content
        })
      })

      if (response.ok) {
        const data = await response.json()
        onRecipeUpdate(data.recipe)
        onClose()
        setChatHistory([])
      }
    } catch (error) {
      console.error('Error applying modifications:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t bg-gray-50"
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-800">Recipe Modifications</h4>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat History */}
            <div className="bg-white rounded-lg p-3 mb-3 max-h-48 overflow-y-auto">
              {chatHistory.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Ask for any modifications to this recipe (substitutions, dietary changes, cooking adjustments)
                </p>
              ) : (
                <div className="space-y-2">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-orange-100 text-orange-900 ml-8'
                          : 'bg-gray-100 text-gray-800 mr-8'
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="bg-gray-100 p-2 rounded-lg mr-8">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your modification request..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                disabled={isLoading || isProcessing}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isLoading || isProcessing}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            {/* Apply Changes Button */}
            {chatHistory.some(msg => msg.role === 'assistant') && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleApplyModification}
                disabled={isProcessing}
                className="mt-3 w-full bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Regenerating Recipe...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Apply Changes & Regenerate Recipe
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}