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
    const { recipeId, modifications } = body

    // Get the original recipe
    const originalRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    })

    if (!originalRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Generate modified recipe using the same model as generation
    const prompt = `Here is an Instant Pot recipe:
Title: ${originalRecipe.title}
Description: ${originalRecipe.description}
Ingredients: ${JSON.stringify(originalRecipe.ingredients)}
Instructions: ${JSON.stringify(originalRecipe.instructions)}
Tips: ${originalRecipe.tips}

Apply these modifications: ${modifications}

Return the complete modified recipe in the same JSON format with all fields filled out.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1", // Using the same model as recipe generation
      messages: [
        {
          role: "system",
          content: "You are a professional chef specializing in Instant Pot recipes. Modify recipes based on user requests while maintaining the recipe structure and format. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const modifiedRecipeData = JSON.parse(completion.choices[0].message.content || '{}')
    
    // Update the existing recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        title: modifiedRecipeData.title,
        description: modifiedRecipeData.description,
        prepTime: modifiedRecipeData.prepTime,
        cookTime: modifiedRecipeData.cookTime,
        totalTime: modifiedRecipeData.totalTime,
        servings: modifiedRecipeData.servings,
        difficulty: modifiedRecipeData.difficulty,
        cuisine: modifiedRecipeData.cuisine,
        ingredients: modifiedRecipeData.ingredients,
        instructions: modifiedRecipeData.instructions,
        tips: modifiedRecipeData.tips,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ recipe: updatedRecipe })
  } catch (error) {
    console.error('Recipe regeneration error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate recipe' },
      { status: 500 }
    )
  }
}