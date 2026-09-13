import type {
  SoundCategory,
  SoundDirection,
  SoundEvent,
  SoundPriority,
  SoundType,
} from '../types/sound';

const SOUND_TYPES = new Set<SoundType>([
  'door_knock', 'doorbell', 'name_called', 'alarm', 'appliance_beep', 'dog_bark',
  'baby_crying', 'car_horn', 'glass_breaking', 'siren', 'footsteps', 'custom', 'other',
]);
const DIRECTIONS = new Set<SoundDirection>([
  'front', 'right', 'left', 'back', 'front_right', 'front_left', 'back_right', 'back_left',
]);
const PRIORITIES = new Set<SoundPriority>(['critical', 'high', 'normal', 'info']);
const CATEGORIES = new Set<SoundCategory>(['safety', 'speech', 'household', 'outdoor']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function optionalFiniteNumber(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key];
  return value === undefined ? undefined : isFiniteNumber(value) ? value : Number.NaN;
}

/** Validate and normalize unknown data into the repository's canonical SoundEvent. */
export function parseSoundEvent(message: unknown): SoundEvent | null {
  let payload: unknown = message;
  if (typeof message === 'string') {
    try {
      payload = JSON.parse(message);
    } catch {
      return null;
    }
  }
  if (!isRecord(payload)) return null;

  const { id, soundType, label, direction, confidence, intensity, priority, timestamp, isActive } =
    payload;
  if (
    typeof id !== 'string' || id.trim().length === 0 ||
    typeof soundType !== 'string' || !SOUND_TYPES.has(soundType as SoundType) ||
    typeof label !== 'string' || label.trim().length === 0 ||
    typeof direction !== 'string' || !DIRECTIONS.has(direction as SoundDirection) ||
    !isFiniteNumber(confidence) || confidence < 0 || confidence > 1 ||
    !isFiniteNumber(intensity) || intensity < 0 || intensity > 1 ||
    typeof priority !== 'string' || !PRIORITIES.has(priority as SoundPriority) ||
    !isFiniteNumber(timestamp) || !Number.isInteger(timestamp) || timestamp < 0 ||
    typeof isActive !== 'boolean'
  ) return null;

  const angle = optionalFiniteNumber(payload, 'angle');
  const decibels = optionalFiniteNumber(payload, 'decibels');
  const distanceMeters = optionalFiniteNumber(payload, 'distanceMeters');
  const frequencyHz = optionalFiniteNumber(payload, 'frequencyHz');
  if (
    Number.isNaN(angle) || (angle !== undefined && (angle < 0 || angle > 360)) ||
    Number.isNaN(decibels) || Number.isNaN(distanceMeters) ||
    (distanceMeters !== undefined && distanceMeters < 0) || Number.isNaN(frequencyHz) ||
    (frequencyHz !== undefined && frequencyHz < 0)
  ) return null;

  const category = payload.category;
  if (category !== undefined &&
    (typeof category !== 'string' || !CATEGORIES.has(category as SoundCategory))) return null;
  for (const key of ['timeAgo', 'iconName', 'description'] as const) {
    if (payload[key] !== undefined && typeof payload[key] !== 'string') return null;
  }
  if (payload.waveContours !== undefined &&
    (!Array.isArray(payload.waveContours) || !payload.waveContours.every(isFiniteNumber))) return null;

  const event: SoundEvent = {
    id: id.trim(), soundType: soundType as SoundType, label: label.trim(),
    direction: direction as SoundDirection, confidence, intensity,
    priority: priority as SoundPriority, timestamp, isActive,
  };
  if (angle !== undefined) event.angle = angle;
  if (decibels !== undefined) event.decibels = decibels;
  if (distanceMeters !== undefined) event.distanceMeters = distanceMeters;
  if (frequencyHz !== undefined) event.frequencyHz = frequencyHz;
  if (category !== undefined) event.category = category as SoundCategory;
  if (typeof payload.timeAgo === 'string') event.timeAgo = payload.timeAgo;
  if (typeof payload.iconName === 'string') event.iconName = payload.iconName;
  if (typeof payload.description === 'string') event.description = payload.description;
  if (Array.isArray(payload.waveContours)) event.waveContours = [...payload.waveContours];
  return event;
}
