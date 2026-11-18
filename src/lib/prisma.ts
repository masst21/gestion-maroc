import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// On force l'URL avec le timeout
const url = process.env.DATABASE_URL?.includes('?') 
  ? `${process.env.DATABASE_URL}&connect_timeout=15`
  : `${process.env.DATABASE_URL}?connect_timeout=15`;

console.log('🔍 Connexion Prisma vers :', url?.split('@')[1] || 'URL non trouvée');

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: { url },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;