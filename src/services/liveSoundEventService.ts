import { soundEventService } from '@/services/soundEventService';
import { parseSoundEvent } from '@/services/soundEventValidation';

export type LiveSoundConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

type ConnectionStateListener = (state: LiveSoundConnectionState) => void;
type WebSocketFactory = (url: string) => WebSocket;

const MAX_REMEMBERED_EVENT_IDS = 256;

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
    };
    socket.onmessage = (event) => {
      if (generation !== this.connectionGeneration) return;
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
        this.scheduleReconnect(generation);
      }
    };
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
