'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Clock, Loader2 } from 'lucide-react'

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
  const { toast } = useToast()
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
        toast({
          title: 'Preferences saved',
          description: 'Your preferences have been updated successfully.'
        })
        router.push('/')
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save preferences. Please try again.',
          variant: 'destructive'
        })
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
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <h1 className="text-xl font-semibold">My Preferences</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Your Recipe Preferences</CardTitle>
            <p className="text-gray-600 mt-2">Customize your recipe generation experience</p>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* Cook Time Range */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Cook Time Range
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum cook time: <Badge variant="secondary">{preferences.minCookTime} minutes</Badge>
                  </label>
                  <Slider
                    min={1}
                    max={240}
                    step={1}
                    value={[preferences.minCookTime]}
                    onValueChange={(value) => setPreferences({ ...preferences, minCookTime: value[0] })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum cook time: <Badge variant="secondary">
                      {preferences.maxCookTime} minutes ({Math.floor(preferences.maxCookTime / 60)}h {preferences.maxCookTime % 60}m)
                    </Badge>
                  </label>
                  <Slider
                    min={1}
                    max={1440}
                    step={5}
                    value={[preferences.maxCookTime]}
                    onValueChange={(value) => setPreferences({ ...preferences, maxCookTime: value[0] })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Dietary Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="vegan"
                    checked={preferences.isVegan}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, isVegan: checked as boolean })}
                  />
                  <label htmlFor="vegan" className="text-gray-700 cursor-pointer">Vegan</label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="vegetarian"
                    checked={preferences.isVegetarian}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, isVegetarian: checked as boolean })}
                  />
                  <label htmlFor="vegetarian" className="text-gray-700 cursor-pointer">Vegetarian</label>
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Allergies & Restrictions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {commonAllergies.map((allergy) => (
                  <motion.div
                    key={allergy}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => toggleArrayItem(preferences.allergies, allergy, 'allergies')}
                      variant={preferences.allergies.includes(allergy) ? 'destructive' : 'outline'}
                      className="w-full"
                    >
                      {allergy}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Preferred Proteins */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferred Proteins</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {proteinOptions.map((protein) => (
                  <motion.div
                    key={protein}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => toggleArrayItem(preferences.preferredProteins, protein, 'preferredProteins')}
                      variant={preferences.preferredProteins.includes(protein) ? 'default' : 'outline'}
                      className={preferences.preferredProteins.includes(protein) ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {protein}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Preferred Cuisines */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferred Cuisines</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {cuisineOptions.map((cuisine) => (
                  <motion.div
                    key={cuisine}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => toggleArrayItem(preferences.preferredCuisines, cuisine, 'preferredCuisines')}
                      variant={preferences.preferredCuisines.includes(cuisine) ? 'default' : 'outline'}
                      className={preferences.preferredCuisines.includes(cuisine) ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      {cuisine}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Recipes Setting */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recipe History</h3>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of recent recipes to save: <Badge variant="secondary">{preferences.maxRecentRecipes}</Badge>
              </label>
              <Slider
                min={1}
                max={20}
                step={1}
                value={[preferences.maxRecentRecipes]}
                onValueChange={(value) => setPreferences({ ...preferences, maxRecentRecipes: value[0] })}
                className="w-full"
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600"
                  size="lg"
                >
                  {isSaving && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}