import type {
  SoundEvent,
  SoundType,
  SoundDirection,
  SoundPriority,
  SoundCategory,
} from '../types/sound';
import { supportedSound } from './supportedSoundCatalog';

export interface DemoScenarioDefinition {
  id: string;
  soundType: SoundType;
  label: string;
  direction: SoundDirection;
  angle: number;
  confidence: number; // 0.0 to 1.0
  intensity: number; // 0.0 to 1.0
  decibels: number;
  distanceMeters: number;
  priority: SoundPriority;
  category: SoundCategory;
  iconName: string;
  description: string;
  frequencyHz: number;
  waveContours: number[];
}

/**
 * 7 Prototype Demo Scenarios
 * Centralized in soundEventService so UI components don't hardcode event structures.
 */
export const DEMO_SCENARIO_DEFINITIONS: DemoScenarioDefinition[] = [
  {
    id: 'demo-knock-left',
    soundType: 'door_knock',
    label: 'Door Knock — Left',
    direction: 'left',
    angle: 270,
    confidence: 0.94,
    intensity: 0.76,
    decibels: 76,
    distanceMeters: 2.3,
    priority: 'normal',
    category: 'household',
    iconName: 'DoorClosed',
    description: 'Rhythmic wooden knock detected on the left entrance.',
    frequencyHz: 450,
    waveContours: [75, 95, 85, 70, 45],
  },
  {
    id: 'demo-knock-right',
    soundType: 'door_knock',
    label: 'Door Knock — Right',
    direction: 'right',
    angle: 90,
    confidence: 0.96,
    intensity: 0.82,
    decibels: 78,
    distanceMeters: 2.1,
    priority: 'normal',
    category: 'household',
    iconName: 'DoorClosed',
    description: 'Rhythmic wooden knock detected on the right entryway.',
    frequencyHz: 450,
    waveContours: [80, 100, 90, 75, 45],
  },
  {
    id: 'demo-doorbell-front',
    soundType: 'doorbell',
    label: 'Doorbell — Front',
    direction: 'front',
    angle: 0,
    confidence: 0.87,
    intensity: 0.72,
    decibels: 72,
    distanceMeters: 3.2,
    priority: 'normal',
    category: 'household',
    iconName: 'Bell',
    description: 'Front entrance chime ringing clearly.',
    frequencyHz: 1200,
    waveContours: [65, 85, 95, 80, 55],
  },
  {
    id: 'demo-name-called-left',
    soundType: 'name_called',
    label: 'Name Called — Left',
    direction: 'left',
    angle: 280,
    confidence: 0.91,
    intensity: 0.68,
    decibels: 68,
    distanceMeters: 1.8,
    priority: 'info',
    category: 'speech',
    iconName: 'Volume2',
    description: 'Recognized speech calling your name from the left.',
    frequencyHz: 320,
    waveContours: [50, 70, 85, 65, 40],
  },
  {
    id: 'demo-appliance-back',
    soundType: 'appliance_beep',
    label: 'Appliance Beep — Back',
    direction: 'back',
    angle: 180,
    confidence: 0.76,
    intensity: 0.62,
    decibels: 62,
    distanceMeters: 4.5,
    priority: 'info',
    category: 'household',
    iconName: 'Microwave',
    description: 'Cycle completion chime from kitchen appliance behind you.',
    frequencyHz: 2400,
    waveContours: [40, 60, 75, 50, 30],
  },
  {
    id: 'demo-dog-bark-right',
    soundType: 'dog_bark',
    label: 'Dog Bark — Right',
    direction: 'right',
    angle: 80,
    confidence: 0.82,
    intensity: 0.76,
    decibels: 76,
    distanceMeters: 5.4,
    priority: 'normal',
    category: 'household',
    iconName: 'ShieldAlert',
    description: 'Audible canine barking detected in right vicinity.',
    frequencyHz: 750,
    waveContours: [60, 80, 95, 70, 45],
  },
  {
    id: 'demo-alarm-front',
    soundType: 'alarm',
    label: 'Alarm — Front',
    direction: 'front',
    angle: 0,
    confidence: 0.98,
    intensity: 0.94,
    decibels: 94,
    distanceMeters: 4.8,
    priority: 'critical',
    category: 'safety',
    iconName: 'Flame',
    description: 'High-intensity pulsing emergency safety alarm in front.',
    frequencyHz: 3100,
    waveContours: [90, 110, 120, 100, 80],
  },
];

type SoundEventListener = (event: SoundEvent) => void;

class SoundEventService {
  private listeners: Set<SoundEventListener> = new Set();

  /**
   * Subscribe to incoming sound events from any source (Demo Mode or Future Real Mic AI Engine)
   */
  public subscribe(listener: SoundEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit a new sound event to all subscribers
   */
  public emit(event: SoundEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in SoundEvent subscriber:', err);
      }
    });
  }

  /**
   * Factory function to create a standardized SoundEvent
   */
  public createSoundEvent(params: {
    soundType: SoundType;
    label?: string;
    direction?: SoundDirection;
    confidence?: number;
    intensity?: number;
    priority?: SoundPriority;
    angle?: number;
    decibels?: number;
    soundLevelDbfs?: number;
    loudness?: 'quiet' | 'moderate' | 'loud';
    distanceMeters?: number;
    category?: SoundCategory;
    iconName?: string;
    description?: string;
    frequencyHz?: number;
    waveContours?: number[];
  }): SoundEvent {
    const id = `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const soundType = params.soundType;
    const direction = params.direction || 'front';
    const angle = params.angle ?? this.directionToAngle(direction);
    const confidence = Math.min(1.0, Math.max(0.0, params.confidence ?? 0.85));
    const intensity = Math.min(1.0, Math.max(0.0, params.intensity ?? 0.75));
    const priority = params.priority || this.getSoundTypeDefaultPriority(soundType);
    const category = params.category || this.getSoundTypeCategory(soundType);
    const iconName = params.iconName || this.getSoundTypeIcon(soundType);
    const label = params.label || this.getSoundTypeLabel(soundType);

    const event: SoundEvent = {
      id,
      soundType,
      label,
      direction,
      confidence,
      intensity,
      priority,
      timestamp: Date.now(),
      isActive: true,
      angle,
      timeAgo: 'Just now',
      category,
      iconName,
      description: params.description || `Detected ${label.toLowerCase()} in your surroundings.`,
    };
    if (params.soundLevelDbfs !== undefined) event.soundLevelDbfs = params.soundLevelDbfs;
    if (params.loudness !== undefined) event.loudness = params.loudness;
    if (params.decibels !== undefined) event.decibels = params.decibels;
    if (params.distanceMeters !== undefined) event.distanceMeters = params.distanceMeters;
    if (params.frequencyHz !== undefined) event.frequencyHz = params.frequencyHz;
    if (params.waveContours !== undefined) event.waveContours = params.waveContours;

    return event;
  }

  /**
   * Create a SoundEvent from a Demo Scenario definition
   */
  public createDemoSoundEvent(scenarioId: string): SoundEvent {
    const scenario =
      DEMO_SCENARIO_DEFINITIONS.find((s) => s.id === scenarioId) ||
      DEMO_SCENARIO_DEFINITIONS[0];

    const event = this.createSoundEvent({
      soundType: scenario.soundType,
      label: scenario.label.replace(/ — (Left|Right|Front|Back)/, ''),
      direction: scenario.direction,
      confidence: scenario.confidence,
      intensity: scenario.intensity,
      priority: scenario.priority,
      angle: scenario.angle,
      decibels: scenario.decibels,
      distanceMeters: scenario.distanceMeters,
      category: scenario.category,
      iconName: scenario.iconName,
      description: scenario.description,
      frequencyHz: scenario.frequencyHz,
      waveContours: scenario.waveContours,
    });

    return event;
  }

  public getDemoScenarios(): DemoScenarioDefinition[] {
    return DEMO_SCENARIO_DEFINITIONS;
  }

  public directionToAngle(dir: SoundDirection): number {
    switch (dir) {
      case 'front':
        return 0;
      case 'front_right':
        return 45;
      case 'right':
        return 90;
      case 'back_right':
        return 135;
      case 'back':
        return 180;
      case 'back_left':
        return 225;
      case 'left':
        return 270;
      case 'front_left':
        return 315;
      default:
        return 0;
    }
  }

  public angleToDirection(angle: number): SoundDirection {
    const normalized = ((angle % 360) + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return 'front';
    if (normalized >= 22.5 && normalized < 67.5) return 'front_right';
    if (normalized >= 67.5 && normalized < 112.5) return 'right';
    if (normalized >= 112.5 && normalized < 157.5) return 'back_right';
    if (normalized >= 157.5 && normalized < 202.5) return 'back';
    if (normalized >= 202.5 && normalized < 247.5) return 'back_left';
    if (normalized >= 247.5 && normalized < 292.5) return 'left';
    return 'front_left';
  }

  public getSoundTypeCategory(type: SoundType): SoundCategory {
    return supportedSound(type)?.category ?? 'household';
  }

  public getSoundTypeDefaultPriority(type: SoundType): SoundPriority {
    return supportedSound(type)?.priority ?? 'info';
  }

  public getSoundTypeIcon(type: SoundType): string {
    return supportedSound(type)?.iconName ?? 'AlertCircle';
  }

  public getSoundTypeLabel(type: SoundType): string {
    return supportedSound(type)?.label ?? 'Environmental Sound';
  }
}

export const soundEventService = new SoundEventService();
