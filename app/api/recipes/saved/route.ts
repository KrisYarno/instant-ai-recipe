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

    // Get saved recipes
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        savedRecipes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    const recipes = user?.savedRecipes || []

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error('Saved recipes fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved recipes' },
      { status: 500 }
    )
  }
}