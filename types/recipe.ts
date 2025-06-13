export interface Ingredient {
  amount: string
  item: string
}

export interface Recipe {
  id: string
  title: string
  description?: string
  prepTime: number
  cookTime: number
  totalTime: number
  servings: number
  difficulty?: string
  cuisine?: string
  ingredients: Ingredient[]
  instructions: string[]
  tips?: string
  customColor?: string
  customLabel?: string
  createdAt?: Date
  updatedAt?: Date
  isSaved?: boolean
}