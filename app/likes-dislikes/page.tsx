'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Ingredient {
  name: string
  category: string
}

const commonIngredients: Ingredient[] = [
  // Proteins
  { name: 'Chicken', category: 'Proteins' },
  { name: 'Beef', category: 'Proteins' },
  { name: 'Pork', category: 'Proteins' },
  { name: 'Fish', category: 'Proteins' },
  { name: 'Shrimp', category: 'Proteins' },
  { name: 'Tofu', category: 'Proteins' },
  { name: 'Eggs', category: 'Proteins' },
  { name: 'Beans', category: 'Proteins' },
  
  // Vegetables
  { name: 'Onions', category: 'Vegetables' },
  { name: 'Garlic', category: 'Vegetables' },
  { name: 'Tomatoes', category: 'Vegetables' },
  { name: 'Bell Peppers', category: 'Vegetables' },
  { name: 'Carrots', category: 'Vegetables' },
  { name: 'Celery', category: 'Vegetables' },
  { name: 'Mushrooms', category: 'Vegetables' },
  { name: 'Spinach', category: 'Vegetables' },
  { name: 'Broccoli', category: 'Vegetables' },
  { name: 'Cauliflower', category: 'Vegetables' },
  
  // Grains
  { name: 'Rice', category: 'Grains' },
  { name: 'Pasta', category: 'Grains' },
  { name: 'Quinoa', category: 'Grains' },
  { name: 'Oats', category: 'Grains' },
  { name: 'Bread', category: 'Grains' },
  
  // Dairy
  { name: 'Milk', category: 'Dairy' },
  { name: 'Cheese', category: 'Dairy' },
  { name: 'Yogurt', category: 'Dairy' },
  { name: 'Butter', category: 'Dairy' },
  { name: 'Cream', category: 'Dairy' },
  
  // Spices & Herbs
  { name: 'Salt', category: 'Spices' },
  { name: 'Black Pepper', category: 'Spices' },
  { name: 'Cumin', category: 'Spices' },
  { name: 'Paprika', category: 'Spices' },
  { name: 'Oregano', category: 'Spices' },
  { name: 'Basil', category: 'Spices' },
  { name: 'Thyme', category: 'Spices' },
  { name: 'Cilantro', category: 'Spices' },
  { name: 'Ginger', category: 'Spices' },
  { name: 'Turmeric', category: 'Spices' },
]

export default function LikesDislikesPage() {
  const { } = useSession()
  const [likedIngredients, setLikedIngredients] = useState<string[]>([])
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([])
  const [customIngredient, setCustomIngredient] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/likes-dislikes')
      if (response.ok) {
        const data = await response.json()
        setLikedIngredients(data.likedIngredients || [])
        setDislikedIngredients(data.dislikedIngredients || [])
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/likes-dislikes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likedIngredients,
          dislikedIngredients
        })
      })

      if (response.ok) {
        // Show success feedback
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleIngredient = (ingredient: string, type: 'like' | 'dislike') => {
    if (type === 'like') {
      if (likedIngredients.includes(ingredient)) {
        setLikedIngredients(likedIngredients.filter(i => i !== ingredient))
      } else {
        setLikedIngredients([...likedIngredients, ingredient])
        // Remove from dislikes if it's there
        setDislikedIngredients(dislikedIngredients.filter(i => i !== ingredient))
      }
    } else {
      if (dislikedIngredients.includes(ingredient)) {
        setDislikedIngredients(dislikedIngredients.filter(i => i !== ingredient))
      } else {
        setDislikedIngredients([...dislikedIngredients, ingredient])
        // Remove from likes if it's there
        setLikedIngredients(likedIngredients.filter(i => i !== ingredient))
      }
    }
  }

  const addCustomIngredient = (type: 'like' | 'dislike') => {
    if (!customIngredient.trim()) return
    
    const ingredient = customIngredient.trim()
    if (type === 'like') {
      if (!likedIngredients.includes(ingredient)) {
        setLikedIngredients([...likedIngredients, ingredient])
        setDislikedIngredients(dislikedIngredients.filter(i => i !== ingredient))
      }
    } else {
      if (!dislikedIngredients.includes(ingredient)) {
        setDislikedIngredients([...dislikedIngredients, ingredient])
        setLikedIngredients(likedIngredients.filter(i => i !== ingredient))
      }
    }
    setCustomIngredient('')
  }

  const categories = ['All', ...Array.from(new Set(commonIngredients.map(i => i.category)))]
  
  const filteredIngredients = selectedCategory === 'All' 
    ? commonIngredients 
    : commonIngredients.filter(i => i.category === selectedCategory)

  const getIngredientStatus = (name: string) => {
    if (likedIngredients.includes(name)) return 'liked'
    if (dislikedIngredients.includes(name)) return 'disliked'
    return 'neutral'
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
            <h1 className="text-xl font-semibold">Likes & Dislikes</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Manage Your Ingredient Preferences</h2>
          <p className="text-gray-600">
            These preferences will be used when generating recipes
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-green-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Liked Ingredients ({likedIngredients.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {likedIngredients.slice(0, 10).map(ingredient => (
                <span key={ingredient} className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-sm">
                  {ingredient}
                </span>
              ))}
              {likedIngredients.length > 10 && (
                <span className="text-green-600 text-sm">
                  +{likedIngredients.length - 10} more
                </span>
              )}
            </div>
          </div>

          <div className="bg-red-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Disliked Ingredients ({dislikedIngredients.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {dislikedIngredients.slice(0, 10).map(ingredient => (
                <span key={ingredient} className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-sm">
                  {ingredient}
                </span>
              ))}
              {dislikedIngredients.length > 10 && (
                <span className="text-red-600 text-sm">
                  +{dislikedIngredients.length - 10} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients Grid */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredIngredients.map(({ name }) => {
              const status = getIngredientStatus(name)
              return (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 rounded-lg border-2 transition-all"
                  style={{
                    borderColor: status === 'liked' ? '#10b981' : status === 'disliked' ? '#ef4444' : '#e5e7eb',
                    backgroundColor: status === 'liked' ? '#d1fae5' : status === 'disliked' ? '#fee2e2' : '#ffffff'
                  }}
                >
                  <span className="font-medium text-gray-800">{name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleIngredient(name, 'like')}
                      className={`p-1 rounded transition-colors ${
                        status === 'liked' ? 'text-green-700' : 'text-gray-400 hover:text-green-600'
                      }`}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => toggleIngredient(name, 'dislike')}
                      className={`p-1 rounded transition-colors ${
                        status === 'disliked' ? 'text-red-700' : 'text-gray-400 hover:text-red-600'
                      }`}
                    >
                      👎
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Custom Ingredient */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Custom Ingredient</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={customIngredient}
              onChange={(e) => setCustomIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomIngredient('like')}
              placeholder="Enter ingredient name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={() => addCustomIngredient('like')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Like 👍
            </button>
            <button
              onClick={() => addCustomIngredient('dislike')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Dislike 👎
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-4 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </motion.button>
        </div>
      </main>
    </div>
  )
}