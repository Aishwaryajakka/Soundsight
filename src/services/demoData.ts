import { supportedSound } from './supportedSoundCatalog';
import type { SoundDirection, SoundEvent, SoundType } from '@/types/sound';
import type { TranscriptSegment } from '@/types/transcript';

export const DEMO_ID_PREFIX = 'demo-seed-';
export const isDemoRecordId = (id: string) => id.startsWith(DEMO_ID_PREFIX);

export interface GuidedDemoStep {
  delayMs: number;
  event?: SoundEvent;
  guidance?: string;
}

function guidedEvent(
  id: string,
  soundType: SoundType,
  direction: SoundDirection,
  confidence: number,
): SoundEvent {
  const definition = supportedSound(soundType);
  if (!definition) throw new Error(`Missing guided demo catalog entry: ${soundType}`);
  const angle = direction === 'right' ? 90 : direction === 'back' ? 180 : direction === 'left' ? 270 : 0;
  return {
    id: `${DEMO_ID_PREFIX}guided-${id}`,
    soundType,
    label: definition.label,
    direction,
    confidence,
    intensity: Math.min(0.92, 0.42 + confidence * 0.48),
    priority: definition.priority,
    timestamp: 0,
    isActive: true,
    angle,
    category: definition.category,
    iconName: definition.iconName,
    description: `Simulated ${definition.label.toLowerCase()} for the guided SoundSight demo.`,
    soundLevelDbfs: -22,
    loudness: 'moderate',
    timeAgo: 'Just now',
  };
}

/** Events and coaching are deliberately separate steps so guidance stays sparse. */
export function createGuidedDemoSequence(): GuidedDemoStep[] {
  return [
    {
      delayMs: 3_000,
      event: guidedEvent('door-knock', 'door_knock', 'right', 0.94),
      guidance: 'Door Knock detected on your right.\nTap the sound marker to view details.',
    },
    { delayMs: 8_000, event: guidedEvent('doorbell', 'doorbell', 'front', 0.91) },
    {
      delayMs: 12_000,
      event: guidedEvent('dog-bark', 'dog_bark', 'left', 0.86),
      guidance: 'Open History to see what SoundSight has detected.',
    },
    { delayMs: 18_000, event: guidedEvent('appliance-beep', 'appliance_beep', 'front', 0.82) },
    {
      delayMs: 23_000,
      event: guidedEvent('alarm', 'alarm', 'right', 0.92),
      guidance: 'Important sounds also appear in Alerts.',
    },
    { delayMs: 30_000, guidance: 'Explore Settings to adjust contours, confidence, and haptics.' },
  ];
}

// Day offset plus a fraction of that day keeps the judge dataset reliably
// split across Today and Yesterday regardless of what time the demo is opened.
const EVENT_DEFINITIONS: readonly [SoundType, number, SoundDirection, 0 | 1, number][] = [
  ['door_knock', 0.89, 'right', 0, 0.98], ['doorbell', 0.81, 'front', 0, 0.88], ['voice', 0.74, 'left', 0, 0.77],
  ['glass_breaking', 0.91, 'right', 0, 0.66], ['appliance_beep', 0.63, 'back', 0, 0.55], ['dog_bark', 0.78, 'right', 0, 0.44],
  ['singing', 0.69, 'left', 0, 0.33], ['alarm', 0.86, 'front', 0, 0.22], ['vehicle', 0.58, 'left', 0, 0.11],
  ['voice', 0.67, 'front', 1, 0.91], ['door_knock', 0.76, 'left', 1, 0.81], ['doorbell', 0.83, 'front', 1, 0.71],
  ['dog_bark', 0.72, 'right', 1, 0.61], ['vehicle', 0.65, 'left', 1, 0.51], ['phone_ringing', 0.87, 'front', 1, 0.41],
  ['appliance_beep', 0.61, 'right', 1, 0.31], ['siren', 0.94, 'left', 1, 0.21], ['singing', 0.71, 'back', 1, 0.11],
] as const;

export function createDemoSoundEvents(now = Date.now()): SoundEvent[] {
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const elapsedToday = Math.max(1, now - todayStart.getTime());
  const yesterdayDuration = todayStart.getTime() - yesterdayStart.getTime();
  return EVENT_DEFINITIONS.map(([soundType, confidence, direction, dayOffset, dayFraction], index) => {
    const definition = supportedSound(soundType);
    if (!definition) throw new Error(`Missing demo catalog entry: ${soundType}`);
    const soundLevelDbfs = -18 - (index % 6) * 5;
    const timestamp = dayOffset === 0
      ? todayStart.getTime() + elapsedToday * dayFraction
      : yesterdayStart.getTime() + yesterdayDuration * dayFraction;
    const ageMinutes = Math.max(0, Math.round((now - timestamp) / 60_000));
    return {
      id: `${DEMO_ID_PREFIX}event-${String(index + 1).padStart(2, '0')}`,
      soundType, label: definition.label, direction, confidence,
      intensity: Math.max(0.35, Math.min(0.92, 0.42 + confidence * 0.45)),
      priority: definition.priority, timestamp: Math.round(timestamp), isActive: index < 4,
      angle: direction === 'right' ? 90 : direction === 'back' ? 180 : direction === 'left' ? 270 : 0,
      category: definition.category, iconName: definition.iconName,
      description: `Demo ${definition.label.toLowerCase()} event.`, soundLevelDbfs,
      loudness: soundLevelDbfs < -40 ? 'quiet' : soundLevelDbfs < -18 ? 'moderate' : 'loud',
      timeAgo: dayOffset === 0 ? `${ageMinutes}m ago` : 'Yesterday',
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
