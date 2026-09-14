import type { AudioFrameSink, AudioStream, AudioStreamConfig } from './types';
import { floatToPcm16Le, resampleMono } from './pcm';

const CONFIG: AudioStreamConfig = { format: 'pcm_s16le', sampleRate: 16000, channels: 1 };

export class WebAudioStream implements AudioStream {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;
  private running = false;
  constructor(private readonly sink: AudioFrameSink) {}
  isRunning(): boolean { return this.running; }

  async start(): Promise<void> {
    if (this.running) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === 'undefined') throw new Error('Browser microphone capture is unavailable.');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const context = new AudioContext();
    if (!context.audioWorklet) { stream.getTracks().forEach((track) => { track.stop(); }); await context.close(); throw new Error('This browser does not support AudioWorklet microphone streaming.'); }
    const source = context.createMediaStreamSource(stream);
    const processor = `class SoundSightPcmProcessor extends AudioWorkletProcessor { process(inputs) { const channel = inputs[0] && inputs[0][0]; if (channel) this.port.postMessage(channel.slice(0)); return true; } } registerProcessor('soundsight-pcm', SoundSightPcmProcessor);`;
    const url = URL.createObjectURL(new Blob([processor], { type: 'text/javascript' }));
    try { await context.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
    const node = new AudioWorkletNode(context, 'soundsight-pcm');
    node.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
      if (!this.running || !(data instanceof Float32Array)) return;
      this.sink(CONFIG, floatToPcm16Le(resampleMono(data, context.sampleRate, CONFIG.sampleRate)));
    };
    source.connect(node);
    node.connect(context.destination);
    this.context = context; this.stream = stream; this.node = node; this.running = true;
    if (__DEV__) console.info(`SoundSight microphone started: ${context.sampleRate} Hz -> 16000 Hz PCM`);
  }

  async stop(): Promise<void> {
    this.running = false;
    this.node?.disconnect(); this.node = null;
    this.stream?.getTracks().forEach((track) => { track.stop(); }); this.stream = null;
    const context = this.context; this.context = null;
    if (context && context.state !== 'closed') await context.close();
  }
}
