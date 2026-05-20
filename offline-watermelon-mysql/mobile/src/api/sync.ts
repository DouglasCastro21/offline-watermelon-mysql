import { synchronize } from '@nozbe/watermelondb/sync';
import type { SyncDatabaseChangeSet } from '@nozbe/watermelondb/sync';
import { database } from '../database';
import { postJson } from './client';

let syncing = false;

export async function syncDatabase(token: string) {
  if (syncing) {
    return;
  }

  syncing = true;
  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        return postJson<{ changes: SyncDatabaseChangeSet; timestamp: number }>('/sync/pull', token, {
          lastPulledAt,
          schemaVersion,
          migration
        });
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        await postJson('/sync/push', token, { changes, lastPulledAt });
      },
      migrationsEnabledAtVersion: 1
    });
  } finally {
    syncing = false;
  }
}
