'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Ingredient {
  amount: string
  item: string
}

interface Recipe {
  id: string
  title: string
  description?: string
  prepTime: number
  cookTime: number
  totalTime: number
  servings: number
  difficulty?: string
  cuisine?: string
  ingredients: Ingredient[]
  instructions: string[]
  tips?: string
  customColor?: string
  customLabel?: string
}

interface RecipeCardProps {
  recipe: Recipe
  onLike?: (ingredientIndex: number) => void
  onDislike?: (ingredientIndex: number) => void
  onModify?: () => void
  onConfirm?: () => void
  onReroll?: () => void
}

export default function RecipeCard({
  recipe,
  onLike,
  onDislike,
  onModify,
  onConfirm,
  onReroll
}: RecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'info'>('ingredients')

  const cardColor = recipe.customColor || 'from-orange-400 to-red-500'

  return (
    <motion.div
      layout
      className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
        isExpanded ? 'fixed inset-4 z-50 md:relative md:inset-auto' : ''
      }`}
      style={{ maxHeight: isExpanded ? '90vh' : 'auto' }}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${cardColor} p-6 text-white`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {recipe.customLabel && (
              <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm mb-2">
                {recipe.customLabel}
              </span>
            )}
            <h3 className="text-2xl font-bold mb-2">{recipe.title}</h3>
            {recipe.description && (
              <p className="text-white/90">{recipe.description}</p>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg
              className={`w-6 h-6 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{recipe.totalTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{recipe.servings} servings</span>
          </div>
          {recipe.difficulty && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>{recipe.difficulty}</span>
            </div>
          )}
          {recipe.cuisine && (
            <span className="bg-white/20 px-2 py-1 rounded">
              {recipe.cuisine}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(90vh - 200px)' }}
          >
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  activeTab === 'ingredients'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Ingredients
              </button>
              <button
                onClick={() => setActiveTab('instructions')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  activeTab === 'instructions'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Instructions
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Info & Tips
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'ingredients' && (
                <div className="space-y-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100"
                    >
                      <div>
                        <span className="font-medium">{ingredient.amount}</span>{' '}
                        <span>{ingredient.item}</span>
                      </div>
                      {(onLike || onDislike) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onLike?.(index)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            👍
                          </button>
                          <button
                            onClick={() => onDislike?.(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            👎
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'instructions' && (
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 leading-relaxed">{instruction}</p>
                    </li>
                  ))}
                </ol>
              )}

              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Timing</h4>
                    <p className="text-gray-600">
                      Prep: {recipe.prepTime} min | Cook: {recipe.cookTime} min
                    </p>
                  </div>
                  {recipe.tips && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Tips</h4>
                      <p className="text-gray-600">{recipe.tips}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-gray-50 space-y-3">
              {onModify && (
                <button
                  onClick={onModify}
                  className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Need Modifications?
                </button>
              )}
              {(onConfirm || onReroll) && (
                <div className="flex gap-3">
                  {onConfirm && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onConfirm}
                      className="flex-1 bg-green-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Let&apos;s go with this one
                    </motion.button>
                  )}
                  {onReroll && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onReroll}
                      className="flex-1 bg-gray-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Try again
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}