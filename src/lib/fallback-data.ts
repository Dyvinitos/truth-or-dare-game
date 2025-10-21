// Fallback data for when database is not available
export const fallbackTruths = [
  "What is your most embarrassing moment?",
  "Have you ever lied to your best friend?",
  "What is your biggest fear?",
  "What is the craziest dream you've ever had?",
  "Have you ever cheated on a test?",
  "What is your biggest regret?",
  "Have you ever stolen anything?",
  "What is your most embarrassing childhood memory?",
  "Have you ever had a crush on a teacher?",
  "What is the weirdest food you've ever eaten?",
  "Have you ever pretended to be sick to get out of something?",
  "What is your biggest insecurity?",
  "Have you ever broken the law?",
  "What is the most trouble you've ever gotten into?",
  "Have you ever cried during a movie?",
  "What do you think of /random?",
  "Have you ever had a crush on /random?",
  "What's your favorite memory with /random?",
  "If you could switch lives with /random for a day, would you?",
  "What's something you admire about /random?"
]

export const fallbackDares = [
  "Do 10 pushups",
  "Sing a song loudly",
  "Dance for 30 seconds",
  "Do your best impression of a celebrity",
  "Tell a joke and make everyone laugh",
  "Do a handstand for 10 seconds",
  "Speak in an accent for the next 3 minutes",
  "Do 20 jumping jacks",
  "Act like a chicken for 30 seconds",
  "Sing the alphabet backwards",
  "Do a silly dance in the middle of the room",
  "Tell everyone your most embarrassing moment",
  "Let someone draw on your face",
  "Wear your clothes backwards for the next round",
  "Do a cartwheel",
  "Give /random a compliment",
  "Do a trust fall with /random",
  "Let /random style your hair",
  "Serenade /random",
  "Do 5 pushups for /random"
]

export function getFallbackTruthsOrDares() {
  const fallbackData = [
    ...fallbackTruths.map(content => ({
      id: `fallback-truth-${Math.random().toString(36).substr(2, 9)}`,
      type: 'truth' as const,
      content,
      uses: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    ...fallbackDares.map(content => ({
      id: `fallback-dare-${Math.random().toString(36).substr(2, 9)}`,
      type: 'dare' as const,
      content,
      uses: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  ]
  
  // Shuffle the array
  return fallbackData.sort(() => Math.random() - 0.5)
}