'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import RecipeCard from '@/components/recipe/RecipeCard'
import RecipeCustomizer from '@/components/recipe/RecipeCustomizer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Bookmark, Loader2, Trash2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Recipe } from '@/types/recipe'

export default function SavedRecipesPage() {
  const { toast } = useToast()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleUpdateRecipe = (recipeId: string, updates: { customColor?: string; customLabel?: string }) => {
    setRecipes(recipes.map(r => 
      r.id === recipeId ? { ...r, ...updates } : r
    ))
  }

  // Get unique categories from recipes
  const categories = Array.from(new Set(recipes.map(r => r.cuisine).filter((c): c is string => Boolean(c))))

  // Get unique labels from recipes
  const labels = Array.from(new Set(recipes.map(r => r.customLabel).filter((l): l is string => Boolean(l))))

  // Filter and sort recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = filterCategory === 'all' || 
                           recipe.cuisine === filterCategory || 
                           recipe.customLabel === filterCategory
    const matchesSearch = searchQuery === '' || 
                         recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.customLabel?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

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

        {/* Search bar */}
        {recipes.length > 0 && (
          <div className="mb-6 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Filters and Sort */}
        {recipes.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() => setFilterCategory('all')}
                variant={filterCategory === 'all' ? 'default' : 'outline'}
                className={filterCategory === 'all' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                size="sm"
              >
                All <Badge variant="secondary" className="ml-1">{recipes.length}</Badge>
              </Button>
              
              {/* Cuisine filters */}
              {categories.length > 0 && (
                <>
                  <div className="w-full text-center text-xs text-gray-500 mt-2">Cuisines</div>
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      variant={filterCategory === cat ? 'default' : 'outline'}
                      className={filterCategory === cat ? 'bg-blue-500 hover:bg-blue-600' : ''}
                      size="sm"
                    >
                      {cat} <Badge variant="secondary" className="ml-1">{recipes.filter(r => r.cuisine === cat).length}</Badge>
                    </Button>
                  ))}
                </>
              )}
              
              {/* Label filters */}
              {labels.length > 0 && (
                <>
                  <div className="w-full text-center text-xs text-gray-500 mt-2">Labels</div>
                  {labels.map(label => (
                    <Button
                      key={label}
                      onClick={() => setFilterCategory(label)}
                      variant={filterCategory === label ? 'default' : 'outline'}
                      className={filterCategory === label ? 'bg-purple-500 hover:bg-purple-600' : ''}
                      size="sm"
                    >
                      {label} <Badge variant="secondary" className="ml-1">{recipes.filter(r => r.customLabel === label).length}</Badge>
                    </Button>
                  ))}
                </>
              )}
            </div>

            <div className="flex justify-center">
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
              {searchQuery 
                ? 'No recipes found matching your search' 
                : filterCategory === 'all' 
                  ? 'No saved recipes yet' 
                  : `No recipes in this category`}
            </p>
            {(filterCategory !== 'all' || searchQuery) && (
              <Button
                onClick={() => {
                  setFilterCategory('all')
                  setSearchQuery('')
                }}
                variant="link"
                className="text-orange-500 hover:text-orange-600"
              >
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedRecipes.map((recipe) => (
              <div key={recipe.id} className="group relative">
                {/* Action buttons bar */}
                <div className="absolute top-2 left-2 z-10 flex gap-2 p-2 bg-white backdrop-blur-sm rounded-lg shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <RecipeCustomizer
                    recipeId={recipe.id}
                    currentColor={recipe.customColor}
                    currentLabel={recipe.customLabel}
                    onUpdate={(updates) => handleUpdateRecipe(recipe.id, updates)}
                  />
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnsaveRecipe(recipe.id)
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </Button>
                </div>
                
                <RecipeCard
                  recipe={recipe}
                  showVoting={false}
                  onRecipeUpdate={(updatedRecipe) => {
                    setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}