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

    const items = await prisma.pantryItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Pantry fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pantry items' },
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
    const { name, category, quantity, unit, expiryDate } = body

    const item = await prisma.pantryItem.create({
      data: {
        userId: session.user.id,
        name,
        category,
        quantity: quantity || null,
        unit: unit || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      }
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Pantry create error:', error)
    return NextResponse.json(
      { error: 'Failed to create pantry item' },
      { status: 500 }
    )
  }
}