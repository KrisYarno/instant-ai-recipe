'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import RecipeCard from '@/components/recipe/RecipeCard'
import ModificationChat from '@/components/recipe/ModificationChat'

export default function SavedRecipesPage() {
  const { data: session } = useSession()
  const [recipes, setRecipes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [showModificationChat, setShowModificationChat] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')

  useEffect(() => {
    fetchSavedRecipes()
  }, [])

  const fetchSavedRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/saved')
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes)
      }
    } catch (error) {
      console.error('Error fetching saved recipes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsaveRecipe = async (recipeId: string) => {
    if (!confirm('Remove this recipe from your saved collection?')) return

    try {
      const response = await fetch(`/api/recipes/${recipeId}/save`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setRecipes(recipes.filter(r => r.id !== recipeId))
      }
    } catch (error) {
      console.error('Error unsaving recipe:', error)
    }
  }

  const handleUpdateColor = async (recipeId: string, color: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/customize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customColor: color })
      })
      if (response.ok) {
        const updatedRecipes = recipes.map(r => 
          r.id === recipeId ? { ...r, customColor: color } : r
        )
        setRecipes(updatedRecipes)
      }
    } catch (error) {
      console.error('Error updating recipe color:', error)
    }
  }

  const handleUpdateLabel = async (recipeId: string, label: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/customize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customLabel: label })
      })
      if (response.ok) {
        const updatedRecipes = recipes.map(r => 
          r.id === recipeId ? { ...r, customLabel: label } : r
        )
        setRecipes(updatedRecipes)
      }
    } catch (error) {
      console.error('Error updating recipe label:', error)
    }
  }

  // Get unique categories from recipes
  const categories = Array.from(new Set(recipes.map(r => r.cuisine).filter(Boolean)))

  // Filter and sort recipes
  const filteredRecipes = recipes.filter(recipe => 
    filterCategory === 'all' || recipe.cuisine === filterCategory
  )

  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'name':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const colorOptions = [
    'from-orange-400 to-red-500',
    'from-blue-400 to-indigo-500',
    'from-green-400 to-emerald-500',
    'from-purple-400 to-pink-500',
    'from-yellow-400 to-orange-500',
    'from-pink-400 to-rose-500'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              ← Back to Home
            </Link>
            <h1 className="text-xl font-semibold">Saved Recipes</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Recipe Collection</h2>
          <p className="text-gray-600">
            {recipes.length} saved {recipes.length === 1 ? 'recipe' : 'recipes'}
          </p>
        </div>

        {/* Filters and Sort */}
        {recipes.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                All ({recipes.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filterCategory === cat
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat} ({recipes.filter(r => r.cuisine === cat).length})
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-4">
              {filterCategory === 'all' 
                ? 'No saved recipes yet' 
                : `No ${filterCategory} recipes saved`}
            </p>
            {filterCategory !== 'all' && (
              <button
                onClick={() => setFilterCategory('all')}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                View all recipes
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedRecipes.map((recipe) => (
              <div key={recipe.id} className="relative group">
                <RecipeCard
                  recipe={recipe}
                  onModify={() => {
                    setSelectedRecipe(recipe)
                    setShowModificationChat(true)
                  }}
                />
                
                {/* Customization overlay */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">
                    {/* Color options */}
                    <div className="flex gap-1">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleUpdateColor(recipe.id, color)}
                          className={`w-6 h-6 rounded-full bg-gradient-to-r ${color} ${
                            recipe.customColor === color ? 'ring-2 ring-gray-800' : ''
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Label input */}
                    <input
                      type="text"
                      placeholder="Add label..."
                      value={recipe.customLabel || ''}
                      onChange={(e) => handleUpdateLabel(recipe.id, e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    
                    {/* Unsave button */}
                    <button
                      onClick={() => handleUnsaveRecipe(recipe.id)}
                      className="w-full px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modification Chat */}
      <ModificationChat
        recipeId={selectedRecipe?.id}
        isOpen={showModificationChat}
        onClose={() => setShowModificationChat(false)}
      />
    </div>
  )
}