import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getFallbackTruthsOrDares } from '@/lib/fallback-data'

export async function GET() {
  try {
    console.log('Attempting to fetch truths and dares...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'configured' : 'missing')
    
    // Test database connection with retry logic
    let connectionAttempts = 0
    const maxAttempts = 3
    
    while (connectionAttempts < maxAttempts) {
      try {
        await db.$connect()
        console.log('Database connected successfully')
        break
      } catch (dbError) {
        connectionAttempts++
        console.error(`Database connection attempt ${connectionAttempts} failed:`, dbError)
        
        if (connectionAttempts >= maxAttempts) {
          console.error('Max connection attempts reached, using fallback data')
          const fallbackData = getFallbackTruthsOrDares()
          console.log(`Returning ${fallbackData.length} fallback items`)
          
          return NextResponse.json({
            data: fallbackData,
            fallback: true,
            message: 'Using fallback data due to database connection issues'
          })
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    const truthsAndDares = await db.truthOrDare.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${truthsAndDares.length} truths and dares`)
    
    return NextResponse.json({
      data: truthsAndDares,
      fallback: false,
      message: 'Data loaded from database'
    })
  } catch (error) {
    console.error('Error fetching truths and dares:', error)
    
    // Use fallback data as last resort
    const fallbackData = getFallbackTruthsOrDares()
    console.log(`Using fallback data due to error: ${fallbackData.length} items`)
    
    return NextResponse.json({
      data: fallbackData,
      fallback: true,
      message: 'Using fallback data due to server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await db.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, content } = await request.json()
    
    if (!type || !content) {
      return NextResponse.json(
        { error: 'Type and content are required' },
        { status: 400 }
      )
    }
    
    if (!['truth', 'dare'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "truth" or "dare"' },
        { status: 400 }
      )
    }
    
    const newTruthOrDare = await db.truthOrDare.create({
      data: {
        type,
        content: content.trim()
      }
    })
    
    return NextResponse.json(newTruthOrDare, { status: 201 })
  } catch (error) {
    console.error('Error creating truth or dare:', error)
    return NextResponse.json(
      { error: 'Failed to create truth or dare' },
      { status: 500 }
    )
  }
}