import { soundEventService } from './soundEventService';
import { parseSoundEvent } from './soundEventValidation';
import { parseTranscriptMessage } from './transcriptStorage';
import type { TranscriptSegment, TranscriptionStatus } from '@/types/transcript';

export type LiveSoundConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

type ConnectionStateListener = (state: LiveSoundConnectionState) => void;
type TranscriptListener = (segment: TranscriptSegment) => void;
type TranscriptionStatusListener = (status: TranscriptionStatus) => void;
type WebSocketFactory = (url: string) => WebSocket;

const MAX_REMEMBERED_EVENT_IDS = 256;
const SENSITIVITY_THRESHOLDS = {
  Low: 0.5,
  Medium: 0.35,
  High: 0.25,
} as const;

export type LiveDetectionSensitivity = keyof typeof SENSITIVITY_THRESHOLDS;

export function thresholdForSensitivity(sensitivity: LiveDetectionSensitivity): number {
  return SENSITIVITY_THRESHOLDS[sensitivity];
}

export const parseSoundEventMessage = parseSoundEvent;

export class LiveSoundEventService {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private intentionallyStopped = true;
  private connectionGeneration = 0;
  private state: LiveSoundConnectionState = 'disconnected';
  private readonly stateListeners = new Set<ConnectionStateListener>();
  private readonly seenEventIds = new Set<string>();
  private readonly seenEventOrder: string[] = [];
  private detectionSensitivity: LiveDetectionSensitivity = 'Medium';
  private readonly transcriptListeners = new Set<TranscriptListener>();
  private readonly transcriptionStatusListeners = new Set<TranscriptionStatusListener>();
  private conversationEnabled = false;
  private conversationPaused = false;

  constructor(
    private readonly url: string | undefined,
    private readonly createSocket: WebSocketFactory = (socketUrl) => new WebSocket(socketUrl)
  ) {}

  public getConnectionState(): LiveSoundConnectionState {
    return this.state;
  }

  public subscribeConnectionState(listener: ConnectionStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  public subscribeTranscripts(listener: TranscriptListener): () => void { this.transcriptListeners.add(listener); return () => this.transcriptListeners.delete(listener); }
  public subscribeTranscriptionStatus(listener: TranscriptionStatusListener): () => void { this.transcriptionStatusListeners.add(listener); return () => this.transcriptionStatusListeners.delete(listener); }
  public setConversationMode(enabled: boolean, paused = false): boolean { this.conversationEnabled = enabled; this.conversationPaused = paused; return this.sendConversationConfig(); }

  /** Save the desired live-engine threshold and apply it on this or the next connection. */
  public setDetectionSensitivity(sensitivity: LiveDetectionSensitivity): boolean {
    this.detectionSensitivity = sensitivity;
    return this.sendSensitivityConfig();
  }

  public start(): void {
    if (!this.url) {
      this.setState('disconnected');
      return;
    }
    if (!/^wss?:\/\/[^\s]+$/i.test(this.url)) {
      console.warn('EXPO_PUBLIC_AUDIO_ENGINE_WS must be a ws:// or wss:// URL.');
      this.setState('error');
      return;
    }
    if (!this.intentionallyStopped || this.socket) return;
    this.intentionallyStopped = false;
    this.reconnectAttempt = 0;
    this.connect();
  }

  public stop(): void {
    this.intentionallyStopped = true;
    this.connectionGeneration += 1;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    const socket = this.socket;
    this.socket = null;
    if (socket && socket.readyState < 2) socket.close(1000, 'App stopped');
    this.setState('disconnected');
  }

  private connect(): void {
    if (this.intentionallyStopped || !this.url) return;
    const generation = ++this.connectionGeneration;
    this.setState('connecting');
    let socket: WebSocket;
    try {
      socket = this.createSocket(this.url);
    } catch (error) {
      console.warn('Unable to create SoundSight audio-engine WebSocket.', error);
      this.setState('error');
      this.scheduleReconnect(generation);
      return;
    }
    this.socket = socket;
    socket.onopen = () => {
      if (generation !== this.connectionGeneration) return;
      this.reconnectAttempt = 0;
      this.setState('connected');
      this.sendSensitivityConfig();
      this.sendConversationConfig();
    };
    socket.onmessage = (event) => {
      if (generation !== this.connectionGeneration) return;
      const transcript = parseTranscriptMessage(event.data);
      if (transcript) { if (this.conversationEnabled && !this.conversationPaused) this.transcriptListeners.forEach((listener) => { listener(transcript); }); return; }
      const status = this.parseTranscriptionStatus(event.data);
      if (status) { this.transcriptionStatusListeners.forEach((listener) => { listener(status); }); return; }
      if (this.isControlResponse(event.data)) return;
      const soundEvent = parseSoundEvent(event.data);
      if (!soundEvent) {
        console.warn('Ignored malformed SoundSight audio-engine message.');
        return;
      }
      if (this.seenEventIds.has(soundEvent.id)) return;
      this.rememberEventId(soundEvent.id);
      soundEventService.emit(soundEvent);
    };
    socket.onerror = () => {
      if (generation === this.connectionGeneration) this.setState('error');
    };
    socket.onclose = () => {
      if (generation !== this.connectionGeneration) return;
      this.socket = null;
      if (this.intentionallyStopped) {
        this.setState('disconnected');
      } else {
        // Preserve an explicit error raised by onerror; otherwise surface a
        // clean server stop immediately while the reconnect timer is pending.
        if (this.state !== 'error') this.setState('disconnected');
        this.scheduleReconnect(generation);
      }
    };
  }

  private sendSensitivityConfig(): boolean {
    if (!this.socket || this.socket.readyState !== 1) return false;
    this.socket.send(JSON.stringify({
      type: 'config',
      minConfidence: thresholdForSensitivity(this.detectionSensitivity),
    }));
    return true;
  }

  private sendConversationConfig(): boolean { if (!this.socket || this.socket.readyState !== 1) return false; this.socket.send(JSON.stringify({ type: 'conversation', enabled: this.conversationEnabled, paused: this.conversationPaused })); return true; }

  private parseTranscriptionStatus(data: unknown): TranscriptionStatus | null { if (typeof data !== 'string') return null; try { const value = JSON.parse(data) as { type?: unknown; status?: unknown }; return value.type === 'transcription_status' && (value.status === 'listening' || value.status === 'processing' || value.status === 'paused' || value.status === 'offline') ? value.status : null; } catch { return null; } }

  private isControlResponse(data: unknown): boolean {
    if (typeof data !== 'string') return false;
    try {
      const message = JSON.parse(data) as { type?: unknown };
      return message?.type === 'config_ack' || message?.type === 'config_error';
    } catch {
      return false;
    }
  }

  private scheduleReconnect(generation: number): void {
    if (this.intentionallyStopped || generation !== this.connectionGeneration || this.reconnectTimer) {
      return;
    }
    const baseDelay = Math.min(30_000, 1_000 * 2 ** this.reconnectAttempt);
    const jitteredDelay = Math.round(baseDelay * (0.8 + Math.random() * 0.4));
    this.reconnectAttempt = Math.min(this.reconnectAttempt + 1, 5);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, jitteredDelay);
  }

  private rememberEventId(id: string): void {
    this.seenEventIds.add(id);
    this.seenEventOrder.push(id);
    if (this.seenEventOrder.length > MAX_REMEMBERED_EVENT_IDS) {
      const oldest = this.seenEventOrder.shift();
      if (oldest) this.seenEventIds.delete(oldest);
    }
  }

  private setState(nextState: LiveSoundConnectionState): void {
    if (this.state === nextState) return;
    this.state = nextState;
    this.stateListeners.forEach((listener) => {
      listener(nextState);
    });
  }
}

export const liveSoundEventService = new LiveSoundEventService(
  process.env.EXPO_PUBLIC_AUDIO_ENGINE_WS
);
