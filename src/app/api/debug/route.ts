import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      database: 'unknown'
    }

    // Test database connection
    try {
      await db.$connect()
      
      const count = await db.truthOrDare.count()
      health.database = `connected (${count} items)`
      
      await db.$disconnect()
    } catch (dbError) {
      health.database = `connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
      health.status = 'error'
    }

    return NextResponse.json(health)
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}