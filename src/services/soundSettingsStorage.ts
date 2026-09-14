export const SOUND_SETTINGS_STORAGE_KEY = 'soundsight.settings.v1';

export type MapFadeDuration = '5s' | '10s' | '20s';
export type DetectionSensitivity = 'Low' | 'Medium' | 'High';

export interface PersistentSoundSettings {
  detectionSensitivity: DetectionSensitivity;
  keepEventsVisibleDuration: MapFadeDuration;
  showConfidence: boolean;
  showSoundIntensity: boolean;
  hapticAlertsEnabled: boolean;
}

export const DEFAULT_PERSISTENT_SOUND_SETTINGS: PersistentSoundSettings = {
  detectionSensitivity: 'Medium',
  keepEventsVisibleDuration: '10s',
  showConfidence: true,
  showSoundIntensity: true,
  hapticAlertsEnabled: true,
};

export function mapFadeDurationMs(duration: MapFadeDuration): number {
  return Number.parseInt(duration, 10) * 1000;
}

interface SettingsKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export function normalizePersistentSoundSettings(value: unknown): PersistentSoundSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_PERSISTENT_SOUND_SETTINGS;
  }

  const candidate = value as Partial<PersistentSoundSettings>;
  const duration = candidate.keepEventsVisibleDuration;
  const sensitivity = candidate.detectionSensitivity;
  return {
    detectionSensitivity:
      sensitivity === 'Low' || sensitivity === 'Medium' || sensitivity === 'High'
        ? sensitivity
        : DEFAULT_PERSISTENT_SOUND_SETTINGS.detectionSensitivity,
    keepEventsVisibleDuration:
      duration === '5s' || duration === '10s' || duration === '20s'
        ? duration
        : DEFAULT_PERSISTENT_SOUND_SETTINGS.keepEventsVisibleDuration,
    showConfidence:
      typeof candidate.showConfidence === 'boolean'
        ? candidate.showConfidence
        : DEFAULT_PERSISTENT_SOUND_SETTINGS.showConfidence,
    showSoundIntensity:
      typeof candidate.showSoundIntensity === 'boolean'
        ? candidate.showSoundIntensity
        : DEFAULT_PERSISTENT_SOUND_SETTINGS.showSoundIntensity,
    hapticAlertsEnabled:
      typeof candidate.hapticAlertsEnabled === 'boolean'
        ? candidate.hapticAlertsEnabled
        : DEFAULT_PERSISTENT_SOUND_SETTINGS.hapticAlertsEnabled,
  };
}

export class SoundSettingsStorage {
  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(private readonly storage: SettingsKeyValueStorage) {}

  public async load(): Promise<PersistentSoundSettings> {
    try {
      const serialized = await this.storage.getItem(SOUND_SETTINGS_STORAGE_KEY);
      if (serialized === null) return DEFAULT_PERSISTENT_SOUND_SETTINGS;
      return normalizePersistentSoundSettings(JSON.parse(serialized));
    } catch (error) {
      console.warn('Unable to restore SoundSight settings; using safe defaults.', error);
      return DEFAULT_PERSISTENT_SOUND_SETTINGS;
    }
  }

  public async save(settings: PersistentSoundSettings): Promise<void> {
    const serialized = JSON.stringify(normalizePersistentSoundSettings(settings));
    this.writeQueue = this.writeQueue
      .catch(() => undefined)
      .then(() => this.storage.setItem(SOUND_SETTINGS_STORAGE_KEY, serialized));
    try {
      await this.writeQueue;
    } catch (error) {
      console.warn('Unable to persist SoundSight settings.', error);
    }
  }
}
