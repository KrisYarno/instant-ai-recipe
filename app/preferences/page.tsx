'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserPreferences {
  minCookTime: number
  maxCookTime: number
  isVegan: boolean
  isVegetarian: boolean
  allergies: string[]
  dietaryRestrictions: string[]
  preferredProteins: string[]
  preferredCuisines: string[]
  maxRecentRecipes: number
}

const commonAllergies = [
  'Nuts', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Shellfish', 'Fish', 'Sesame'
]

const proteinOptions = [
  'Chicken', 'Beef', 'Pork', 'Fish', 'Tofu', 'Beans', 'Lentils', 'Eggs'
]

const cuisineOptions = [
  'Asian', 'Mexican', 'Italian', 'American', 'Indian', 'Mediterranean', 'French', 'Thai'
]

export default function PreferencesPage() {
  const { } = useSession()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences>({
    minCookTime: 1,
    maxCookTime: 120,
    isVegan: false,
    isVegetarian: false,
    allergies: [],
    dietaryRestrictions: [],
    preferredProteins: [],
    preferredCuisines: [],
    maxRecentRecipes: 5
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.preferences) {
          setPreferences(data.preferences)
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        // Show success message or redirect
        router.push('/')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleArrayItem = (array: string[], item: string, key: keyof UserPreferences) => {
    const currentArray = preferences[key] as string[]
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item]
    
    setPreferences({ ...preferences, [key]: newArray })
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
            <h1 className="text-xl font-semibold">My Preferences</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Recipe Preferences</h2>
            <p className="text-gray-600">Customize your recipe generation experience</p>
          </div>

          {/* Cook Time Range */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cook Time Range</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum cook time: {preferences.minCookTime} minutes
                </label>
                <input
                  type="range"
                  min="1"
                  max="240"
                  value={preferences.minCookTime}
                  onChange={(e) => setPreferences({ ...preferences, minCookTime: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum cook time: {preferences.maxCookTime} minutes ({Math.floor(preferences.maxCookTime / 60)}h {preferences.maxCookTime % 60}m)
                </label>
                <input
                  type="range"
                  min="1"
                  max="1440"
                  value={preferences.maxCookTime}
                  onChange={(e) => setPreferences({ ...preferences, maxCookTime: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Dietary Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dietary Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.isVegan}
                  onChange={(e) => setPreferences({ ...preferences, isVegan: e.target.checked })}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-400"
                />
                <span className="text-gray-700">Vegan</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.isVegetarian}
                  onChange={(e) => setPreferences({ ...preferences, isVegetarian: e.target.checked })}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-400"
                />
                <span className="text-gray-700">Vegetarian</span>
              </label>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Allergies & Restrictions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {commonAllergies.map((allergy) => (
                <motion.button
                  key={allergy}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleArrayItem(preferences.allergies, allergy, 'allergies')}
                  className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                    preferences.allergies.includes(allergy)
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {allergy}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Preferred Proteins */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferred Proteins</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {proteinOptions.map((protein) => (
                <motion.button
                  key={protein}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleArrayItem(preferences.preferredProteins, protein, 'preferredProteins')}
                  className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                    preferences.preferredProteins.includes(protein)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {protein}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Preferred Cuisines */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferred Cuisines</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cuisineOptions.map((cuisine) => (
                <motion.button
                  key={cuisine}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleArrayItem(preferences.preferredCuisines, cuisine, 'preferredCuisines')}
                  className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                    preferences.preferredCuisines.includes(cuisine)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cuisine}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent Recipes Setting */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recipe History</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of recent recipes to save: {preferences.maxRecentRecipes}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={preferences.maxRecentRecipes}
              onChange={(e) => setPreferences({ ...preferences, maxRecentRecipes: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  )
}