import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Add recipe to saved recipes
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        savedRecipes: {
          connect: { id: params.id }
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save recipe error:', error)
    return NextResponse.json(
      { error: 'Failed to save recipe' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove recipe from saved recipes
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        savedRecipes: {
          disconnect: { id: params.id }
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unsave recipe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsave recipe' },
      { status: 500 }
    )
  }
}