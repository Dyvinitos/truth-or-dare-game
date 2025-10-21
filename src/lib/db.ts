import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Handle database connection errors
process.on('beforeExit', async () => {
  await globalForPrisma.prisma?.$disconnect()
})

process.on('SIGINT', async () => {
  await globalForPrisma.prisma?.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await globalForPrisma.prisma?.$disconnect()
  process.exit(0)
})