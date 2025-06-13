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

    // Get today's usage
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let used = 0
    let remaining = 50
    
    try {
      const dailyGeneration = await prisma.dailyRecipeGeneration.findUnique({
        where: {
          userId_date: {
            userId: session.user.id,
            date: today
          }
        }
      })
      
      used = dailyGeneration?.count || 0
      remaining = Math.max(0, 50 - used)
    } catch (error) {
      // If table doesn't exist, return default values
      if ((error as any).code === 'P2021') {
        console.warn('DailyRecipeGeneration table not found. Run migrations to enable rate limiting.')
      } else {
        throw error
      }
    }

    return NextResponse.json({ 
      used,
      remaining,
      limit: 50
    })
  } catch (error) {
    console.error('Usage check error:', error)
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    )
  }
}