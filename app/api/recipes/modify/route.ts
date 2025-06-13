import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { recipeId, query } = body

    // Get the recipe
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Generate modification suggestion
    const completion = await openai.chat.completions.create({
      model: "o4-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful chef assistant. Suggest modifications to Instant Pot recipes based on user requests. Be specific and practical."
        },
        {
          role: "user",
          content: `Recipe: ${recipe.title}\nIngredients: ${JSON.stringify(recipe.ingredients)}\nInstructions: ${JSON.stringify(recipe.instructions)}\n\nUser request: ${query}\n\nProvide a specific modification suggestion.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const modification = completion.choices[0].message.content || ''

    // Save the modification
    await prisma.recipeModification.create({
      data: {
        recipeId,
        userId: session.user.id,
        userQuery: query,
        aiResponse: modification,
        applied: false
      }
    })

    return NextResponse.json({ modification })
  } catch (error) {
    console.error('Recipe modification error:', error)
    return NextResponse.json(
      { error: 'Failed to generate modification' },
      { status: 500 }
    )
  }
}
