import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove recipe from recent recipes
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        recentRecipes: {
          disconnect: { id: params.id }
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove recent recipe error:', error)
    return NextResponse.json(
      { error: 'Failed to remove recipe from recent' },
      { status: 500 }
    )
  }
}