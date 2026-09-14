import type { TranscriptSegment } from '@/types/transcript';
import { isDemoRecordId } from './demoData';

export const TRANSCRIPT_STORAGE_KEY = 'soundsight.transcripts.v1';
export const TRANSCRIPT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

interface Storage { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> }

export function parseTranscriptMessage(value: unknown): TranscriptSegment | null {
  let candidate = value;
  if (typeof value === 'string') { try { candidate = JSON.parse(value); } catch { return null; } }
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const item = candidate as Record<string, unknown>;
  if (item.type !== 'transcript' || typeof item.id !== 'string' || !item.id.trim() || typeof item.text !== 'string' || !item.text.trim() || typeof item.timestamp !== 'number' || !Number.isInteger(item.timestamp) || item.timestamp < 0 || typeof item.isFinal !== 'boolean') return null;
  return { id: item.id.trim(), text: item.text.trim(), timestamp: item.timestamp, isFinal: item.isFinal };
}

export function normalizeTranscripts(value: unknown, now = Date.now()): TranscriptSegment[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, TranscriptSegment>();
  for (const item of value) {
    const segment = parseTranscriptMessage({ ...(typeof item === 'object' && item ? item : {}), type: 'transcript', isFinal: true });
    if (segment && segment.timestamp >= now - TRANSCRIPT_RETENTION_MS && segment.timestamp <= now && !unique.has(segment.id)) unique.set(segment.id, segment);
  }
  return [...unique.values()].sort((a, b) => a.timestamp - b.timestamp);
}

export class TranscriptStorage {
  constructor(private readonly storage: Storage) {}
  async load(): Promise<TranscriptSegment[]> { try { const raw = await this.storage.getItem(TRANSCRIPT_STORAGE_KEY); const cleaned = normalizeTranscripts(raw ? JSON.parse(raw) : []).filter((item) => !isDemoRecordId(item.id)); await this.save(cleaned); return cleaned; } catch { await this.save([]); return []; } }
  async save(segments: TranscriptSegment[]): Promise<void> { const finalized = normalizeTranscripts(segments.filter((item) => item.isFinal)).filter((item) => !isDemoRecordId(item.id)).map(({ id, text, timestamp }) => ({ id, text, timestamp })); await this.storage.setItem(TRANSCRIPT_STORAGE_KEY, JSON.stringify(finalized)); }
  async clear(): Promise<void> { await this.storage.setItem(TRANSCRIPT_STORAGE_KEY, '[]'); }
}
