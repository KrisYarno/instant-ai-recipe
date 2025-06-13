'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import RecipeCard from '@/components/recipe/RecipeCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, ChefHat, Bookmark, Trash2, Loader2 } from 'lucide-react'
import type { Recipe } from '@/types/recipe'

export default function RecentRecipesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        toast({
          title: 'Recipe saved',
          description: 'Recipe has been added to your saved recipes'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save recipe',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving recipe:', error)
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive'
      })
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
        toast({
          title: 'Recipe removed',
          description: 'Recipe has been removed from your recent history'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove recipe',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error removing recipe:', error)
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
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
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <Card className="text-center py-12 px-6">
            <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-4">No recent recipes yet</p>
            <Button asChild>
              <Link href="/">
                Generate Your First Recipe
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden">
                {/* Action buttons bar */}
                <div className="flex justify-end gap-2 p-3 bg-gray-50 border-b">
                  <Button
                    onClick={() => handleSaveRecipe(recipe.id)}
                    variant={recipe.isSaved ? 'default' : 'outline'}
                    size="icon"
                    className={recipe.isSaved ? 'bg-green-500 hover:bg-green-600' : ''}
                    title={recipe.isSaved ? 'Saved' : 'Save recipe'}
                  >
                    <Bookmark className={`w-5 h-5 ${recipe.isSaved ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    variant="outline"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Remove from recent"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                <RecipeCard
                  recipe={recipe}
                  onRecipeUpdate={(updatedRecipe) => {
                    setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
                  }}
                />
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Removed old modification chat - now inline in RecipeCard */}
    </div>
  )
}