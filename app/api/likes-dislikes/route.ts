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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        likedIngredients: true,
        dislikedIngredients: true
      }
    })

    return NextResponse.json({
      likedIngredients: user?.likedIngredients || [],
      dislikedIngredients: user?.dislikedIngredients || []
    })
  } catch (error) {
    console.error('Likes/dislikes fetch error:', error)
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
    const { likedIngredients, dislikedIngredients } = body

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        likedIngredients: likedIngredients || [],
        dislikedIngredients: dislikedIngredients || []
      }
    })

    return NextResponse.json({
      likedIngredients: user.likedIngredients,
      dislikedIngredients: user.dislikedIngredients
    })
  } catch (error) {
    console.error('Likes/dislikes update error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}