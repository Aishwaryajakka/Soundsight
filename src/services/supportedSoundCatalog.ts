import type { SoundCategory, SoundPriority, SoundType } from '@/types/sound';

export interface SupportedSoundDefinition {
  soundType: SoundType;
  label: string;
  yamnetLabels: readonly string[];
  requiredYamnetLabels?: readonly string[];
  category: SoundCategory;
  iconName: string;
  priority: SoundPriority;
}

/** Product taxonomy mirrored by audio-engine/label_mapper.py. Labels are AudioSet/YAMNet vocabulary. */
export const SUPPORTED_SOUND_CATALOG: readonly SupportedSoundDefinition[] = [
  { soundType: 'door_knock', label: 'Door Knock', yamnetLabels: ['Knock'], category: 'household', iconName: 'DoorClosed', priority: 'normal' },
  { soundType: 'doorbell', label: 'Doorbell', yamnetLabels: ['Doorbell', 'Ding-dong'], category: 'household', iconName: 'Bell', priority: 'normal' },
  { soundType: 'appliance_beep', label: 'Appliance Beep', yamnetLabels: ['Beep, bleep', 'Buzzer', 'Microwave oven'], category: 'household', iconName: 'Microwave', priority: 'info' },
  { soundType: 'phone_ringing', label: 'Phone Ringing', yamnetLabels: ['Telephone bell ringing', 'Ringtone'], category: 'household', iconName: 'Phone', priority: 'normal' },
  { soundType: 'running_water', label: 'Running Water', yamnetLabels: ['Water', 'Water tap, faucet'], category: 'household', iconName: 'Droplets', priority: 'info' },
  { soundType: 'vacuum', label: 'Vacuum', yamnetLabels: ['Vacuum cleaner'], category: 'household', iconName: 'Wind', priority: 'info' },
  { soundType: 'voice', label: 'Voice', yamnetLabels: ['Speech', 'Conversation', 'Narration, monologue'], category: 'people', iconName: 'Volume2', priority: 'info' },
  { soundType: 'singing', label: 'Singing', yamnetLabels: ['Singing'], category: 'people', iconName: 'Music2', priority: 'info' },
  { soundType: 'baby_crying', label: 'Baby Crying', yamnetLabels: ['Baby cry, infant cry'], category: 'people', iconName: 'Baby', priority: 'high' },
  { soundType: 'footsteps', label: 'Footsteps', yamnetLabels: ['Walk, footsteps'], category: 'people', iconName: 'Footprints', priority: 'info' },
  { soundType: 'clapping', label: 'Clapping', yamnetLabels: ['Clapping'], category: 'people', iconName: 'Hand', priority: 'info' },
  { soundType: 'whistling', label: 'Whistling', yamnetLabels: ['Whistling'], category: 'people', iconName: 'AudioLines', priority: 'info' },
  { soundType: 'dog_bark', label: 'Dog Bark', yamnetLabels: ['Bark'], category: 'animals', iconName: 'Dog', priority: 'normal' },
  { soundType: 'alarm', label: 'Alarm', yamnetLabels: ['Alarm', 'Alarm clock', 'Smoke detector, smoke alarm', 'Fire alarm'], category: 'safety', iconName: 'Flame', priority: 'critical' },
  { soundType: 'siren', label: 'Siren', yamnetLabels: ['Siren', 'Civil defense siren'], category: 'safety', iconName: 'Siren', priority: 'critical' },
  { soundType: 'glass_breaking', label: 'Glass Breaking', yamnetLabels: ['Breaking', 'Shatter'], requiredYamnetLabels: ['Glass'], category: 'safety', iconName: 'GlassWater', priority: 'critical' },
  { soundType: 'car_horn', label: 'Car Horn', yamnetLabels: ['Vehicle horn, car horn, honking'], category: 'vehicles', iconName: 'CarFront', priority: 'high' },
  { soundType: 'vehicle', label: 'Car / Vehicle', yamnetLabels: ['Vehicle', 'Car'], category: 'vehicles', iconName: 'Car', priority: 'info' },
] as const;

const BY_TYPE = new Map(SUPPORTED_SOUND_CATALOG.map((definition) => [definition.soundType, definition]));

export function supportedSound(type: SoundType): SupportedSoundDefinition | undefined {
  return BY_TYPE.get(type);
}
