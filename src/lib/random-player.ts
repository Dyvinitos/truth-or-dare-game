interface Player {
  id: string
  name: string
  truthsCompleted: number
  daresCompleted: number
  truthsTotal: number
  daresTotal: number
}

/**
 * Replaces /random in dare content with a random player name
 * @param content - The dare content potentially containing /random
 * @param currentPlayer - The current player who should not be selected
 * @param allPlayers - Array of all players in the game
 * @returns The content with /random replaced by a random player name
 */
export function replaceRandomPlayer(
  content: string, 
  currentPlayer: Player, 
  allPlayers: Player[]
): string {
  if (!content.includes('/random')) {
    return content;
  }

  // Get all players except the current player
  const eligiblePlayers = allPlayers.filter(player => player.id !== currentPlayer.id);
  
  if (eligiblePlayers.length === 0) {
    // If no other players, replace with "someone"
    return content.replace(/\/random/g, 'someone');
  }

  // Select a random player
  const randomPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
  
  // Replace all instances of /random with the selected player's name
  return content.replace(/\/random/g, randomPlayer.name);
}

/**
 * Checks if content contains /random placeholder
 * @param content - The content to check
 * @returns True if content contains /random
 */
export function hasRandomPlaceholder(content: string): boolean {
  return content.includes('/random');
}

/**
 * Gets all unique random player names that would be used
 * @param content - The content with /random placeholders
 * @param currentPlayer - The current player
 * @param allPlayers - All players in the game
 * @returns Array of player names that would replace /random
 */
export function getRandomPlayerNames(
  content: string,
  currentPlayer: Player,
  allPlayers: Player[]
): string[] {
  if (!hasRandomPlaceholder(content)) {
    return [];
  }

  const eligiblePlayers = allPlayers.filter(player => player.id !== currentPlayer.id);
  
  if (eligiblePlayers.length === 0) {
    return ['someone'];
  }

  // For each /random instance, we could potentially get different players
  // For now, return all eligible players as possibilities
  return eligiblePlayers.map(player => player.name);
}