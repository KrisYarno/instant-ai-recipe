'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, ChefHat, ArrowLeft } from 'lucide-react'

interface PantryItem {
  id: string
  name: string
  category: string
  quantity?: string
  unit?: string
  expiryDate?: string
}

const categories = [
  'Proteins',
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Spices',
  'Condiments',
  'Other'
]

export default function PantryPage() {
  const { } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Other',
    quantity: '',
    unit: '',
    expiryDate: ''
  })
  const [isAdding, setIsAdding] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchPantryItems()
  }, [])

  const fetchPantryItems = async () => {
    try {
      const response = await fetch('/api/pantry')
      if (response.ok) {
        const data = await response.json()
        setPantryItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching pantry items:', error)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return

    try {
      const response = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      })

      if (response.ok) {
        const data = await response.json()
        setPantryItems([...pantryItems, data.item])
        setNewItem({
          name: '',
          category: 'Other',
          quantity: '',
          unit: '',
          expiryDate: ''
        })
        setIsAdding(false)
        toast({
          title: 'Item added',
          description: `${data.item.name} has been added to your pantry.`
        })
      }
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/pantry/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPantryItems(pantryItems.filter(item => item.id !== id))
        toast({
          title: 'Item removed',
          description: 'The item has been removed from your pantry.'
        })
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const filteredItems = selectedCategory === 'All' 
    ? pantryItems 
    : pantryItems.filter(item => item.category === selectedCategory)

  const toggleItemSelection = (itemName: string) => {
    setSelectedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const generateRecipeWithPantry = async () => {
    if (selectedItems.length === 0) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pantry',
          pantryItems: selectedItems,
          usePreferences: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Store the recipe ID in session storage to display on home page
        sessionStorage.setItem('generatedRecipeId', data.recipe.id)
        router.push('/')
      }
    } catch (error) {
      console.error('Error generating recipe:', error)
    } finally {
      setIsGenerating(false)
    }
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
            <h1 className="text-xl font-semibold">My Pantry</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">My Digital Pantry</h2>
          <p className="text-gray-600">Keep track of your ingredients and what you have at home</p>
        </div>

        {/* Add Item Button */}
        <div className="mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => setIsAdding(!isAdding)}
              className="w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              {isAdding ? 'Cancel' : 'Add New Item'}
            </Button>
          </motion.div>
        </div>

        {/* Add Item Form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6">
              <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <Input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Chicken Breast"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="flex-1"
                    placeholder="2"
                  />
                  <Input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-24"
                    placeholder="lbs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={newItem.expiryDate}
                  onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                />
              </div>
            </div>

                <Button
                  onClick={handleAddItem}
                  disabled={!newItem.name.trim()}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700"
                >
                  Add to Pantry
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recipe Generation Section */}
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg p-4 mb-6 text-white"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedItems.length} ingredient{selectedItems.length !== 1 ? 's' : ''} selected
                </h3>
                <p className="text-sm text-white/90">
                  Generate a recipe using these ingredients
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={generateRecipeWithPantry}
                  disabled={isGenerating}
                  variant="secondary"
                  className="bg-white text-green-600 hover:bg-gray-100"
                >
                  <ChefHat className="w-5 h-5 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Recipe'}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedCategory('All')}
              variant={selectedCategory === 'All' ? 'default' : 'outline'}
              size="sm"
              className={selectedCategory === 'All'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : ''
              }
            >
              All Items ({pantryItems.length})
            </Button>
            {categories.map(cat => {
              const count = pantryItems.filter(item => item.category === cat).length
              return (
                <Button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  className={selectedCategory === cat
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : ''
                  }
                >
                  {cat} ({count})
                </Button>
              )
            })}
          </div>
        </div>

        {/* Pantry Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card 
                onClick={() => toggleItemSelection(item.name)}
                className={`relative cursor-pointer transition-all ${
                  selectedItems.includes(item.name) 
                    ? 'ring-2 ring-green-500 bg-green-50' 
                    : ''
                }`}
              >
                <CardContent className="p-4">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteItem(item.id)
                    }}
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 z-10 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {/* Selection checkbox */}
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={selectedItems.includes(item.name)}
                      onCheckedChange={() => {}}
                      className="h-5 w-5"
                    />
                  </div>

              <h3 className="font-semibold text-lg text-gray-800 mb-1 ml-8">{item.name}</h3>
              <p className="text-sm text-gray-600 ml-8">{item.category}</p>
              
              {(item.quantity || item.unit) && (
                <p className="text-sm text-gray-700 mt-2">
                  Quantity: {item.quantity} {item.unit}
                </p>
              )}
              
              {item.expiryDate && (
                <p className="text-sm text-gray-700">
                  Expires: {new Date(item.expiryDate).toLocaleDateString()}
                </p>
              )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {selectedCategory === 'All' 
                ? 'Your pantry is empty. Start adding items!'
                : `No items in ${selectedCategory} category.`}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}