import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Preferences fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        minCookTime: body.minCookTime,
        maxCookTime: body.maxCookTime,
        isVegan: body.isVegan,
        isVegetarian: body.isVegetarian,
        allergies: body.allergies,
        dietaryRestrictions: body.dietaryRestrictions,
        preferredProteins: body.preferredProteins,
        preferredCuisines: body.preferredCuisines,
        maxRecentRecipes: body.maxRecentRecipes
      },
      create: {
        userId: session.user.id,
        minCookTime: body.minCookTime,
        maxCookTime: body.maxCookTime,
        isVegan: body.isVegan,
        isVegetarian: body.isVegetarian,
        allergies: body.allergies,
        dietaryRestrictions: body.dietaryRestrictions,
        preferredProteins: body.preferredProteins,
        preferredCuisines: body.preferredCuisines,
        maxRecentRecipes: body.maxRecentRecipes
      }
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Preferences update error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}