import { PgLiteral } from 'node-pg-migrate';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isTest = process.env.NODE_ENV === 'test';
const databaseUrl = isTest ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('ERROR: Database URL not configured');
  console.error('Please set DATABASE_URL in server/.env');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function runMigrations() {
  try {
    console.log(`Running migrations against ${isTest ? 'TEST' : 'DEVELOPMENT'} database...`);
    
    const migrationResults = await migrationRunner({
      dbClient: await pool.connect(),
      migrationsFolder: path.resolve(__dirname, 'migrations'),
      dir: 'up',
      createSchema: true,
      verbose: true,
    });

    console.log(`✓ Successfully ran ${migrationResults.length} migration(s)`);
    
    if (migrationResults.length === 0) {
      console.log('  Database is up to date');
    } else {
      migrationResults.forEach(result => {
        console.log(`  - ${result.name}`);
      });
    }
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
