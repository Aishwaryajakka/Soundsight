import { Platform } from 'react-native';
import { liveSoundEventService } from '../liveSoundEventService';
import type { AudioStream } from './types';
import { NativeAudioStream } from './nativeAudioStream';
import { WebAudioStream } from './webAudioStream';

export const clientAudioStream: AudioStream = Platform.OS === 'web'
  ? new WebAudioStream((config, frame) => {
      liveSoundEventService.configureAudioStream(config);
      liveSoundEventService.sendAudioFrame(frame);
    })
  : new NativeAudioStream();
