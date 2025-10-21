import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
          console.error('Max connection attempts reached')
          return NextResponse.json(
            { 
              error: 'Database connection failed', 
              details: dbError instanceof Error ? dbError.message : 'Unknown error',
              attempts: connectionAttempts,
              databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
            },
            { status: 500 }
          )
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
    
    return NextResponse.json(truthsAndDares)
  } catch (error) {
    console.error('Error fetching truths and dares:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch truths and dares', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      },
      { status: 500 }
    )
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