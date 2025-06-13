import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user data
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        preferences: true,
        savedRecipes: true,
        recentRecipes: true,
        pantryItems: true,
        recipeModifications: {
          include: {
            recipe: true
          }
        }
      }
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Format data for export
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        name: userData.name,
        email: userData.email,
        joinedDate: userData.createdAt,
        likedIngredients: userData.likedIngredients,
        dislikedIngredients: userData.dislikedIngredients
      },
      preferences: userData.preferences,
      pantryItems: userData.pantryItems.map(item => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: item.expiryDate,
        addedDate: item.createdAt
      })),
      savedRecipes: userData.savedRecipes.map(recipe => ({
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        totalTime: recipe.totalTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        tips: recipe.tips,
        customColor: recipe.customColor,
        customLabel: recipe.customLabel,
        savedDate: recipe.createdAt
      })),
      recentRecipes: userData.recentRecipes.map(recipe => ({
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        totalTime: recipe.totalTime,
        generatedDate: recipe.createdAt
      })),
      recipeModifications: userData.recipeModifications.map(mod => ({
        recipeTitle: mod.recipe.title,
        userQuery: mod.userQuery,
        aiResponse: mod.aiResponse,
        date: mod.createdAt
      }))
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}