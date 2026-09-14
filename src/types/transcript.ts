export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export type TranscriptionStatus = 'listening' | 'processing' | 'paused' | 'offline';
