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

    // Get user preferences for max recent recipes
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
      select: { maxRecentRecipes: true }
    })

    const limit = preferences?.maxRecentRecipes || 5

    // Get recent recipes
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        recentRecipes: {
          take: limit,
          orderBy: { createdAt: 'desc' }
        },
        savedRecipes: {
          select: { id: true }
        }
      }
    })

    // Mark which recipes are saved
    const savedRecipeIds = new Set(user?.savedRecipes.map(r => r.id) || [])
    const recipes = user?.recentRecipes.map(recipe => ({
      ...recipe,
      isSaved: savedRecipeIds.has(recipe.id)
    })) || []

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error('Recent recipes fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent recipes' },
      { status: 500 }
    )
  }
}