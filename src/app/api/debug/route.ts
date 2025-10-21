import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      database: 'unknown',
      workingDirectory: process.cwd(),
      nodeVersion: process.version
    }

    // Test database connection
    try {
      await db.$connect()
      
      const count = await db.truthOrDare.count()
      health.database = `connected (${count} items)`
      
      // Test a simple query
      const firstItem = await db.truthOrDare.findFirst()
      health.firstItem = firstItem ? {
        id: firstItem.id,
        type: firstItem.type,
        contentPreview: firstItem.content.substring(0, 50) + '...'
      } : null
      
      await db.$disconnect()
    } catch (dbError) {
      health.database = `connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
      health.status = 'error'
      health.errorDetails = {
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined
      }
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