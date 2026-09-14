export interface AudioStreamConfig {
  format: 'pcm_s16le';
  sampleRate: 16000;
  channels: 1;
}

export interface AudioStream {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

export type AudioFrameSink = (config: AudioStreamConfig, frame: ArrayBuffer) => void;
