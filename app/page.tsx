'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RecipeCard from '@/components/recipe/RecipeCard'
import ModificationChat from '@/components/recipe/ModificationChat'
import type { Recipe } from '@/types/recipe'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [usePreferences, setUsePreferences] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null)
  const [showModificationChat, setShowModificationChat] = useState(false)

  useEffect(() => {
    // Check if we have a recipe from pantry generation
    const recipeId = sessionStorage.getItem('generatedRecipeId')
    if (recipeId) {
      sessionStorage.removeItem('generatedRecipeId')
      fetchRecipe(recipeId)
    }
  }, [])

  const fetchRecipe = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentRecipe(data.recipe)
      }
    } catch (error) {
      console.error('Error fetching recipe:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const proteins = ['Chicken', 'Beef', 'Pork', 'Fish']
  const cuisines = ['Asian', 'Mexican', 'Italian', 'American']
  const timelines = [
    { label: '30min', value: 30 },
    { label: '45min', value: 45 },
    { label: '1hr', value: 60 },
    { label: '2hr', value: 120 },
  ]

  const generateRecipe = async (params: {
    type: 'random' | 'timeline' | 'protein' | 'cuisine' | 'pantry'
    timeLimit?: number
    protein?: string
    cuisine?: string
    pantryItems?: string[]
  }) => {
    setIsGenerating(true)
    setCurrentRecipe(null)

    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          usePreferences
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentRecipe(data.recipe)
      } else {
        console.error('Failed to generate recipe')
      }
    } catch (error) {
      console.error('Error generating recipe:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirmRecipe = async () => {
    if (currentRecipe) {
      router.push('/recent-recipes')
    }
  }

  const handleRerollRecipe = async () => {
    if (currentRecipe) {
      // Regenerate with same parameters
      // This would require storing the last generation params
      setCurrentRecipe(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Mobile Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Instant AI Recipe</h1>
            
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-orange-500">Home</Link>
              <Link href="/pantry" className="text-gray-700 hover:text-orange-500">My Pantry</Link>
              <Link href="/preferences" className="text-gray-700 hover:text-orange-500">My Preferences</Link>
              <Link href="/saved-recipes" className="text-gray-700 hover:text-orange-500">Saved Recipes</Link>
              <Link href="/recent-recipes" className="text-gray-700 hover:text-orange-500">Recent Recipes</Link>
              <Link href="/likes-dislikes" className="text-gray-700 hover:text-orange-500">Manage Likes/Dislikes</Link>
              <Link href="/settings" className="text-gray-700 hover:text-orange-500">Settings</Link>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden py-4 space-y-2"
            >
              <Link href="/" className="block py-2 text-gray-700 hover:text-orange-500">Home</Link>
              <Link href="/pantry" className="block py-2 text-gray-700 hover:text-orange-500">My Pantry</Link>
              <Link href="/preferences" className="block py-2 text-gray-700 hover:text-orange-500">My Preferences</Link>
              <Link href="/saved-recipes" className="block py-2 text-gray-700 hover:text-orange-500">Saved Recipes</Link>
              <Link href="/recent-recipes" className="block py-2 text-gray-700 hover:text-orange-500">Recent Recipes</Link>
              <Link href="/likes-dislikes" className="block py-2 text-gray-700 hover:text-orange-500">Manage Likes/Dislikes</Link>
              <Link href="/settings" className="block py-2 text-gray-700 hover:text-orange-500">Settings</Link>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome back, {session?.user?.name || 'Chef'}!
          </h2>
          <p className="text-gray-600 mt-2">What would you like to cook today?</p>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => generateRecipe({ type: 'random' })}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold py-6 px-8 rounded-full shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Make me a recipe!'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/pantry')}
            className="w-full bg-white text-gray-800 font-semibold py-4 px-6 rounded-full shadow-md hover:shadow-lg transition-shadow border border-gray-200 relative"
          >
            What can I make with my ingredients?
            <span className="absolute top-2 right-4 text-orange-500 text-sm">
              <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </span>
          </motion.button>
        </div>

        {/* Timeline Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">On a timeline?</h3>
            <label className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Use preferences?</span>
              <input
                type="checkbox"
                checked={usePreferences}
                onChange={(e) => setUsePreferences(e.target.checked)}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-400"
              />
            </label>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {timelines.map((time) => (
              <motion.button
                key={time.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => generateRecipe({ type: 'timeline', timeLimit: time.value })}
                disabled={isGenerating}
                className="bg-gray-100 hover:bg-orange-100 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {time.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Protein Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Make me something with</h3>
          <div className="grid grid-cols-2 gap-3">
            {proteins.map((protein) => (
              <motion.button
                key={protein}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => generateRecipe({ type: 'protein', protein })}
                disabled={isGenerating}
                className="bg-gray-100 hover:bg-green-100 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {protein}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Cuisine Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">I&apos;m in the mood for</h3>
          <div className="grid grid-cols-2 gap-3">
            {cuisines.map((cuisine) => (
              <motion.button
                key={cuisine}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => generateRecipe({ type: 'cuisine', cuisine })}
                disabled={isGenerating}
                className="bg-gray-100 hover:bg-blue-100 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {cuisine}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recipe Display */}
        {currentRecipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <RecipeCard
              recipe={currentRecipe}
              onModify={() => setShowModificationChat(true)}
              onConfirm={handleConfirmRecipe}
              onReroll={handleRerollRecipe}
            />
          </motion.div>
        )}
      </main>

      {/* Modification Chat */}
      <ModificationChat
        recipeId={currentRecipe?.id}
        isOpen={showModificationChat}
        onClose={() => setShowModificationChat(false)}
      />

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium text-gray-800">Generating your recipe...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}