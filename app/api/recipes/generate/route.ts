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
    const { 
      type, // 'random', 'timeline', 'protein', 'cuisine', 'pantry'
      timeLimit,
      protein,
      cuisine,
      usePreferences,
      pantryItems
    } = body

    // Get user preferences if needed
    let userPreferences = null
    if (usePreferences) {
      userPreferences = await prisma.userPreferences.findUnique({
        where: { userId: session.user.id },
        include: { user: true }
      })
    }

    // Build the prompt
    let prompt = `Generate an Instant Pot recipe with the following requirements:\n\n`
    
    if (type === 'timeline' && timeLimit) {
      prompt += `- Total time (prep + cook) must be under ${timeLimit} minutes\n`
    }
    
    if (type === 'protein' && protein) {
      prompt += `- Must use ${protein} as the main protein\n`
    }
    
    if (type === 'cuisine' && cuisine) {
      prompt += `- Must be ${cuisine} cuisine\n`
    }
    
    if (type === 'pantry' && pantryItems) {
      prompt += `- Must use these ingredients: ${pantryItems.join(', ')}\n`
    }
    
    if (userPreferences) {
      if (userPreferences.isVegan) prompt += `- Must be vegan\n`
      if (userPreferences.isVegetarian) prompt += `- Must be vegetarian\n`
      if (userPreferences.allergies?.length > 0) {
        prompt += `- Must not contain: ${userPreferences.allergies.join(', ')}\n`
      }
      if (userPreferences.minCookTime && userPreferences.maxCookTime) {
        prompt += `- Cook time should be between ${userPreferences.minCookTime} and ${userPreferences.maxCookTime} minutes\n`
      }
      if (userPreferences.user.dislikedIngredients?.length > 0) {
        prompt += `- Avoid these ingredients: ${userPreferences.user.dislikedIngredients.join(', ')}\n`
      }
    }
    
    prompt += `\nReturn the recipe in JSON format with the following structure:
    {
      "title": "Recipe Name",
      "description": "Brief description",
      "prepTime": 15,
      "cookTime": 30,
      "totalTime": 45,
      "servings": 4,
      "difficulty": "Easy/Medium/Hard",
      "cuisine": "Cuisine type",
      "ingredients": [
        {"amount": "2 cups", "item": "rice"},
        {"amount": "1 lb", "item": "chicken breast"}
      ],
      "instructions": [
        "Step 1 instructions",
        "Step 2 instructions"
      ],
      "tips": "Optional cooking tips"
    }`

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: "You are a professional chef specializing in Instant Pot recipes. Generate detailed, practical recipes that are easy to follow. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const recipeData = JSON.parse(completion.choices[0].message.content || '{}')
    
    // Save the recipe to the database
    const recipe = await prisma.recipe.create({
      data: {
        title: recipeData.title,
        description: recipeData.description,
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime,
        totalTime: recipeData.totalTime,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty,
        cuisine: recipeData.cuisine,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        tips: recipeData.tips,
        recentForUsers: {
          connect: { id: session.user.id }
        }
      }
    })

    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Recipe generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    )
  }
}
