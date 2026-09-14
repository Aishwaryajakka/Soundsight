import type { SoundEvent } from '../types/sound';
import { parseSoundEvent } from './soundEventValidation';
import { isDemoRecordId } from './demoData';

export const SOUND_HISTORY_STORAGE_KEY = 'soundsight.sound-history.v1';
export const MAX_SOUND_HISTORY_EVENTS = 200;

export interface SoundHistoryKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/** Validate, de-duplicate, sort, and cap history before it enters app state or storage. */
export function normalizeSoundHistory(value: unknown): SoundEvent[] {
  if (!Array.isArray(value)) return [];

  const byId = new Map<string, SoundEvent>();
  for (const candidate of value) {
    const event = parseSoundEvent(candidate);
    if (!event || byId.has(event.id)) continue;
    byId.set(event.id, event);
  }

  return [...byId.values()]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, MAX_SOUND_HISTORY_EVENTS);
}

export function mergeSoundHistory(...collections: SoundEvent[][]): SoundEvent[] {
  return normalizeSoundHistory(collections.flat());
}

export class SoundHistoryStorage {
  private readonly storage: SoundHistoryKeyValueStorage;
  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(storage: SoundHistoryKeyValueStorage) {
    this.storage = storage;
  }

  /** Null means no history has ever been stored; [] means stored history was cleared/invalid. */
  public async load(): Promise<SoundEvent[] | null> {
    try {
      const serialized = await this.storage.getItem(SOUND_HISTORY_STORAGE_KEY);
      if (serialized === null) return null;
      return normalizeSoundHistory(JSON.parse(serialized)).filter((event) => !isDemoRecordId(event.id));
    } catch (error) {
      console.warn('Unable to restore SoundSight history; starting with an empty history.', error);
      return [];
    }
  }

  public async save(events: SoundEvent[]): Promise<void> {
    const serialized = JSON.stringify(normalizeSoundHistory(events).filter((event) => !isDemoRecordId(event.id)));
    this.writeQueue = this.writeQueue
      .catch(() => undefined)
      .then(() => this.storage.setItem(SOUND_HISTORY_STORAGE_KEY, serialized));
    try {
      await this.writeQueue;
    } catch (error) {
      console.warn('Unable to persist SoundSight history.', error);
    }
  }

  public async clear(): Promise<void> {
    // Persist an empty array instead of removing the key so sample seed data is
    // not restored after a user explicitly clears History.
    await this.save([]);
  }
}
