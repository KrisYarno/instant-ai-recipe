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

    // Check rate limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    try {
      const dailyGeneration = await prisma.dailyRecipeGeneration.findUnique({
        where: {
          userId_date: {
            userId: session.user.id,
            date: today
          }
        }
      })

      if (dailyGeneration && dailyGeneration.count >= 50) {
        return NextResponse.json(
          { error: 'Daily recipe generation limit reached (50 recipes per day)' },
          { status: 429 }
        )
      }
    } catch (error) {
      // If table doesn't exist, log warning but continue
      if ((error as Error & { code?: string }).code === 'P2021') {
        console.warn('DailyRecipeGeneration table not found. Run migrations to enable rate limiting.')
      } else {
        throw error
      }
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

    // Get user's recent recipes to avoid repetition
    const recentRecipes = await prisma.recipe.findMany({
      where: {
        recentForUsers: {
          some: {
            id: session.user.id
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      select: {
        title: true,
        cuisine: true,
        ingredients: true
      }
    })

    // Extract main proteins from recent recipes
    const recentTitles = recentRecipes.map(r => r.title.toLowerCase())
    const recentCuisines = recentRecipes.map(r => r.cuisine).filter(Boolean)
    const recentMainIngredients = new Set<string>()
    
    recentRecipes.forEach(recipe => {
      const ingredients = recipe.ingredients as { item?: string }[]
      ingredients.forEach(ing => {
        const item = ing.item?.toLowerCase() || ''
        // Extract main proteins
        if (item.includes('chicken') || item.includes('beef') || item.includes('pork') || 
            item.includes('fish') || item.includes('shrimp') || item.includes('tofu') ||
            item.includes('lamb') || item.includes('turkey')) {
          recentMainIngredients.add(item.split(' ').find((word: string) => 
            ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'tofu', 'lamb', 'turkey'].includes(word)
          ) || item)
        }
      })
    })

    // Build the prompt
    let prompt = `Generate an Instant Pot recipe with the following requirements:\n\n`
    
    // Add variety requirements
    if (recentTitles.length > 0) {
      prompt += `IMPORTANT - For variety, avoid these recent recipes:\n`
      prompt += `- Recent dishes: ${recentTitles.slice(0, 5).join(', ')}\n`
      if (recentMainIngredients.size > 0) {
        prompt += `- Recently used proteins: ${Array.from(recentMainIngredients).join(', ')}\n`
      }
      if (recentCuisines.length > 0) {
        prompt += `- Recent cuisines: ${Array.from(new Set(recentCuisines.slice(0, 5))).join(', ')}\n`
      }
      prompt += `Please generate something DIFFERENT and CREATIVE.\n\n`
    }
    
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
    
    // Add creative suggestions for random generation
    if (type === 'random') {
      const creativeProteins = ['turkey', 'ground turkey', 'salmon', 'cod', 'shrimp', 'pork shoulder', 'pork loin', 'lamb', 'italian sausage', 'vegetarian']
      const creativeCuisines = ['Mexican', 'Italian', 'Asian Fusion', 'Mediterranean', 'Indian-inspired', 'Southern', 'Thai-inspired', 'Greek', 'Cajun']
      const creativeDishes = ['chili', 'curry', 'risotto', 'jambalaya', 'soup', 'pasta', 'rice bowls', 'tacos', 'casserole', 'stir-fry style']
      
      prompt += `\nFor variety, consider:\n`
      prompt += `- Proteins like: ${creativeProteins.join(', ')}\n`
      prompt += `- Cuisines like: ${creativeCuisines.join(', ')}\n`
      prompt += `- Dish types like: ${creativeDishes.join(', ')}\n`
      prompt += `Be creative and avoid common dishes like basic chicken and rice or beef stew.\n`
    }
    
    // Add ingredient availability requirement
    prompt += `\nIMPORTANT: Use ingredients commonly available in typical US grocery stores (Safeway, Kroger, Whole Foods, etc). Avoid rare or specialty ingredients that would be hard to find in western US supermarkets.\n`
    
    if (userPreferences) {
      prompt += `\nUser Preferences:\n`
      
      // Check for explicit contradictions
      const isProteinContradiction = type === 'protein' && protein && 
        (userPreferences.isVegan || userPreferences.isVegetarian) &&
        ['Chicken', 'Beef', 'Pork', 'Fish'].includes(protein)
      
      // Apply dietary restrictions unless there's an explicit contradiction
      if (userPreferences.isVegan && !isProteinContradiction) {
        prompt += `- Must be vegan (no animal products)\n`
      } else if (userPreferences.isVegetarian && !isProteinContradiction) {
        prompt += `- Must be vegetarian (no meat, but dairy/eggs ok)\n`
      } else if (isProteinContradiction) {
        prompt += `- NOTE: User explicitly requested ${protein} which overrides their usual ${
          userPreferences.isVegan ? 'vegan' : 'vegetarian'
        } preference for this recipe\n`
      }
      
      // Always respect allergies - no exceptions
      if (userPreferences.allergies?.length > 0) {
        prompt += `- ALLERGIES (STRICT) - Must NOT contain: ${userPreferences.allergies.join(', ')}\n`
      }
      
      if (userPreferences.dietaryRestrictions?.length > 0) {
        prompt += `- Dietary restrictions: ${userPreferences.dietaryRestrictions.join(', ')}\n`
      }
      
      // Apply time preferences unless timeline was explicitly selected
      if (userPreferences.minCookTime && userPreferences.maxCookTime && type !== 'timeline') {
        prompt += `- Total time (prep + cook) should be between ${userPreferences.minCookTime} and ${userPreferences.maxCookTime} minutes\n`
      }
      
      // Apply ingredient preferences unless contradicted by specific protein choice
      if (userPreferences.user.dislikedIngredients?.length > 0) {
        const filteredDislikes = type === 'protein' && protein 
          ? userPreferences.user.dislikedIngredients.filter(ing => 
              !ing.toLowerCase().includes(protein.toLowerCase())
            )
          : userPreferences.user.dislikedIngredients
        
        if (filteredDislikes.length > 0) {
          prompt += `- DISLIKES (STRICT) - Must NOT contain: ${filteredDislikes.join(', ')}\n`
        }
      }
      
      if (userPreferences.user.likedIngredients?.length > 0) {
        prompt += `- Consider including these liked ingredients (suggestions only): ${userPreferences.user.likedIngredients.join(', ')}\n`
      }
      
      // For random generation, MUST use preferred proteins and cuisines if they exist
      if (type === 'random') {
        if (userPreferences.preferredProteins?.length > 0) {
          const validProteins = userPreferences.isVegan 
            ? userPreferences.preferredProteins.filter(p => ['Tofu', 'Beans', 'Lentils'].includes(p))
            : userPreferences.isVegetarian
            ? userPreferences.preferredProteins.filter(p => !['Chicken', 'Beef', 'Pork', 'Fish', 'Turkey', 'Shrimp', 'Sausage'].includes(p))
            : userPreferences.preferredProteins
            
          if (validProteins.length > 0) {
            const randomProtein = validProteins[Math.floor(Math.random() * validProteins.length)]
            prompt += `- MUST use ${randomProtein} as the main protein (this is a strict requirement)\n`
          }
        }
        if (userPreferences.preferredCuisines?.length > 0) {
          const randomCuisine = userPreferences.preferredCuisines[Math.floor(Math.random() * userPreferences.preferredCuisines.length)]
          prompt += `- MUST make it ${randomCuisine} cuisine (this is a strict requirement)\n`
        }
      }
      
      // For timeline generation, also use preferred proteins if they exist
      if (type === 'timeline' && userPreferences.preferredProteins?.length > 0) {
        const validProteins = userPreferences.isVegan 
          ? userPreferences.preferredProteins.filter(p => ['Tofu', 'Beans', 'Lentils'].includes(p))
          : userPreferences.isVegetarian
          ? userPreferences.preferredProteins.filter(p => !['Chicken', 'Beef', 'Pork', 'Fish'].includes(p))
          : userPreferences.preferredProteins
          
        if (validProteins.length > 0) {
          const randomProtein = validProteins[Math.floor(Math.random() * validProteins.length)]
          prompt += `- MUST use ${randomProtein} as the main protein (this is a strict requirement)\n`
        }
      }
      
      // For cuisine generation, also use preferred proteins unless one was explicitly selected
      if (type === 'cuisine' && !protein && userPreferences.preferredProteins?.length > 0) {
        const validProteins = userPreferences.isVegan 
          ? userPreferences.preferredProteins.filter(p => ['Tofu', 'Beans', 'Lentils'].includes(p))
          : userPreferences.isVegetarian
          ? userPreferences.preferredProteins.filter(p => !['Chicken', 'Beef', 'Pork', 'Fish'].includes(p))
          : userPreferences.preferredProteins
          
        if (validProteins.length > 0) {
          const randomProtein = validProteins[Math.floor(Math.random() * validProteins.length)]
          prompt += `- MUST use ${randomProtein} as the main protein (this is a strict requirement)\n`
        }
      }
      
      // For cuisine selection, apply preferences unless explicitly contradicted
      if (type === 'cuisine' && cuisine && userPreferences.preferredCuisines?.length > 0) {
        if (!userPreferences.preferredCuisines.includes(cuisine)) {
          prompt += `- NOTE: User explicitly requested ${cuisine} cuisine which is not in their usual preferences\n`
        }
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
          content: "You are a creative professional chef specializing in diverse Instant Pot recipes. Generate unique, detailed, and practical recipes that are easy to follow using ingredients readily available in typical US grocery stores. CRITICAL REQUIREMENTS: 1) NEVER include ingredients marked as allergies or dislikes - these are STRICT restrictions. 2) When preferred proteins are specified, you MUST use one of them as the main protein. 3) When preferred cuisines are specified, you MUST make the recipe that cuisine style. 4) Liked ingredients are suggestions only - include them if they fit naturally. 5) Always follow dietary restrictions (vegan/vegetarian) unless explicitly overridden. Prioritize variety and creativity - avoid repetitive dishes like basic beef stew or plain chicken and rice. Draw inspiration from various cuisines but adapt them to use common American grocery store ingredients. For example, use coconut milk from a can, curry powder instead of exotic spice blends, regular mushrooms instead of specialty varieties. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    })

    const recipeData = JSON.parse(completion.choices[0].message.content || '{}')
    
    // Track preferences application
    let preferencesApplied = false
    const preferencesOverridden: string[] = []
    
    if (usePreferences && userPreferences) {
      preferencesApplied = true
      
      // Check for overrides
      if (type === 'protein' && protein) {
        if ((userPreferences.isVegan || userPreferences.isVegetarian) && 
            ['Chicken', 'Beef', 'Pork', 'Fish', 'Turkey', 'Shrimp', 'Sausage'].includes(protein)) {
          preferencesOverridden.push(`${userPreferences.isVegan ? 'Vegan' : 'Vegetarian'} preference`)
        }
      }
      
      if (type === 'cuisine' && cuisine && 
          userPreferences.preferredCuisines?.length > 0 && 
          !userPreferences.preferredCuisines.includes(cuisine)) {
        preferencesOverridden.push('Cuisine preference')
      }
      
      if (type === 'timeline' && timeLimit && 
          userPreferences.minCookTime && userPreferences.maxCookTime &&
          (timeLimit < userPreferences.minCookTime || timeLimit > userPreferences.maxCookTime)) {
        preferencesOverridden.push('Time preference')
      }
    }
    
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

    // Update rate limit tracking
    try {
      await prisma.dailyRecipeGeneration.upsert({
        where: {
          userId_date: {
            userId: session.user.id,
            date: today
          }
        },
        update: {
          count: { increment: 1 }
        },
        create: {
          userId: session.user.id,
          date: today,
          count: 1
        }
      })
    } catch (error) {
      // If table doesn't exist, log warning but continue
      if ((error as Error & { code?: string }).code === 'P2021') {
        console.warn('DailyRecipeGeneration table not found. Run migrations to enable rate limiting.')
      } else {
        throw error
      }
    }

    return NextResponse.json({ 
      recipe: {
        ...recipe,
        preferencesApplied,
        preferencesOverridden: preferencesOverridden.length > 0 ? preferencesOverridden : undefined
      }
    })
  } catch (error) {
    console.error('Recipe generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    )
  }
}
