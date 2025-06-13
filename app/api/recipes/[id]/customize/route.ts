import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { customColor, customLabel } = body

    // Verify user has this recipe saved
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        savedRecipes: {
          some: { id: params.id }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Recipe not found in saved' }, { status: 404 })
    }

    // Update recipe customization
    const recipe = await prisma.recipe.update({
      where: { id: params.id },
      data: {
        ...(customColor !== undefined && { customColor }),
        ...(customLabel !== undefined && { customLabel })
      }
    })

    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Recipe customization error:', error)
    return NextResponse.json(
      { error: 'Failed to customize recipe' },
      { status: 500 }
    )
  }
}