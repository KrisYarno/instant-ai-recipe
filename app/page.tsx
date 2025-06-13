'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RecipeCard from '@/components/recipe/RecipeCard'
import type { Recipe } from '@/types/recipe'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { ChefHat, Clock, Menu, X, Info, Settings, Globe, Users } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [usePreferences, setUsePreferences] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null)
  const [usage, setUsage] = useState({ used: 0, remaining: 50, limit: 50 })
  const [userPrefs, setUserPrefs] = useState<{
    isVegan?: boolean
    isVegetarian?: boolean
    allergies?: string[]
    minCookTime?: number
    maxCookTime?: number
    preferredProteins?: string[]
    preferredCuisines?: string[]
  } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if we have a recipe from pantry generation
    const recipeId = sessionStorage.getItem('generatedRecipeId')
    if (recipeId) {
      sessionStorage.removeItem('generatedRecipeId')
      fetchRecipe(recipeId)
    }
    
    // Fetch usage stats
    fetchUsage()
    
    // Fetch user preferences
    fetchPreferences()
  }, [])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/recipes/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
    }
  }

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

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/preferences')
      if (response.ok) {
        const data = await response.json()
        setUserPrefs(data.preferences)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const proteins = ['Chicken', 'Beef', 'Pork', 'Fish', 'Turkey', 'Shrimp', 'Sausage', 'Vegetarian']
  const cuisines = ['Mexican', 'Italian', 'Asian', 'Indian', 'Mediterranean', 'Southern', 'Thai', 'Cajun']
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
        // Update usage after successful generation
        fetchUsage()
      } else if (response.status === 429) {
        const data = await response.json()
        toast({
          title: 'Rate limit reached',
          description: data.error,
          variant: 'destructive'
        })
      } else {
        console.error('Failed to generate recipe')
        toast({
          title: 'Error',
          description: 'Failed to generate recipe. Please try again.',
          variant: 'destructive'
        })
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>

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
          
          {/* Usage indicator */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <Badge className="inline-flex items-center gap-2 bg-white px-4 py-2 text-sm font-medium">
              <ChefHat className="w-5 h-5 text-orange-500" />
              <span>{usage.remaining} recipes remaining today</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all"
                  style={{ width: `${(usage.remaining / usage.limit) * 100}%` }}
                />
              </div>
            </Badge>
          </div>
        </div>

        {/* Global Preferences Toggle */}
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${usePreferences ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Settings className={`w-5 h-5 ${usePreferences ? 'text-green-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <label htmlFor="global-preferences" className="font-medium text-gray-800 cursor-pointer">
                    Use My Dietary Preferences
                  </label>
                  <p className="text-sm text-gray-600">
                    {usePreferences 
                      ? 'Recipes will respect your dietary restrictions, allergies, and preferences' 
                      : 'Generate recipes without dietary restrictions'}
                  </p>
                </div>
              </div>
              <Checkbox
                id="global-preferences"
                checked={usePreferences}
                onCheckedChange={(checked) => setUsePreferences(checked as boolean)}
                className="h-6 w-6"
              />
            </div>
            {usePreferences && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Link href="/preferences">
                    <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                      <Settings className="w-3 h-3 mr-1" />
                      Edit Preferences
                    </Badge>
                  </Link>
                  <Link href="/likes-dislikes">
                    <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                      Edit Likes/Dislikes
                    </Badge>
                  </Link>
                </div>
                {userPrefs && (
                  <div className="text-sm text-gray-700 bg-white/50 rounded p-2 space-y-2">
                    {(userPrefs.isVegan || userPrefs.isVegetarian || (userPrefs.allergies && userPrefs.allergies.length > 0) || (userPrefs.minCookTime && userPrefs.maxCookTime)) && (
                      <div>
                        <p className="font-medium mb-1">Active restrictions:</p>
                        <div className="flex flex-wrap gap-1">
                          {userPrefs.isVegan && <Badge variant="outline" className="text-xs">Vegan</Badge>}
                          {userPrefs.isVegetarian && !userPrefs.isVegan && <Badge variant="outline" className="text-xs">Vegetarian</Badge>}
                          {userPrefs.allergies?.map((allergy: string) => (
                            <Badge key={allergy} variant="destructive" className="text-xs">No {allergy}</Badge>
                          ))}
                          {userPrefs.minCookTime && userPrefs.maxCookTime && (
                            <Badge variant="outline" className="text-xs">{userPrefs.minCookTime}-{userPrefs.maxCookTime} min</Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {userPrefs.preferredProteins && userPrefs.preferredProteins.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Preferred proteins:</p>
                        <div className="flex flex-wrap gap-1">
                          {userPrefs.preferredProteins.map((protein: string) => (
                            <Badge key={protein} variant="secondary" className="text-xs bg-green-100 text-green-800">
                              {protein}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {userPrefs.preferredCuisines && userPrefs.preferredCuisines.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Preferred cuisines:</p>
                        <div className="flex flex-wrap gap-1">
                          {userPrefs.preferredCuisines.map((cuisine: string) => (
                            <Badge key={cuisine} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              {cuisine}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Action Buttons */}
        <div className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => generateRecipe({ type: 'random' })}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-6 px-8 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              size="lg"
            >
              {isGenerating ? 'Generating...' : 'Make me a recipe!'}
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => router.push('/pantry')}
              variant="outline"
              className="w-full bg-white text-gray-800 font-semibold py-4 px-6 shadow-md hover:shadow-lg transition-shadow border-gray-200 relative"
              size="lg"
            >
              What can I make with my ingredients?
              <Info className="absolute top-2 right-4 w-5 h-5 text-orange-500" />
            </Button>
          </motion.div>
        </div>

        {/* Timeline Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              On a timeline?
            </h3>
          
            <div className="grid grid-cols-2 gap-3">
              {timelines.map((time) => (
                <motion.div
                  key={time.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => generateRecipe({ type: 'timeline', timeLimit: time.value })}
                    disabled={isGenerating}
                    variant="secondary"
                    className="w-full bg-gray-100 hover:bg-orange-100"
                  >
                    {time.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Protein Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Make me something with
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {proteins.map((protein) => (
                <motion.div
                  key={protein}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => generateRecipe({ type: 'protein', protein })}
                    disabled={isGenerating}
                    variant="secondary"
                    className="w-full bg-gray-100 hover:bg-green-100"
                  >
                    {protein}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cuisine Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              I&apos;m in the mood for
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cuisines.map((cuisine) => (
                <motion.div
                  key={cuisine}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => generateRecipe({ type: 'cuisine', cuisine })}
                    disabled={isGenerating}
                    variant="secondary"
                    className="w-full bg-gray-100 hover:bg-blue-100"
                  >
                    {cuisine}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recipe Display */}
        {currentRecipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <RecipeCard
              recipe={currentRecipe}
              onConfirm={handleConfirmRecipe}
              onReroll={handleRerollRecipe}
              onRecipeUpdate={(updatedRecipe) => setCurrentRecipe(updatedRecipe)}
            />
          </motion.div>
        )}
      </main>

      {/* Removed old modification chat - now inline in RecipeCard */}

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