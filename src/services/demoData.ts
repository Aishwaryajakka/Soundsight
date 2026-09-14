import { supportedSound } from './supportedSoundCatalog';
import type { SoundDirection, SoundEvent, SoundType } from '@/types/sound';
import type { TranscriptSegment } from '@/types/transcript';

export const DEMO_ID_PREFIX = 'demo-seed-';
export const isDemoRecordId = (id: string) => id.startsWith(DEMO_ID_PREFIX);

const EVENT_DEFINITIONS: readonly [SoundType, number, SoundDirection, number][] = [
  ['door_knock', 0.96, 'right', 2], ['doorbell', 0.87, 'front', 14], ['voice', 0.74, 'left', 31],
  ['glass_breaking', 0.91, 'right', 58], ['appliance_beep', 0.68, 'back', 96], ['dog_bark', 0.82, 'right', 145],
  ['singing', 0.76, 'left', 230], ['alarm', 0.94, 'front', 315], ['voice', 0.69, 'front', 24 * 60 + 45],
  ['door_knock', 0.79, 'left', 25 * 60 + 80], ['doorbell', 0.84, 'front', 26 * 60 + 130],
  ['dog_bark', 0.72, 'right', 27 * 60 + 210], ['vehicle', 0.66, 'left', 28 * 60 + 280],
  ['phone_ringing', 0.88, 'front', 29 * 60 + 350], ['clapping', 0.62, 'right', 30 * 60 + 420],
  ['siren', 0.97, 'left', 31 * 60 + 510],
] as const;

export function createDemoSoundEvents(now = Date.now()): SoundEvent[] {
  return EVENT_DEFINITIONS.map(([soundType, confidence, direction, minutesAgo], index) => {
    const definition = supportedSound(soundType);
    if (!definition) throw new Error(`Missing demo catalog entry: ${soundType}`);
    const soundLevelDbfs = -18 - (index % 6) * 5;
    return {
      id: `${DEMO_ID_PREFIX}event-${String(index + 1).padStart(2, '0')}`,
      soundType, label: definition.label, direction, confidence,
      intensity: Math.max(0.35, Math.min(0.92, 0.42 + confidence * 0.45)),
      priority: definition.priority, timestamp: now - minutesAgo * 60_000, isActive: index < 4,
      angle: direction === 'right' ? 90 : direction === 'back' ? 180 : direction === 'left' ? 270 : 0,
      category: definition.category, iconName: definition.iconName,
      description: `Demo ${definition.label.toLowerCase()} event.`, soundLevelDbfs,
      loudness: soundLevelDbfs < -40 ? 'quiet' : soundLevelDbfs < -18 ? 'moderate' : 'loud',
      timeAgo: index < 8 ? `${minutesAgo}m ago` : 'Yesterday',
    };
  });
}

const DEMO_LINES = [
  'Hey, are you ready to head out?', 'Almost. Give me one minute.', 'Did you remember your keys?',
  "Yeah, they're in my bag.", "Okay, let's go.",
] as const;

export function createDemoTranscripts(now = Date.now()): TranscriptSegment[] {
  return DEMO_LINES.map((text, index) => ({ id: `${DEMO_ID_PREFIX}transcript-${index + 1}`, text, timestamp: now - (DEMO_LINES.length - index) * 18_000, isFinal: true }));
}
