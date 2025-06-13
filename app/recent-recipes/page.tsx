'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import RecipeCard from '@/components/recipe/RecipeCard'
import ModificationChat from '@/components/recipe/ModificationChat'
import type { Recipe } from '@/types/recipe'

export default function RecentRecipesPage() {
  const { data: session } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showModificationChat, setShowModificationChat] = useState(false)

  useEffect(() => {
    fetchRecentRecipes()
  }, [])

  const fetchRecentRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/recent')
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes)
      }
    } catch (error) {
      console.error('Error fetching recent recipes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveRecipe = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/save`, {
        method: 'POST'
      })
      if (response.ok) {
        // Update UI to show recipe is saved
        const updatedRecipes = recipes.map(r => 
          r.id === recipeId ? { ...r, isSaved: true } : r
        )
        setRecipes(updatedRecipes)
      }
    } catch (error) {
      console.error('Error saving recipe:', error)
    }
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Remove this recipe from your recent history?')) return

    try {
      const response = await fetch(`/api/recipes/${recipeId}/remove-recent`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setRecipes(recipes.filter(r => r.id !== recipeId))
      }
    } catch (error) {
      console.error('Error removing recipe:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              ← Back to Home
            </Link>
            <h1 className="text-xl font-semibold">Recent Recipes</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Recent Recipes</h2>
          <p className="text-gray-600">
            Your last {session?.user ? 'generated' : ''} recipes
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-4">No recent recipes yet</p>
            <Link
              href="/"
              className="inline-block bg-orange-500 text-white font-medium py-2 px-6 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Generate Your First Recipe
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="relative">
                <RecipeCard
                  recipe={recipe}
                  onModify={() => {
                    setSelectedRecipe(recipe)
                    setShowModificationChat(true)
                  }}
                />
                
                {/* Action buttons overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleSaveRecipe(recipe.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      recipe.isSaved
                        ? 'bg-green-500 text-white'
                        : 'bg-white/90 text-gray-700 hover:bg-gray-100'
                    }`}
                    title={recipe.isSaved ? 'Saved' : 'Save recipe'}
                  >
                    <svg className="w-5 h-5" fill={recipe.isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="p-2 bg-white/90 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from recent"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
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