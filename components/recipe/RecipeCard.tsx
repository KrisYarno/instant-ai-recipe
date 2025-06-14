'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InlineModificationChat from './InlineModificationChat'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronDown, Clock, Users, BarChart, ThumbsUp, ThumbsDown, MessageSquare, X, AlertCircle, Settings } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
  isSaved?: boolean
  preferencesApplied?: boolean
  preferencesOverridden?: string[]
}

interface RecipeCardProps {
  recipe: Recipe
  onConfirm?: () => void
  onReroll?: () => void
  onRecipeUpdate?: (updatedRecipe: Recipe) => void
  showVoting?: boolean
}

export default function RecipeCard({
  recipe,
  onConfirm,
  onReroll,
  onRecipeUpdate,
  showVoting = true
}: RecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'info'>('ingredients')
  const [showModificationChat, setShowModificationChat] = useState(false)
  const [localRecipe, setLocalRecipe] = useState(recipe)
  const [userPrefs, setUserPrefs] = useState<{ liked: string[], disliked: string[] }>({ liked: [], disliked: [] })

  // Update local recipe when prop changes
  useEffect(() => {
    setLocalRecipe(recipe)
  }, [recipe])

  // Fetch user preferences
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const response = await fetch('/api/likes-dislikes')
        if (response.ok) {
          const data = await response.json()
          setUserPrefs({ 
            liked: data.likedIngredients || [], 
            disliked: data.dislikedIngredients || [] 
          })
        }
      } catch (error) {
        console.error('Error fetching preferences:', error)
      }
    }
    fetchPrefs()
  }, [])

  const handleIngredientVote = async (ingredientItem: string, voteType: 'like' | 'dislike') => {
    try {
      const response = await fetch('/api/likes-dislikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient: ingredientItem,
          action: 'add',
          type: voteType
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserPrefs({ 
          liked: data.likedIngredients || [], 
          disliked: data.dislikedIngredients || [] 
        })
      } else {
        console.error('Failed to save vote:', await response.text())
      }
    } catch (error) {
      console.error('Error voting on ingredient:', error)
    }
  }

  const handleRecipeUpdate = (updatedRecipe: Recipe) => {
    setLocalRecipe(updatedRecipe)
    if (onRecipeUpdate) {
      onRecipeUpdate(updatedRecipe)
    }
  }

  const cardColor = localRecipe.customColor || 'from-orange-400 to-red-500'

  return (
    <>
      {/* Backdrop for mobile */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/75 z-40 md:hidden" 
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      <motion.div
        layout
        className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
          isExpanded ? 'fixed inset-4 z-50 md:relative md:inset-auto flex flex-col' : ''
        }`}
        style={{ maxHeight: isExpanded ? '90vh' : 'auto' }}
      >
      {/* Header */}
      <div className={`bg-gradient-to-r ${cardColor} ${isExpanded ? 'p-4' : 'p-6'} text-white`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {localRecipe.customLabel && (
              <Badge variant="secondary" className="bg-white text-gray-800 hover:bg-gray-100 mb-2 shadow-sm">
                {localRecipe.customLabel}
              </Badge>
            )}
            <h3 className={`font-bold ${isExpanded ? 'text-xl' : 'text-2xl mb-2'}`}>{localRecipe.title}</h3>
            {localRecipe.description && !isExpanded && (
              <p className="text-white/90">{localRecipe.description}</p>
            )}
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            variant="ghost"
            size="icon"
            className="ml-4 hover:bg-white/30 text-white relative z-20 transition-colors"
          >
            {isExpanded ? (
              <X className="w-6 h-6" />
            ) : (
              <ChevronDown className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Quick Info - More compact when expanded */}
        <div className={`flex flex-wrap gap-4 ${isExpanded ? 'mt-2' : 'mt-4'} text-sm`}>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{localRecipe.totalTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{localRecipe.servings} servings</span>
          </div>
          {localRecipe.difficulty && !isExpanded && (
            <div className="flex items-center gap-1">
              <BarChart className="w-4 h-4" />
              <span>{localRecipe.difficulty}</span>
            </div>
          )}
          {localRecipe.cuisine && !isExpanded && (
            <Badge variant="secondary" className="bg-white text-gray-800 hover:bg-gray-100 shadow-sm">
              {localRecipe.cuisine}
            </Badge>
          )}
          {localRecipe.preferencesApplied && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                    <Settings className="w-3 h-3 mr-1" />
                    Preferences Applied
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This recipe respects your dietary preferences</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {localRecipe.preferencesOverridden && localRecipe.preferencesOverridden.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Modified
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Some preferences were overridden: {localRecipe.preferencesOverridden.join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'ingredients' | 'instructions' | 'info')} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="info">Info & Tips</TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <TabsContent value="ingredients" className="p-6">
                <div className="space-y-3">
                  {localRecipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100"
                    >
                      <div>
                        <span className="font-medium">{ingredient.amount}</span>{' '}
                        <span>{ingredient.item}</span>
                      </div>
                      {showVoting && (
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleIngredientVote(ingredient.item, 'like')}
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${
                              userPrefs.liked.includes(ingredient.item)
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title="I like this ingredient"
                          >
                            <ThumbsUp className="w-4 h-4" fill={userPrefs.liked.includes(ingredient.item) ? "currentColor" : "none"} />
                          </Button>
                          <Button
                            onClick={() => handleIngredientVote(ingredient.item, 'dislike')}
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${
                              userPrefs.disliked.includes(ingredient.item)
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title="I dislike this ingredient"
                          >
                            <ThumbsDown className="w-4 h-4" fill={userPrefs.disliked.includes(ingredient.item) ? "currentColor" : "none"} />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="instructions" className="p-6">
                <ol className="space-y-4">
                  {localRecipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 leading-relaxed">{instruction}</p>
                    </li>
                  ))}
                </ol>
              </TabsContent>

              <TabsContent value="info" className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Timing</h4>
                    <p className="text-gray-600">
                      Prep: {localRecipe.prepTime} min | Cook: {localRecipe.cookTime} min
                    </p>
                  </div>
                  {localRecipe.tips && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Tips</h4>
                      <p className="text-gray-600">{localRecipe.tips}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="p-6 bg-gray-50 space-y-3">
              <Button
                onClick={() => setShowModificationChat(!showModificationChat)}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Need Modifications?
              </Button>
              {(onConfirm || onReroll) && (
                <div className="flex gap-3">
                  {onConfirm && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        onClick={onConfirm}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        Let&apos;s go with this one
                      </Button>
                    </motion.div>
                  )}
                  {onReroll && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        onClick={onReroll}
                        variant="secondary"
                        className="w-full"
                        size="lg"
                      >
                        Try again
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
            
            {/* Inline Modification Chat */}
            <InlineModificationChat
              recipe={localRecipe}
              isOpen={showModificationChat}
              onClose={() => setShowModificationChat(false)}
              onRecipeUpdate={handleRecipeUpdate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  )
}