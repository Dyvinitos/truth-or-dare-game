'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus, Settings, Users, Trophy, CheckCircle, XCircle, ChevronUp, ChevronDown, Loader2, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTruthsOrDares } from '@/hooks/use-truths-or-dares'
import { replaceRandomPlayer, hasRandomPlaceholder } from '@/lib/random-player'

interface Player {
  id: string
  name: string
  truthsCompleted: number
  daresCompleted: number
  truthsTotal: number
  daresTotal: number
}

interface TruthOrDare {
  id: string
  type: 'truth' | 'dare'
  content: string
  uses: number
  createdAt: string
  updatedAt: string
}

interface GameState {
  players: Player[]
  currentTurn: number
  totalTurns: number
  currentPlayerIndex: number
  currentCard: TruthOrDare | null
  gameStarted: boolean
  gameEnded: boolean
  cardCompleted: boolean
  hasIncremented: boolean
  hasDecremented: boolean
}

export default function TruthOrDareGame() {
  const { data: truthsAndDares, loading, error, addTruthOrDare, deleteTruthOrDare, updateUses } = useTruthsOrDares()
  
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentTurn: 0,
    totalTurns: 20,
    currentPlayerIndex: 0,
    currentCard: null,
    gameStarted: false,
    gameEnded: false,
    cardCompleted: false,
    hasIncremented: false,
    hasDecremented: false
  })

  const [numberOfPlayers, setNumberOfPlayers] = useState(2)
  const [showPlayerSetup, setShowPlayerSetup] = useState(false)
  const [playerNames, setPlayerNames] = useState<string[]>(Array(8).fill(''))
  
  const [newItemContent, setNewItemContent] = useState('')
  const [newItemType, setNewItemType] = useState<'truth' | 'dare'>('truth')
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initializePlayers = () => {
    const players: Player[] = []
    for (let i = 0; i < numberOfPlayers; i++) {
      if (playerNames[i].trim()) {
        players.push({
          id: `player-${i}`,
          name: playerNames[i].trim(),
          truthsCompleted: 0,
          daresCompleted: 0,
          truthsTotal: 0,
          daresTotal: 0
        })
      }
    }
    
    if (players.length > 0) {
      setGameState(prev => ({ ...prev, players }))
      setShowPlayerSetup(false)
      setPlayerNames(Array(8).fill(''))
    }
  }

  const startGame = () => {
    if (gameState.players.length === 0 || truthsAndDares.length === 0) return
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      currentTurn: 1,
      currentPlayerIndex: 0
    }))
    drawNextCard()
  }

  const drawNextCard = () => {
    const availableCards = truthsAndDares.filter(card => card.content.trim() !== '')
    if (availableCards.length === 0) return

    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)]
    setGameState(prev => ({
      ...prev,
      currentCard: randomCard,
      cardCompleted: false,
      hasIncremented: false,
      hasDecremented: false
    }))
  }

  const completeCard = async (completed: boolean) => {
    if (!gameState.currentCard || !gameState.players[gameState.currentPlayerIndex]) return

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    
    setGameState(prev => {
      const updatedPlayers = [...prev.players]
      updatedPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        truthsCompleted: prev.currentCard?.type === 'truth' && completed ? currentPlayer.truthsCompleted + 1 : currentPlayer.truthsCompleted,
        daresCompleted: prev.currentCard?.type === 'dare' && completed ? currentPlayer.daresCompleted + 1 : currentPlayer.daresCompleted,
        truthsTotal: prev.currentCard?.type === 'truth' ? currentPlayer.truthsTotal + 1 : currentPlayer.truthsTotal,
        daresTotal: prev.currentCard?.type === 'dare' ? currentPlayer.daresTotal + 1 : currentPlayer.daresTotal
      }

      return {
        ...prev,
        players: updatedPlayers,
        cardCompleted: true
      }
    })

    // Update uses in database
    try {
      const currentUses = truthsAndDares.find(card => card.id === gameState.currentCard?.id)?.uses || 0
      await updateUses(gameState.currentCard.id, currentUses + 1)
    } catch (error) {
      console.error('Failed to update uses:', error)
    }
  }

  const incrementCardUses = async () => {
    if (gameState.hasIncremented || !gameState.currentCard) return
    
    try {
      const currentUses = truthsAndDares.find(card => card.id === gameState.currentCard?.id)?.uses || 0
      await updateUses(gameState.currentCard.id, currentUses + 1)
      setGameState(prev => ({ ...prev, hasIncremented: true }))
    } catch (error) {
      console.error('Failed to increment uses:', error)
    }
  }

  const decrementCardUses = async () => {
    if (gameState.hasDecremented || !gameState.currentCard) return
    
    try {
      const currentUses = truthsAndDares.find(card => card.id === gameState.currentCard?.id)?.uses || 0
      await updateUses(gameState.currentCard.id, Math.max(0, currentUses - 1))
      setGameState(prev => ({ ...prev, hasDecremented: true }))
    } catch (error) {
      console.error('Failed to decrement uses:', error)
    }
  }

  const nextTurn = () => {
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length
    const nextTurnNumber = gameState.currentTurn + 1

    if (nextTurnNumber > gameState.totalTurns) {
      setGameState(prev => ({ ...prev, gameEnded: true }))
    } else {
      setGameState(prev => ({
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        currentTurn: nextTurnNumber
      }))
      drawNextCard()
    }
  }

  const handleAddTruthOrDare = async () => {
    if (!newItemContent.trim()) return

    setIsSubmitting(true)
    try {
      await addTruthOrDare(newItemType, newItemContent.trim())
      setNewItemContent('')
      setShowAddDialog(false)
    } catch (error) {
      console.error('Failed to add truth or dare:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTruthOrDare = async (id: string) => {
    try {
      await deleteTruthOrDare(id)
    } catch (error) {
      console.error('Failed to delete truth or dare:', error)
    }
  }

  const resetGame = () => {
    setGameState({
      players: gameState.players.map(p => ({
        ...p,
        truthsCompleted: 0,
        daresCompleted: 0,
        truthsTotal: 0,
        daresTotal: 0
      })),
      currentTurn: 0,
      totalTurns: gameState.totalTurns,
      currentPlayerIndex: 0,
      currentCard: null,
      gameStarted: false,
      gameEnded: false,
      cardCompleted: false,
      hasIncremented: false,
      hasDecremented: false
    })
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-purple-600">Loading game data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading game: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-purple-800 mb-2">Truth or Dare</h1>
            <p className="text-purple-600">The classic party game!</p>
            <Badge variant="secondary" className="mt-2">
              {truthsAndDares.length} Truths & Dares Available
            </Badge>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Game Setup
              </CardTitle>
              <CardDescription>
                Configure your game settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="players">Number of Players</Label>
                <Select value={numberOfPlayers.toString()} onValueChange={(value) => setNumberOfPlayers(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num} Players</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="turns">Number of Turns</Label>
                <Select value={gameState.totalTurns.toString()} onValueChange={(value) => setGameState(prev => ({ ...prev, totalTurns: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 Turns</SelectItem>
                    <SelectItem value="50">50 Turns</SelectItem>
                    <SelectItem value="70">70 Turns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => setShowPlayerSetup(true)} 
                className="w-full"
                disabled={gameState.players.length > 0}
              >
                {gameState.players.length > 0 ? 'Players Configured' : 'Configure Players'}
              </Button>

              {gameState.players.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Players:</Label>
                  {gameState.players.map(player => (
                    <Badge key={player.id} variant="secondary" className="mr-2">
                      {player.name}
                    </Badge>
                  ))}
                </div>
              )}

              <Button 
                onClick={startGame} 
                className="w-full" 
                size="lg"
                disabled={gameState.players.length === 0 || truthsAndDares.length === 0}
              >
                {truthsAndDares.length === 0 ? 'No Truths or Dares Available' : 'Start Game'}
              </Button>
            </CardContent>
          </Card>

          {truthsAndDares.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No Truths or Dares Available</CardTitle>
                <CardDescription>
                  Add some truths and dares to start playing!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowAddDialog(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Truth or Dare
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={showPlayerSetup} onOpenChange={setShowPlayerSetup}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enter Player Names</DialogTitle>
              <DialogDescription>
                Enter names for {numberOfPlayers} players
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {Array.from({ length: numberOfPlayers }).map((_, index) => (
                <div key={index}>
                  <Label htmlFor={`player-${index}`}>Player {index + 1}</Label>
                  <Input
                    id={`player-${index}`}
                    value={playerNames[index]}
                    onChange={(e) => {
                      const newNames = [...playerNames]
                      newNames[index] = e.target.value
                      setPlayerNames(newNames)
                    }}
                    placeholder={`Player ${index + 1} name`}
                  />
                </div>
              ))}
            </div>
            <Button onClick={initializePlayers} className="w-full">
              Save Players
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Truth or Dare</DialogTitle>
              <DialogDescription>
                Add a new truth or dare to the game
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={newItemType} onValueChange={(value: 'truth' | 'dare') => setNewItemType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truth">Truth</SelectItem>
                    <SelectItem value="dare">Dare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder={
                    newItemType === 'dare' 
                      ? "Enter the dare content... Use /random for a random player (e.g., 'Give /random a compliment')"
                      : "Enter the truth content... Use /random for a random player (e.g., 'What do you think of /random?')"
                  }
                />
                {(newItemType === 'dare' || newItemType === 'truth') && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Use <code className="bg-gray-100 px-1 rounded">/random</code> to select a random player (excluding the current player)
                  </p>
                )}
              </div>
              <Button onClick={handleAddTruthOrDare} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add {newItemType}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (gameState.gameEnded) {
    const sortedPlayers = [...gameState.players].sort((a, b) => {
      const aTotal = a.truthsCompleted + a.daresCompleted
      const bTotal = b.truthsCompleted + b.daresCompleted
      return bTotal - aTotal
    })

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-purple-800 mb-2">Game Over!</h1>
            <p className="text-purple-600">Final Scores</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Final Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedPlayers.map((player, index) => {
                  const totalCompleted = player.truthsCompleted + player.daresCompleted
                  const totalChallenges = player.truthsTotal + player.daresTotal
                  const completionRate = totalChallenges > 0 ? Math.round((totalCompleted / totalChallenges) * 100) : 0

                  return (
                    <div key={player.id} className={cn(
                      "p-4 rounded-lg border",
                      index === 0 && "bg-yellow-50 border-yellow-200",
                      index === 1 && "bg-gray-50 border-gray-200",
                      index === 2 && "bg-orange-50 border-orange-200"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                            index === 0 && "bg-yellow-500 text-white",
                            index === 1 && "bg-gray-500 text-white",
                            index === 2 && "bg-orange-500 text-white",
                            index > 2 && "bg-gray-300 text-gray-700"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold">{player.name}</h3>
                            <p className="text-sm text-gray-600">
                              {totalCompleted}/{totalChallenges} completed ({completionRate}%)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Truths</p>
                              <p className="font-semibold">{player.truthsCompleted}/{player.truthsTotal}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Dares</p>
                              <p className="font-semibold">{player.daresCompleted}/{player.daresTotal}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button onClick={resetGame} className="w-full mt-6">
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with management buttons */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">Truth or Dare</h1>
            <p className="text-purple-600">Turn {gameState.currentTurn} of {gameState.totalTurns}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manage Truths and Dares</DialogTitle>
                  <DialogDescription>
                    View and delete existing truths and dares
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Truths</h3>
                    <div className="space-y-2">
                      {truthsAndDares.filter(item => item.type === 'truth').map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{item.content} (Used: {item.uses})</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTruthOrDare(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {truthsAndDares.filter(item => item.type === 'truth').length === 0 && (
                        <p className="text-sm text-gray-500">No truths available</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Dares</h3>
                    <div className="space-y-2">
                      {truthsAndDares.filter(item => item.type === 'dare').map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{item.content} (Used: {item.uses})</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTruthOrDare(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {truthsAndDares.filter(item => item.type === 'dare').length === 0 && (
                        <p className="text-sm text-gray-500">No dares available</p>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Truth or Dare</DialogTitle>
                  <DialogDescription>
                    Add a new truth or dare to the game
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={newItemType} onValueChange={(value: 'truth' | 'dare') => setNewItemType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="truth">Truth</SelectItem>
                        <SelectItem value="dare">Dare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newItemContent}
                      onChange={(e) => setNewItemContent(e.target.value)}
                      placeholder="Enter the truth or dare content..."
                    />
                  </div>
                  <Button onClick={handleAddTruthOrDare} className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add {newItemType}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Sheet */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Score Sheet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gameState.players.map((player, index) => (
                    <div 
                      key={player.id} 
                      className={cn(
                        "p-3 rounded-lg border",
                        index === gameState.currentPlayerIndex && "bg-purple-50 border-purple-200"
                      )}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{player.name}</h3>
                        {index === gameState.currentPlayerIndex && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Truths</p>
                          <p className="font-medium">{player.truthsCompleted}/{player.truthsTotal}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Dares</p>
                          <p className="font-medium">{player.daresCompleted}/{player.daresTotal}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Card */}
          <div className="lg:col-span-2">
            {currentPlayer && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-center">
                    {currentPlayer.name}'s Turn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gameState.currentCard ? (
                    <div className="text-center space-y-6">
                      <div className="inline-block">
                        <Badge 
                          variant={gameState.currentCard.type === 'truth' ? 'default' : 'destructive'}
                          className="mb-4"
                        >
                          {gameState.currentCard.type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="bg-white p-8 rounded-lg border-2 border-purple-200 min-h-[200px] flex items-center justify-center">
                        <p className="text-xl font-medium text-gray-800 text-center">
                          {currentPlayer
                            ? replaceRandomPlayer(gameState.currentCard.content, currentPlayer, gameState.players)
                            : gameState.currentCard.content
                          }
                        </p>
                      </div>
                      
                      {/* Increment/Decrement controls */}
                      <div className="flex justify-center items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={decrementCardUses}
                          disabled={gameState.hasDecremented}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-600">
                          Uses: {truthsAndDares.find(c => c.id === gameState.currentCard?.id)?.uses || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={incrementCardUses}
                          disabled={gameState.hasIncremented}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                      </div>

                      {!gameState.cardCompleted ? (
                        <div className="flex justify-center gap-4">
                          <Button
                            onClick={() => completeCard(true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </Button>
                          <Button
                            onClick={() => completeCard(false)}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Not Completed
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={nextTurn} className="w-full">
                          Next Turn
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p>Loading next card...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}