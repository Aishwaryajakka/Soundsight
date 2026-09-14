import type { AudioStream } from './types';

/** Native raw PCM requires a development-build module; Expo Go cannot supply it. */
export class NativeAudioStream implements AudioStream {
  isRunning(): boolean { return false; }
  async start(): Promise<void> { throw new Error('Native PCM capture requires an Expo development build with a compatible raw-audio module.'); }
  async stop(): Promise<void> {}
}
