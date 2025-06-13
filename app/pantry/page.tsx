'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
            <Link href="/" className="text-xl font-bold text-gray-900">
              ← Back to Home
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdding(!isAdding)}
            className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            {isAdding ? 'Cancel' : '+ Add New Item'}
          </motion.button>
        </div>

        {/* Add Item Form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Chicken Breast"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="2"
                  />
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="lbs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={newItem.expiryDate}
                  onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <button
              onClick={handleAddItem}
              disabled={!newItem.name.trim()}
              className="mt-4 w-full bg-green-600 text-white font-medium py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Add to Pantry
            </button>
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateRecipeWithPantry}
                disabled={isGenerating}
                className="px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Recipe'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Items ({pantryItems.length})
            </button>
            {categories.map(cat => {
              const count = pantryItems.filter(item => item.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat} ({count})
                </button>
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
              onClick={() => toggleItemSelection(item.name)}
              className={`bg-white rounded-lg shadow-md p-4 relative cursor-pointer transition-all ${
                selectedItems.includes(item.name) 
                  ? 'ring-2 ring-green-500 bg-green-50' 
                  : ''
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteItem(item.id)
                }}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Selection checkbox */}
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.name)}
                  onChange={() => {}}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
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