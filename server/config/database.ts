import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// For test environment, we'll use a mock pool that can be overridden
let currentPool: Pool | null = null;

export function setPool(pool: Pool) {
  currentPool = pool;
}

export function getPool(): Pool {
  if (currentPool) {
    return currentPool;
  }
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  currentPool = new Pool({
    connectionString: databaseUrl,
  });
  
  return currentPool;
}

export const pool = {
  query: async (text: string, params?: any[]) => {
    return getPool().query(text, params);
  },
  connect: async () => {
    return getPool().connect();
  },
  end: async () => {
    if (currentPool) {
      await currentPool.end();
    }
  }
};
