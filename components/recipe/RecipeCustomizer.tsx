'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { Settings, Palette, Tag, Sparkles, Check, X } from 'lucide-react'

interface RecipeCustomizerProps {
  recipeId: string
  currentColor?: string
  currentLabel?: string
  onUpdate: (updates: { customColor?: string; customLabel?: string }) => void
}

const colorOptions = [
  { value: 'from-orange-400 to-red-500', name: 'Sunset', preview: 'bg-gradient-to-r from-orange-400 to-red-500' },
  { value: 'from-blue-400 to-indigo-500', name: 'Ocean', preview: 'bg-gradient-to-r from-blue-400 to-indigo-500' },
  { value: 'from-green-400 to-emerald-500', name: 'Forest', preview: 'bg-gradient-to-r from-green-400 to-emerald-500' },
  { value: 'from-purple-400 to-pink-500', name: 'Lavender', preview: 'bg-gradient-to-r from-purple-400 to-pink-500' },
  { value: 'from-yellow-400 to-orange-500', name: 'Sunrise', preview: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
  { value: 'from-pink-400 to-rose-500', name: 'Rose', preview: 'bg-gradient-to-r from-pink-400 to-rose-500' },
  { value: 'from-indigo-400 to-purple-500', name: 'Twilight', preview: 'bg-gradient-to-r from-indigo-400 to-purple-500' },
  { value: 'from-teal-400 to-cyan-500', name: 'Aqua', preview: 'bg-gradient-to-r from-teal-400 to-cyan-500' },
  { value: 'from-gray-400 to-gray-600', name: 'Slate', preview: 'bg-gradient-to-r from-gray-400 to-gray-600' },
]

const labelSuggestions = [
  'Family Favorite',
  'Quick & Easy',
  'Date Night',
  'Meal Prep',
  'Party Recipe',
  'Comfort Food',
  'Healthy Choice',
  'Weekend Special',
  'Kid Approved',
  'Spicy',
]

export default function RecipeCustomizer({
  recipeId,
  currentColor = 'from-orange-400 to-red-500',
  currentLabel = '',
  onUpdate,
}: RecipeCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(currentColor)
  const [labelValue, setLabelValue] = useState(currentLabel)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Update local state when props change
  useEffect(() => {
    setSelectedColor(currentColor)
    setLabelValue(currentLabel)
  }, [currentColor, currentLabel])

  const handleColorChange = async (color: string) => {
    setSelectedColor(color)
    await saveCustomization({ customColor: color })
  }

  const handleLabelChange = (value: string) => {
    setLabelValue(value)
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      saveCustomization({ customLabel: value })
    }, 500)
  }

  const saveCustomization = async (updates: { customColor?: string; customLabel?: string }) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/recipes/${recipeId}/customize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        onUpdate(updates)
        toast({
          title: 'Customization saved',
          description: 'Your changes have been saved successfully',
        })
      } else {
        throw new Error('Failed to save customization')
      }
    } catch (error) {
      console.error('Error saving customization:', error)
      toast({
        title: 'Error',
        description: 'Failed to save customization',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearLabel = () => {
    setLabelValue('')
    saveCustomization({ customLabel: '' })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Customize
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Customize Recipe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Palette className="w-4 h-4" />
                Card Color
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleColorChange(option.value)}
                    className="relative group"
                    title={option.name}
                  >
                    <div
                      className={`h-12 rounded-lg ${option.preview} transition-all ${
                        selectedColor === option.value
                          ? 'ring-2 ring-gray-800 ring-offset-2'
                          : 'hover:scale-105'
                      }`}
                    />
                    {selectedColor === option.value && (
                      <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white drop-shadow-lg" />
                    )}
                    <span className="text-xs text-gray-600 mt-1 block">{option.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Label Input */}
            <div className="space-y-2">
              <Label htmlFor="recipe-label" className="flex items-center gap-2 text-sm font-medium">
                <Tag className="w-4 h-4" />
                Custom Label
              </Label>
              <div className="relative">
                <Input
                  id="recipe-label"
                  type="text"
                  placeholder="Add a label..."
                  value={labelValue}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  maxLength={30}
                  className="pr-8"
                />
                {labelValue && (
                  <Button
                    onClick={handleClearLabel}
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {labelValue.length}/30 characters
              </p>
            </div>

            {/* Label Suggestions */}
            {!labelValue && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Quick labels:</p>
                <div className="flex flex-wrap gap-1">
                  {labelSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      onClick={() => handleLabelChange(suggestion)}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Saving indicator */}
            {isSaving && (
              <div className="text-sm text-gray-500 text-center">
                Saving...
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}