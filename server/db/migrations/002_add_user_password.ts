import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(migrations: MigrationBuilder): Promise<void> {
  // Add password_hash column to users table
  await migrations.addColumns('users', {
    password_hash: { type: 'text', notNull: true, default: "''" },
  });
}

export async function down(migrations: MigrationBuilder): Promise<void> {
  await migrations.dropColumns('users', 'password_hash');
}
