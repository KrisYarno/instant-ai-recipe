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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { ingredient, action, type } = body

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { likedIngredients: true, dislikedIngredients: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updatedLiked = [...(user.likedIngredients || [])]
    let updatedDisliked = [...(user.dislikedIngredients || [])]

    if (type === 'like') {
      if (action === 'add' && !updatedLiked.includes(ingredient)) {
        updatedLiked.push(ingredient)
        // Remove from disliked if present
        updatedDisliked = updatedDisliked.filter(i => i !== ingredient)
      } else if (action === 'remove') {
        updatedLiked = updatedLiked.filter(i => i !== ingredient)
      }
    } else if (type === 'dislike') {
      if (action === 'add' && !updatedDisliked.includes(ingredient)) {
        updatedDisliked.push(ingredient)
        // Remove from liked if present
        updatedLiked = updatedLiked.filter(i => i !== ingredient)
      } else if (action === 'remove') {
        updatedDisliked = updatedDisliked.filter(i => i !== ingredient)
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        likedIngredients: updatedLiked,
        dislikedIngredients: updatedDisliked
      }
    })

    return NextResponse.json({
      likedIngredients: updatedUser.likedIngredients,
      dislikedIngredients: updatedUser.dislikedIngredients
    })
  } catch (error) {
    console.error('Likes/dislikes vote error:', error)
    return NextResponse.json(
      { error: 'Failed to save vote' },
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { ingredient } = body

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { likedIngredients: true, dislikedIngredients: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedLiked = (user.likedIngredients || []).filter(i => i !== ingredient)
    const updatedDisliked = (user.dislikedIngredients || []).filter(i => i !== ingredient)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        likedIngredients: updatedLiked,
        dislikedIngredients: updatedDisliked
      }
    })

    return NextResponse.json({
      likedIngredients: updatedUser.likedIngredients,
      dislikedIngredients: updatedUser.dislikedIngredients
    })
  } catch (error) {
    console.error('Likes/dislikes delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete preference' },
      { status: 500 }
    )
  }
}