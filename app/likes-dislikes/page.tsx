'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Trash2 } from 'lucide-react'

interface PreferenceCard {
  ingredient: string
  status: 'liked' | 'disliked'
}

export default function LikesDislikesPage() {
  const { } = useSession()
  const [preferences, setPreferences] = useState<PreferenceCard[]>([])
  const [customIngredient, setCustomIngredient] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/likes-dislikes')
      if (response.ok) {
        const data = await response.json()
        
        // Convert separate arrays into unified card format
        const cards: PreferenceCard[] = []
        
        data.likedIngredients?.forEach((ingredient: string) => {
          cards.push({ ingredient, status: 'liked' })
        })
        
        data.dislikedIngredients?.forEach((ingredient: string) => {
          cards.push({ ingredient, status: 'disliked' })
        })
        
        // Sort alphabetically by ingredient name
        cards.sort((a, b) => a.ingredient.localeCompare(b.ingredient))
        
        setPreferences(cards)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePreference = async (ingredient: string) => {
    const currentCard = preferences.find(p => p.ingredient === ingredient)
    if (!currentCard) return

    const newStatus = currentCard.status === 'liked' ? 'disliked' : 'liked'
    
    // Optimistically update UI
    setPreferences(prev => 
      prev.map(p => 
        p.ingredient === ingredient 
          ? { ...p, status: newStatus }
          : p
      )
    )

    try {
      // First remove from current status
      await fetch('/api/likes-dislikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient,
          action: 'remove',
          type: currentCard.status === 'liked' ? 'like' : 'dislike'
        })
      })

      // Then add to new status
      await fetch('/api/likes-dislikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient,
          action: 'add',
          type: newStatus === 'liked' ? 'like' : 'dislike'
        })
      })
    } catch (error) {
      console.error('Error toggling preference:', error)
      // Revert on error
      fetchPreferences()
    }
  }

  const deletePreference = async (ingredient: string) => {
    // Optimistically remove from UI
    setPreferences(prev => prev.filter(p => p.ingredient !== ingredient))

    try {
      const response = await fetch('/api/likes-dislikes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient })
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting preference:', error)
      // Revert on error
      fetchPreferences()
    }
  }

  const addNewPreference = async (status: 'liked' | 'disliked') => {
    if (!customIngredient.trim()) return

    const ingredient = customIngredient.trim()
    
    // Check if already exists
    if (preferences.some(p => p.ingredient.toLowerCase() === ingredient.toLowerCase())) {
      toast({
        title: 'Ingredient already exists',
        description: 'This ingredient is already in your preferences.',
        variant: 'destructive'
      })
      return
    }

    // Optimistically add to UI
    setPreferences(prev => [...prev, { ingredient, status }].sort((a, b) => 
      a.ingredient.localeCompare(b.ingredient)
    ))
    setCustomIngredient('')
    setShowAddForm(false)

    try {
      await fetch('/api/likes-dislikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient,
          action: 'add',
          type: status === 'liked' ? 'like' : 'dislike'
        })
      })
    } catch (error) {
      console.error('Error adding preference:', error)
      // Revert on error
      fetchPreferences()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              ← Back to Home
            </Link>
            <h1 className="text-xl font-semibold">Ingredient Preferences</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Your Ingredient Preferences
          </h2>
          <p className="text-gray-600">
            Manage your liked and disliked ingredients. These will be used when generating recipes.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>Liked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>Disliked</span>
            </div>
          </div>
        </div>

        {/* Add New Button */}
        <div className="text-center mb-8">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            + Add New Ingredient
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-8 max-w-md mx-auto">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Add Ingredient Preference</h3>
                <Input
                  type="text"
                  value={customIngredient}
                  onChange={(e) => setCustomIngredient(e.target.value)}
                  placeholder="Enter ingredient name..."
                  className="mb-4"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => addNewPreference('liked')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Add as Liked
                  </Button>
                  <Button
                    onClick={() => addNewPreference('disliked')}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Add as Disliked
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Preferences Grid */}
        {preferences.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              No ingredient preferences yet. Add some to personalize your recipes!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {preferences.map((pref) => (
              <motion.div
                key={pref.ingredient}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className={`relative border-2 transition-all ${
                  pref.status === 'liked'
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-400'
                }`}>
                  <CardContent className="p-4">
                {/* Status indicator */}
                <div
                  className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                    pref.status === 'liked' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                
                {/* Ingredient name */}
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pr-6">
                  {pref.ingredient}
                </h3>
                
                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => togglePreference(pref.ingredient)}
                    variant="outline"
                    size="sm"
                    className={`flex-1 ${
                      pref.status === 'liked'
                        ? 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300'
                        : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                    }`}
                  >
                    {pref.status === 'liked' ? 'Switch to Dislike' : 'Switch to Like'}
                  </Button>
                  <Button
                    onClick={() => deletePreference(pref.ingredient)}
                    variant="outline"
                    size="sm"
                    className="p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary */}
        {preferences.length > 0 && (
          <Card className="mt-12">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>
              <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-700 mb-2">
                  Liked Ingredients ({preferences.filter(p => p.status === 'liked').length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {preferences
                    .filter(p => p.status === 'liked')
                    .map(p => (
                      <span
                        key={p.ingredient}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                      >
                        {p.ingredient}
                      </span>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-red-700 mb-2">
                  Disliked Ingredients ({preferences.filter(p => p.status === 'disliked').length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {preferences
                    .filter(p => p.status === 'disliked')
                    .map(p => (
                      <span
                        key={p.ingredient}
                        className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                      >
                        {p.ingredient}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}