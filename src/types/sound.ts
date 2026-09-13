export type SoundCategory = 'safety' | 'speech' | 'household' | 'outdoor';

export type SoundType =
  | 'door_knock'
  | 'doorbell'
  | 'name_called'
  | 'alarm'
  | 'appliance_beep'
  | 'dog_bark'
  | 'baby_crying'
  | 'car_horn'
  | 'glass_breaking'
  | 'siren'
  | 'footsteps'
  | 'custom'
  | 'other';

export type SoundDirection =
  | 'front'
  | 'right'
  | 'left'
  | 'back'
  | 'front_right'
  | 'front_left'
  | 'back_right'
  | 'back_left';

export type SoundPriority = 'critical' | 'high' | 'normal' | 'info';

/**
 * Unified SoundEvent Data Structure
 * Standardized schema consumed across Live Map, Recent Sounds, Sound History, Sound Details, and Alerts.
 * Ready for drop-in real microphone + AI detection engine integration.
 */
export interface SoundEvent {
  id: string;
  soundType: SoundType;
  label: string;
  direction: SoundDirection;
  confidence: number; // 0.0 to 1.0 (e.g. 0.96)
  intensity: number; // 0.0 to 1.0 (e.g. 0.82)
  priority: SoundPriority; // 'critical' | 'high' | 'normal' | 'info'
  timestamp: number; // Unix epoch timestamp in milliseconds (Date.now())
  isActive: boolean;

  // Spatial & Acoustic Engine Helpers
  angle?: number; // 0 - 360 degrees (0 = front, 90 = right, 180 = back, 270 = left)
  decibels?: number; // Acoustic decibels e.g. 78
  distanceMeters?: number; // Estimated distance in meters e.g. 2.1
  timeAgo?: string; // Formatted relative time e.g. '2s ago'
  category?: SoundCategory; // Classification category
  iconName?: string; // Visual icon identifier
  description?: string; // Human-readable event description
  frequencyHz?: number; // Peak frequency in Hz
  waveContours?: number[]; // Wave elevation profile heights
}

export interface ImportantSoundSetting {
  id: string;
  soundType: SoundType;
  name: string;
  category: SoundCategory;
  enabled: boolean;
  iconName: string;
}

export interface AlertTrigger {
  id: string;
  soundType: SoundType;
  name: string;
  category: SoundCategory;
  priority: SoundPriority;
  enabled: boolean;
  vibrationPattern: 'single' | 'double' | 'sos' | 'continuous';
  visualStrobe: boolean;
  minConfidence: number;
  iconName: string;
}

export interface CustomSoundRecording {
  id: string;
  name: string;
  category: SoundCategory;
  priority: SoundPriority;
  recordedAt: string;
  sampleCount: number;
  sensitivity: number;
  color: string;
  iconName: string;
}

export interface AppSettings {
  audioSensitivity: number; // 1 - 100
  micGainCalibration: number; // -10 to +10 dB
  compassTracking: boolean;
  compassOffsetDeg: number;
  highContrastMode: boolean;
  contourDensity: 'low' | 'medium' | 'high';
  textSizeScale: 'normal' | 'large' | 'extra-large';
  hapticIntensity: 'off' | 'light' | 'medium' | 'strong';
  flashScreenOnCritical: boolean;
  keepScreenAwake: boolean;
}
