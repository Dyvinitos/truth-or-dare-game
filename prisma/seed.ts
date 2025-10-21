import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const initialTruths = [
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
  "What's something you admire about /random?",
  "Have you ever been jealous of /random?",
  "What's your first impression of /random?",
  "Would you trust /random with a secret?",
  "What's the funniest thing /random has ever done?",
  "If you were stuck on an island with /random, what would happen?",
  "What do you think /random thinks of you?",
  "Have you ever wanted to be more like /random?",
  "What's one thing you'd change about /random?",
  "Would you share your last piece of food with /random?"
]

const initialDares = [
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
  "Do 5 pushups for /random",
  "Tell /random your favorite memory of them",
  "Give /random a piggyback ride",
  "Let /random choose your nickname for the next round",
  "Make /random laugh without touching them",
  "Compliment /random's outfit",
  "Do an impression of /random"
]

async function main() {
  console.log('Start seeding...')

  // Clear existing data
  await prisma.truthOrDare.deleteMany()

  // Add initial truths
  for (const content of initialTruths) {
    await prisma.truthOrDare.create({
      data: {
        type: 'truth',
        content,
        uses: 0
      }
    })
  }

  // Add initial dares
  for (const content of initialDares) {
    await prisma.truthOrDare.create({
      data: {
        type: 'dare',
        content,
        uses: 0
      }
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })