import { useState, useEffect } from 'react'

interface TruthOrDare {
  id: string
  type: 'truth' | 'dare'
  content: string
  uses: number
  createdAt: string
  updatedAt: string
}

export function useTruthsOrDares() {
  const [data, setData] = useState<TruthOrDare[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/truths-or-dares')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: Failed to fetch data`)
      }
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addTruthOrDare = async (type: 'truth' | 'dare', content: string) => {
    try {
      const response = await fetch('/api/truths-or-dares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, content }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add truth or dare')
      }
      
      const newItem = await response.json()
      setData(prev => [newItem, ...prev])
      return newItem
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const deleteTruthOrDare = async (id: string) => {
    try {
      const response = await fetch(`/api/truths-or-dares/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete truth or dare')
      }
      
      setData(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const updateUses = async (id: string, uses: number) => {
    try {
      const response = await fetch(`/api/truths-or-dares/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uses }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update truth or dare')
      }
      
      const updatedItem = await response.json()
      setData(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ))
      return updatedItem
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    addTruthOrDare,
    deleteTruthOrDare,
    updateUses
  }
}