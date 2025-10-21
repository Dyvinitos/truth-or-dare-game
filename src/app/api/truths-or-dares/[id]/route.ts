import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const truthOrDare = await db.truthOrDare.findUnique({
      where: { id }
    })
    
    if (!truthOrDare) {
      return NextResponse.json(
        { error: 'Truth or dare not found' },
        { status: 404 }
      )
    }
    
    await db.truthOrDare.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Truth or dare deleted successfully' })
  } catch (error) {
    console.error('Error deleting truth or dare:', error)
    return NextResponse.json(
      { error: 'Failed to delete truth or dare' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { uses } = await request.json()
    
    if (typeof uses !== 'number' || uses < 0) {
      return NextResponse.json(
        { error: 'Uses must be a non-negative number' },
        { status: 400 }
      )
    }
    
    const updatedTruthOrDare = await db.truthOrDare.update({
      where: { id },
      data: { uses }
    })
    
    return NextResponse.json(updatedTruthOrDare)
  } catch (error) {
    console.error('Error updating truth or dare:', error)
    return NextResponse.json(
      { error: 'Failed to update truth or dare' },
      { status: 500 }
    )
  }
}