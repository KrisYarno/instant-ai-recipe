'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import RecipeCard from '@/components/recipe/RecipeCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Bookmark, Settings, Loader2 } from 'lucide-react'
import type { Recipe } from '@/types/recipe'

export default function SavedRecipesPage() {
  const { toast } = useToast()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
        toast({
          title: 'Recipe removed',
          description: 'Recipe has been removed from your collection'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove recipe',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error unsaving recipe:', error)
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive'
      })
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
  const categories = Array.from(new Set(recipes.map(r => r.cuisine).filter((c): c is string => Boolean(c))))

  // Filter and sort recipes
  const filteredRecipes = recipes.filter(recipe => 
    filterCategory === 'all' || recipe.cuisine === filterCategory
  )

  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
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
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
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
              <Button
                onClick={() => setFilterCategory('all')}
                variant={filterCategory === 'all' ? 'default' : 'outline'}
                className={filterCategory === 'all' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                All <Badge variant="secondary" className="ml-1">{recipes.length}</Badge>
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  variant={filterCategory === cat ? 'default' : 'outline'}
                  className={filterCategory === cat ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  {cat} <Badge variant="secondary" className="ml-1">{recipes.filter(r => r.cuisine === cat).length}</Badge>
                </Button>
              ))}
            </div>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'oldest' | 'name')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : sortedRecipes.length === 0 ? (
          <Card className="text-center py-12 px-6">
            <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Bookmark className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-4">
              {filterCategory === 'all' 
                ? 'No saved recipes yet' 
                : `No ${filterCategory} recipes saved`}
            </p>
            {filterCategory !== 'all' && (
              <Button
                onClick={() => setFilterCategory('all')}
                variant="link"
                className="text-orange-500 hover:text-orange-600"
              >
                View all recipes
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedRecipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden">
                {/* Action buttons bar */}
                <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
                  <Button
                    onClick={() => handleUnsaveRecipe(recipe.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove from saved
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      const customMenu = document.getElementById(`custom-${recipe.id}`)
                      if (customMenu) {
                        customMenu.classList.toggle('hidden')
                      }
                    }}
                    variant="ghost"
                    size="icon"
                    title="Customize"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Customization menu (hidden by default) */}
                <div id={`custom-${recipe.id}`} className="hidden p-3 bg-gray-50 border-b space-y-2">
                  <div className="bg-white rounded-lg shadow-lg p-3 space-y-3">
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
                    <Input
                      type="text"
                      placeholder="Add label..."
                      value={recipe.customLabel || ''}
                      onChange={(e) => handleUpdateLabel(recipe.id, e.target.value)}
                      className="text-sm"
                    />
                  </div>
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