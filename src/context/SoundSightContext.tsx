import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  SoundEvent,
  SoundCategory,
  SoundPriority,
  AlertTrigger,
  CustomSoundRecording,
  AppSettings,
  ImportantSoundSetting,
} from '@/types/sound';
import {
  soundEventService,
  type DemoScenarioDefinition,
  DEMO_SCENARIO_DEFINITIONS,
} from '@/services/soundEventService';
import {
  liveSoundEventService,
  type LiveSoundConnectionState,
} from '@/services/liveSoundEventService';
import {
  mergeSoundHistory,
  SoundHistoryStorage,
} from '@/services/soundHistoryStorage';
import { acceptUniqueEventId, hapticActionForPriority } from '@/services/eventAlertPolicy';
import { TranscriptStorage, normalizeTranscripts } from '@/services/transcriptStorage';
import type { TranscriptSegment, TranscriptionStatus } from '@/types/transcript';
import { createDemoSoundEvents, createDemoTranscripts, isDemoRecordId } from '@/services/demoData';
import { clientAudioStream } from '@/services/audio/audioStream';
import {
  DEFAULT_PERSISTENT_SOUND_SETTINGS,
  mapFadeDurationMs,
  SoundSettingsStorage,
} from '@/services/soundSettingsStorage';

export interface SoundSightContextType {
  operatingMode: 'live' | 'demo';
  liveConnectionState: LiveSoundConnectionState;
  isLiveListening: boolean;
  setIsLiveListening: (val: boolean) => void;
  micPermissionDenied: boolean;
  setMicPermissionDenied: (val: boolean) => void;
  activeSounds: SoundEvent[];
  selectedSound: SoundEvent | null;
  setSelectedSound: (sound: SoundEvent | null) => void;
  soundHistory: SoundEvent[];
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  activeCategoryFilter: SoundCategory | 'all';
  setActiveCategoryFilter: (cat: SoundCategory | 'all') => void;
  alertTriggers: AlertTrigger[];
  toggleAlertTrigger: (id: string) => void;
  updateAlertTrigger: (id: string, updates: Partial<AlertTrigger>) => void;
  importantSounds: ImportantSoundSetting[];
  toggleImportantSound: (id: string) => void;
  alertPriority: 'high' | 'normal' | 'muted';
  setAlertPriority: (priority: 'high' | 'normal' | 'muted') => void;
  onlyImportantAlerts: boolean;
  setOnlyImportantAlerts: (val: boolean) => void;
  visualAlertsEnabled: boolean;
  setVisualAlertsEnabled: (val: boolean) => void;
  hapticAlertsEnabled: boolean;
  setHapticAlertsEnabled: (val: boolean) => void;
  spokenAlertsEnabled: boolean;
  setSpokenAlertsEnabled: (val: boolean) => void;
  customSounds: CustomSoundRecording[];
  addCustomSound: (sound: Omit<CustomSoundRecording, 'id' | 'recordedAt'>) => void;
  deleteCustomSound: (id: string) => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  detectionSensitivity: 'Low' | 'Medium' | 'High';
  setDetectionSensitivity: (val: 'Low' | 'Medium' | 'High') => void;
  showConfidence: boolean;
  setShowConfidence: (val: boolean) => void;
  showSoundIntensity: boolean;
  setShowSoundIntensity: (val: boolean) => void;
  keepEventsVisibleDuration: '5s' | '10s' | '20s';
  setKeepEventsVisibleDuration: (val: '5s' | '10s' | '20s') => void;
  rawAudioStorageEnabled: boolean;
  setRawAudioStorageEnabled: (val: boolean) => void;
  ingestSoundEvent: (event: SoundEvent) => void;
  triggerSoundEvent: (params: Parameters<typeof soundEventService.createSoundEvent>[0]) => void;
  triggerScenario: (scenario: DemoScenarioDefinition) => void;
  isStrobeActive: boolean;
  dismissStrobe: () => void;
  currentDecibelLevel: number;
  lastTriggeredSoundId: string | null;
  demoScenarios: DemoScenarioDefinition[];
  testHaptic: () => void;
  productMode: 'awareness' | 'conversation';
  setProductMode: (mode: 'awareness' | 'conversation') => void;
  transcripts: TranscriptSegment[];
  transcriptionStatus: TranscriptionStatus;
  conversationPaused: boolean;
  setConversationPaused: (paused: boolean) => void;
  clearTranscripts: () => void;
  demoModeEnabled: boolean;
  loadDemoData: () => void;
  clearDemoData: () => void;
  feedbackMessage: string | null;
  showFeedback: (message: string) => void;
  enableClientMicrophone: () => Promise<boolean>;
}

const INITIAL_SETTINGS: AppSettings = {
  audioSensitivity: 85,
  micGainCalibration: 0,
  compassTracking: true,
  compassOffsetDeg: 0,
  highContrastMode: false,
  contourDensity: 'high',
  textSizeScale: 'normal',
  hapticIntensity: 'strong',
  flashScreenOnCritical: false,
  keepScreenAwake: true,
};

const INITIAL_IMPORTANT_SOUNDS: ImportantSoundSetting[] = [
  { id: 'imp-knock', soundType: 'door_knock', name: 'Door Knock', category: 'household', enabled: true, iconName: 'DoorClosed' },
  { id: 'imp-doorbell', soundType: 'doorbell', name: 'Doorbell', category: 'household', enabled: true, iconName: 'Bell' },
  { id: 'imp-name', soundType: 'name_called', name: 'Name Called', category: 'speech', enabled: true, iconName: 'Volume2' },
  { id: 'imp-alarm', soundType: 'alarm', name: 'Alarm', category: 'safety', enabled: true, iconName: 'Flame' },
  { id: 'imp-appliance', soundType: 'appliance_beep', name: 'Appliance Beep', category: 'household', enabled: true, iconName: 'Microwave' },
  { id: 'imp-dog', soundType: 'dog_bark', name: 'Dog Bark', category: 'household', enabled: true, iconName: 'ShieldAlert' },
  { id: 'imp-baby', soundType: 'baby_crying', name: 'Baby Crying', category: 'speech', enabled: true, iconName: 'Baby' },
];

const SoundSightContext = createContext<SoundSightContextType | null>(null);
const soundHistoryStorage = new SoundHistoryStorage(AsyncStorage);
const soundSettingsStorage = new SoundSettingsStorage(AsyncStorage);
const transcriptStorage = new TranscriptStorage(AsyncStorage);
const MAX_HANDLED_EVENT_IDS = 256;
// Normal operation starts empty. Part 3 owns any future explicit demo seeding behavior.
const shouldSeedDemoData = () => false;

export const SoundSightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liveConnectionState, setLiveConnectionState] = useState<LiveSoundConnectionState>(
    liveSoundEventService.getConnectionState()
  );
  const [isLiveListening, setIsLiveListening] = useState<boolean>(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<SoundCategory | 'all'>('all');
  const [selectedSound, setSelectedSound] = useState<SoundEvent | null>(null);
  const [isStrobeActive, setIsStrobeActive] = useState<boolean>(false);
  const [currentDecibelLevel, setCurrentDecibelLevel] = useState<number>(54);
  const [lastTriggeredSoundId, setLastTriggeredSoundId] = useState<string | null>('event-door-knock');

  // Persistent Configuration States
  const [detectionSensitivity, setDetectionSensitivity] = useState<'Low' | 'Medium' | 'High'>(DEFAULT_PERSISTENT_SOUND_SETTINGS.detectionSensitivity);
  const [showConfidence, setShowConfidence] = useState<boolean>(DEFAULT_PERSISTENT_SOUND_SETTINGS.showConfidence);
  const [showSoundIntensity, setShowSoundIntensity] = useState<boolean>(DEFAULT_PERSISTENT_SOUND_SETTINGS.showSoundIntensity);
  const [keepEventsVisibleDuration, setKeepEventsVisibleDuration] = useState<'5s' | '10s' | '20s'>(DEFAULT_PERSISTENT_SOUND_SETTINGS.keepEventsVisibleDuration);
  const [visualAlertsEnabled, setVisualAlertsEnabled] = useState<boolean>(true);
  const [hapticAlertsEnabled, setHapticAlertsEnabled] = useState<boolean>(DEFAULT_PERSISTENT_SOUND_SETTINGS.hapticAlertsEnabled);
  const [spokenAlertsEnabled, setSpokenAlertsEnabled] = useState<boolean>(false);
  const [rawAudioStorageEnabled, setRawAudioStorageEnabled] = useState<boolean>(false);
  const [alertPriority, setAlertPriority] = useState<'high' | 'normal' | 'muted'>('normal');
  const [onlyImportantAlerts, setOnlyImportantAlerts] = useState<boolean>(false);
  const [importantSounds, setImportantSounds] = useState<ImportantSoundSetting[]>(INITIAL_IMPORTANT_SOUNDS);

  const [alertTriggers, setAlertTriggers] = useState<AlertTrigger[]>([]);
  const [customSounds, setCustomSounds] = useState<CustomSoundRecording[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  // Initial active sound events
  const [activeSounds, setActiveSounds] = useState<SoundEvent[]>(shouldSeedDemoData() ? [
    {
      id: 'event-door-knock',
      soundType: 'door_knock',
      label: 'Door Knock',
      direction: 'right',
      angle: 90,
      confidence: 0.96,
      intensity: 0.82,
      decibels: 78,
      distanceMeters: 2.1,
      priority: 'normal',
      timestamp: Date.now() - 2000,
      isActive: true,
      timeAgo: '2s ago',
      category: 'household',
      iconName: 'DoorClosed',
      description: 'Rhythmic wooden knock detected on the right entrance.',
      frequencyHz: 450,
      waveContours: [80, 100, 90, 75, 45],
    },
    {
      id: 'event-doorbell',
      soundType: 'doorbell',
      label: 'Doorbell',
      direction: 'front',
      angle: 0,
      confidence: 0.87,
      intensity: 0.72,
      decibels: 72,
      distanceMeters: 3.2,
      priority: 'normal',
      timestamp: Date.now() - 8000,
      isActive: true,
      timeAgo: '8s ago',
      category: 'household',
      iconName: 'Bell',
      description: 'Front entryway digital chime ringing.',
      frequencyHz: 1200,
      waveContours: [65, 85, 95, 80, 55],
    },
    {
      id: 'event-name-called',
      soundType: 'name_called',
      label: 'Name Called',
      direction: 'left',
      angle: 270,
      confidence: 0.91,
      intensity: 0.68,
      decibels: 68,
      distanceMeters: 1.8,
      priority: 'info',
      timestamp: Date.now() - 14000,
      isActive: true,
      timeAgo: '14s ago',
      category: 'speech',
      iconName: 'Volume2',
      description: 'Human voice calling user attention from the left.',
      frequencyHz: 320,
      waveContours: [50, 70, 85, 65, 40],
    },
    {
      id: 'event-appliance',
      soundType: 'appliance_beep',
      label: 'Appliance Beep',
      direction: 'back',
      angle: 180,
      confidence: 0.76,
      intensity: 0.62,
      decibels: 62,
      distanceMeters: 4.5,
      priority: 'info',
      timestamp: Date.now() - 21000,
      isActive: true,
      timeAgo: '21s ago',
      category: 'household',
      iconName: 'Microwave',
      description: 'High-pitch cycle completion beep from kitchen.',
      frequencyHz: 2400,
      waveContours: [40, 60, 75, 50, 30],
    },
  ] : []);

  // Initial history log
  const [soundHistory, setSoundHistory] = useState<SoundEvent[]>(shouldSeedDemoData() ? [
    {
      id: 'hist-1',
      soundType: 'door_knock',
      label: 'Door Knock',
      direction: 'right',
      angle: 90,
      confidence: 0.96,
      intensity: 0.82,
      decibels: 78,
      distanceMeters: 2.1,
      priority: 'normal',
      timestamp: Date.now() - 2000,
      isActive: false,
      timeAgo: '2s ago',
      category: 'household',
      iconName: 'DoorClosed',
      description: 'Rhythmic wooden knock detected on right entrance.',
      frequencyHz: 450,
    },
    {
      id: 'hist-2',
      soundType: 'doorbell',
      label: 'Doorbell',
      direction: 'front',
      angle: 0,
      confidence: 0.87,
      intensity: 0.72,
      decibels: 72,
      distanceMeters: 3.2,
      priority: 'normal',
      timestamp: Date.now() - 8000,
      isActive: false,
      timeAgo: '8s ago',
      category: 'household',
      iconName: 'Bell',
      description: 'Front entryway digital chime ringing.',
      frequencyHz: 1200,
    },
    {
      id: 'hist-3',
      soundType: 'name_called',
      label: 'Voice',
      direction: 'left',
      angle: 270,
      confidence: 0.64,
      intensity: 0.68,
      decibels: 68,
      distanceMeters: 1.8,
      priority: 'info',
      timestamp: Date.now() - 14000,
      isActive: false,
      timeAgo: '14s ago',
      category: 'speech',
      iconName: 'Volume2',
      description: 'Human voice calling user attention from the left.',
      frequencyHz: 320,
    },
    {
      id: 'hist-4',
      soundType: 'appliance_beep',
      label: 'Appliance Beep',
      direction: 'back',
      angle: 180,
      confidence: 0.52,
      intensity: 0.62,
      decibels: 62,
      distanceMeters: 4.5,
      priority: 'info',
      timestamp: Date.now() - 60000,
      isActive: false,
      timeAgo: '1m ago',
      category: 'household',
      iconName: 'Microwave',
      description: 'High-pitch cycle completion beep from kitchen.',
      frequencyHz: 2400,
    },
    {
      id: 'hist-5',
      soundType: 'dog_bark',
      label: 'Dog Bark',
      direction: 'right',
      angle: 80,
      confidence: 0.72,
      intensity: 0.76,
      decibels: 76,
      distanceMeters: 5.4,
      priority: 'normal',
      timestamp: Date.now() - 180000,
      isActive: false,
      timeAgo: '3m ago',
      category: 'household',
      iconName: 'ShieldAlert',
      description: 'Audible canine barking detected in right vicinity.',
      frequencyHz: 750,
    },
    {
      id: 'hist-6',
      soundType: 'car_horn',
      label: 'Car Approaching',
      direction: 'left',
      angle: 270,
      confidence: 0.68,
      intensity: 0.7,
      decibels: 74,
      distanceMeters: 6.2,
      priority: 'normal',
      timestamp: Date.now() - 300000,
      isActive: false,
      timeAgo: '5m ago',
      category: 'outdoor',
      iconName: 'Car',
      description: 'Approaching vehicle detected from the left.',
      frequencyHz: 680,
    },
  ] : []);
  const historyRestored = useRef(false);
  const pendingHistoryEvents = useRef<SoundEvent[]>([]);
  const pendingHistoryDeletions = useRef(new Set<string>());
  const historyClearedDuringRestore = useRef(false);
  const handledEventIds = useRef(new Set<string>());
  const handledEventOrder = useRef<string[]>([]);
  const settingsRestored = useRef(false);
  const [productMode, setProductMode] = useState<'awareness' | 'conversation'>('awareness');
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [transcriptionStatus, setTranscriptionStatus] = useState<TranscriptionStatus>('offline');
  const [conversationPaused, setConversationPaused] = useState(false);
  const [operatingMode, setOperatingMode] = useState<'live' | 'demo'>('live');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [clientMicrophoneEnabled, setClientMicrophoneEnabled] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFeedback = useCallback((message: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedbackMessage(message);
    feedbackTimer.current = setTimeout(() => setFeedbackMessage(null), 2400);
  }, []);
  const enableClientMicrophone = useCallback(async () => {
    try {
      await clientAudioStream.start();
      setClientMicrophoneEnabled(true);
      if (liveConnectionState !== 'connected') await clientAudioStream.stop();
      setMicPermissionDenied(false);
      showFeedback('Microphone ready. Live audio will stream when AI connects.');
      return true;
    } catch (error) {
      setMicPermissionDenied(true);
      showFeedback(error instanceof Error ? error.message : 'Microphone access is unavailable.');
      return false;
    }
  }, [showFeedback, liveConnectionState]);
  const transcriptsRestored = useRef(false);
  const transcriptsClearedDuringRestore = useRef(false);

  useEffect(() => { void transcriptStorage.load().then((stored) => { setTranscripts((current) => { const restored = transcriptsClearedDuringRestore.current ? [] : normalizeTranscripts([...stored, ...current]); void transcriptStorage.save(restored); return restored; }); transcriptsRestored.current = true; }); }, []);
  useEffect(() => liveSoundEventService.subscribeTranscripts((segment) => {
    setTranscripts((current) => { const next = normalizeTranscripts([...current.filter((item) => item.id !== segment.id), segment]); if (segment.isFinal) void transcriptStorage.save(next); return next; });
  }), []);
  useEffect(() => liveSoundEventService.subscribeTranscriptionStatus(setTranscriptionStatus), []);
  useEffect(() => { liveSoundEventService.setConversationMode(productMode === 'conversation', conversationPaused); if (productMode !== 'conversation') setConversationPaused(false); }, [productMode, conversationPaused]);

  const clearTranscripts = useCallback(() => { if (!transcriptsRestored.current) transcriptsClearedDuringRestore.current = true; setTranscripts([]); void transcriptStorage.clear(); showFeedback('Conversation transcripts cleared.'); }, [showFeedback]);

  const clearDemoData = useCallback(() => {
    setOperatingMode('live');
    setIsLiveListening(true);
    setActiveSounds((current) => current.filter((event) => !isDemoRecordId(event.id)));
    setSoundHistory((current) => current.filter((event) => !isDemoRecordId(event.id)));
    setTranscripts((current) => current.filter((segment) => !isDemoRecordId(segment.id)));
    setSelectedSound((current) => current && isDemoRecordId(current.id) ? null : current);
    liveSoundEventService.start();
    showFeedback('Demo data cleared. Live mode restored.');
  }, [showFeedback]);

  const loadDemoData = useCallback(() => {
    const demoEvents = createDemoSoundEvents();
    const demoTranscripts = createDemoTranscripts();
    setOperatingMode('demo');
    setIsLiveListening(false);
    liveSoundEventService.stop();
    void clientAudioStream.stop();
    setSoundHistory((current) => mergeSoundHistory(demoEvents, current));
    setActiveSounds((current) => [
      ...demoEvents.filter((event) => event.isActive),
      ...current.filter((event) => !isDemoRecordId(event.id)),
    ].slice(0, 4));
    setTranscripts((current) => normalizeTranscripts([...current, ...demoTranscripts]));
    showFeedback('Demo data loaded.');
  }, [showFeedback]);

  useEffect(() => {
    if (!clientMicrophoneEnabled) return;
    if (operatingMode === 'live' && isLiveListening && liveConnectionState === 'connected') {
      void clientAudioStream.start().catch(() => showFeedback('Microphone stream could not resume.'));
    } else {
      void clientAudioStream.stop();
    }
  }, [clientMicrophoneEnabled, operatingMode, isLiveListening, liveConnectionState, showFeedback]);

  useEffect(() => {
    let cancelled = false;
    void soundSettingsStorage.load().then((savedSettings) => {
      if (cancelled) return;
      setKeepEventsVisibleDuration(savedSettings.keepEventsVisibleDuration);
      setDetectionSensitivity(savedSettings.detectionSensitivity);
      setShowConfidence(savedSettings.showConfidence);
      setShowSoundIntensity(savedSettings.showSoundIntensity);
      setHapticAlertsEnabled(savedSettings.hapticAlertsEnabled);
      settingsRestored.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settingsRestored.current) return;
    void soundSettingsStorage.save({
      detectionSensitivity,
      keepEventsVisibleDuration,
      showConfidence,
      showSoundIntensity,
      hapticAlertsEnabled,
    });
  }, [detectionSensitivity, keepEventsVisibleDuration, showConfidence, showSoundIntensity, hapticAlertsEnabled]);

  useEffect(() => {
    // This stores the desired value in the existing socket service even while
    // offline. The service applies it immediately when connected and on every reconnect.
    liveSoundEventService.setDetectionSensitivity(detectionSensitivity);
  }, [detectionSensitivity]);

  // Restore once without allowing the initial sample state to overwrite disk.
  // Events arriving during the async read are merged afterward instead of lost.
  useEffect(() => {
    let cancelled = false;
    void soundHistoryStorage.load().then((storedHistory) => {
      if (cancelled) return;
      setSoundHistory((currentHistory) => {
        const baseHistory = historyClearedDuringRestore.current
          ? []
          : storedHistory ?? currentHistory;
        const restoredHistory = mergeSoundHistory(pendingHistoryEvents.current, baseHistory).filter(
          (event) => !pendingHistoryDeletions.current.has(event.id)
        );
        const rememberedIds = restoredHistory
          .slice(0, MAX_HANDLED_EVENT_IDS)
          .map((event) => event.id);
        handledEventOrder.current = rememberedIds;
        handledEventIds.current = new Set(rememberedIds);
        return restoredHistory;
      });
      historyRestored.current = true;
      pendingHistoryEvents.current = [];
      pendingHistoryDeletions.current.clear();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!historyRestored.current) return;
    void soundHistoryStorage.save(soundHistory);
  }, [soundHistory]);

  // Haptics handler
  const triggerHaptic = useCallback(
    async (priority: SoundPriority) => {
      const action = hapticActionForPriority(priority, {
        enabled: hapticAlertsEnabled,
        muted: alertPriority === 'muted',
        isWeb: Platform.OS === 'web',
      });
      if (action === 'none') return;
      try {
        if (action === 'notification-warning') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
      } catch {
        // Safe fallback
      }
    },
    [hapticAlertsEnabled, alertPriority]
  );

  const testHaptic = useCallback(() => {
    if (!hapticAlertsEnabled) { showFeedback('Enable Haptic Feedback to test vibration.'); return; }
    if (Platform.OS === 'web') { showFeedback('Haptics are unavailable in web browsers.'); return; }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      .then(() => showFeedback('Test haptic sent.'))
      .catch(() => showFeedback('Haptics are unavailable on this device.'));
  }, [hapticAlertsEnabled, showFeedback]);

  /**
   * Centralized sound event ingestion
   * All sources (real microphone AI or Demo simulation) pass their SoundEvent here.
   */
  const ingestSoundEvent = useCallback(
    (event: SoundEvent) => {
      if (operatingMode === 'live' && !isLiveListening) return;
      // One stabilized event ID may arrive more than once after transport
      // reconnects. Suppress every downstream side effect, including haptics.
      if (!acceptUniqueEventId(
        event.id,
        handledEventIds.current,
        handledEventOrder.current,
        MAX_HANDLED_EVENT_IDS
      )) return;

      setLastTriggeredSoundId(event.id);

      // Active radar sounds: replace sound at the same direction or keep 4 active
      setActiveSounds((prev) => {
        const remaining = prev.filter((s) => s.direction !== event.direction);
        return [event, ...remaining].slice(0, 4);
      });

      // Automatically prepends to Recent Sounds / history
      if (!historyRestored.current) {
        pendingHistoryEvents.current = mergeSoundHistory(
          [event],
          pendingHistoryEvents.current
        );
      }
      setSoundHistory((prev) => mergeSoundHistory([event], prev));

      // Update decibel meter
      if (event.decibels) {
        setCurrentDecibelLevel(event.decibels);
      }

      // Trigger tactile haptic pulse
      triggerHaptic(event.priority);

      // If visual alerts enabled and critical
      if (visualAlertsEnabled && event.priority === 'critical') {
        setIsStrobeActive(true);
      }
    },
    [triggerHaptic, visualAlertsEnabled, operatingMode, isLiveListening]
  );

  // Subscribe context to soundEventService
  useEffect(() => {
    const unsubscribe = soundEventService.subscribe((event) => {
      ingestSoundEvent(event);
    });
    return unsubscribe;
  }, [ingestSoundEvent]);

  // One shared live AI source and one state subscription. Demo Mode continues
  // to publish through the same event service when the engine is unavailable.
  useEffect(() => {
    const unsubscribeConnectionState = liveSoundEventService.subscribeConnectionState(
      setLiveConnectionState
    );
    liveSoundEventService.start();
    return () => {
      unsubscribeConnectionState();
      liveSoundEventService.stop();
    };
  }, []);

  // Helper to trigger custom sound events
  const triggerSoundEvent = useCallback(
    (params: Parameters<typeof soundEventService.createSoundEvent>[0]) => {
      const event = soundEventService.createSoundEvent(params);
      soundEventService.emit(event);
    },
    []
  );

  // Helper to trigger demo scenarios
  const triggerScenario = useCallback((scenario: DemoScenarioDefinition) => {
    const event = soundEventService.createDemoSoundEvent(scenario.id);
    soundEventService.emit(event);
  }, []);

  // One shared ticker updates labels and expires map visuals without touching History or Alerts.
  useEffect(() => {
    const visibleDurationMs = mapFadeDurationMs(keepEventsVisibleDuration);
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveSounds((prev) =>
        prev.filter((sound) => now - sound.timestamp < visibleDurationMs).map((s) => {
          const diffMs = now - s.timestamp;
          const secs = Math.max(0, Math.floor(diffMs / 1000));
          let timeAgo = 'Just now';
          if (secs >= 60) {
            timeAgo = `${Math.floor(secs / 60)}m ago`;
          } else if (secs > 0) {
            timeAgo = `${secs}s ago`;
          }
          return { ...s, timeAgo };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [keepEventsVisibleDuration]);

  const clearHistory = useCallback(() => {
    if (!historyRestored.current) {
      historyClearedDuringRestore.current = true;
      pendingHistoryEvents.current = [];
      pendingHistoryDeletions.current.clear();
    }
    setSoundHistory([]);
    void soundHistoryStorage.clear();
    showFeedback('Sound history cleared.');
  }, [showFeedback]);

  const deleteHistoryItem = useCallback((id: string) => {
    if (!historyRestored.current) {
      pendingHistoryDeletions.current.add(id);
      pendingHistoryEvents.current = pendingHistoryEvents.current.filter(
        (event) => event.id !== id
      );
    }
    setSoundHistory((prev) => prev.filter((item) => item.id !== id));
    showFeedback('History occurrence deleted.');
  }, [showFeedback]);

  const toggleAlertTrigger = useCallback((id: string) => {
    setAlertTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  }, []);

  const updateAlertTrigger = useCallback((id: string, updates: Partial<AlertTrigger>) => {
    setAlertTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const toggleImportantSound = useCallback((id: string) => {
    setImportantSounds((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  }, []);

  const addCustomSound = useCallback((sound: Omit<CustomSoundRecording, 'id' | 'recordedAt'>) => {
    const newSound: CustomSoundRecording = {
      ...sound,
      id: `cs-${Date.now()}`,
      recordedAt: new Date().toISOString(),
    };
    setCustomSounds((prev) => [newSound, ...prev]);
  }, []);

  const deleteCustomSound = useCallback((id: string) => {
    setCustomSounds((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const dismissStrobe = useCallback(() => {
    setIsStrobeActive(false);
  }, []);

  const value = useMemo(
    () => ({
      liveConnectionState,
      isLiveListening,
      setIsLiveListening,
      micPermissionDenied,
      setMicPermissionDenied,
      activeSounds,
      selectedSound,
      setSelectedSound,
      soundHistory,
      clearHistory,
      deleteHistoryItem,
      activeCategoryFilter,
      setActiveCategoryFilter,
      alertTriggers,
      toggleAlertTrigger,
      updateAlertTrigger,
      importantSounds,
      toggleImportantSound,
      alertPriority,
      setAlertPriority,
      onlyImportantAlerts,
      setOnlyImportantAlerts,
      visualAlertsEnabled,
      setVisualAlertsEnabled,
      hapticAlertsEnabled,
      setHapticAlertsEnabled,
      spokenAlertsEnabled,
      setSpokenAlertsEnabled,
      customSounds,
      addCustomSound,
      deleteCustomSound,
      settings,
      updateSettings,
      detectionSensitivity,
      setDetectionSensitivity,
      showConfidence,
      setShowConfidence,
      showSoundIntensity,
      setShowSoundIntensity,
      keepEventsVisibleDuration,
      setKeepEventsVisibleDuration,
      rawAudioStorageEnabled,
      setRawAudioStorageEnabled,
      ingestSoundEvent,
      triggerSoundEvent,
      triggerScenario,
      isStrobeActive,
      dismissStrobe,
      currentDecibelLevel,
      lastTriggeredSoundId,
      demoScenarios: DEMO_SCENARIO_DEFINITIONS,
      testHaptic,
      productMode,
      setProductMode,
      transcripts,
      transcriptionStatus: liveConnectionState === 'connected' ? transcriptionStatus : 'offline',
      conversationPaused,
      setConversationPaused,
      clearTranscripts,
      operatingMode,
      demoModeEnabled: operatingMode === 'demo',
      loadDemoData,
      clearDemoData,
      feedbackMessage,
      showFeedback,
      enableClientMicrophone,
    }),
    [
      liveConnectionState,
      isLiveListening,
      micPermissionDenied,
      activeSounds,
      selectedSound,
      soundHistory,
      clearHistory,
      deleteHistoryItem,
      activeCategoryFilter,
      alertTriggers,
      toggleAlertTrigger,
      updateAlertTrigger,
      importantSounds,
      toggleImportantSound,
      alertPriority,
      onlyImportantAlerts,
      visualAlertsEnabled,
      hapticAlertsEnabled,
      spokenAlertsEnabled,
      customSounds,
      addCustomSound,
      deleteCustomSound,
      settings,
      updateSettings,
      detectionSensitivity,
      showConfidence,
      showSoundIntensity,
      keepEventsVisibleDuration,
      rawAudioStorageEnabled,
      ingestSoundEvent,
      triggerSoundEvent,
      triggerScenario,
      isStrobeActive,
      dismissStrobe,
      currentDecibelLevel,
      lastTriggeredSoundId,
      testHaptic,
      productMode,
      transcripts,
      transcriptionStatus,
      conversationPaused,
      clearTranscripts,
      operatingMode,
      loadDemoData,
      clearDemoData,
      feedbackMessage,
      showFeedback,
      enableClientMicrophone,
    ]
  );

  return <SoundSightContext.Provider value={value}>{children}</SoundSightContext.Provider>;
};

export const useSoundSight = () => {
  const context = useContext(SoundSightContext);
  if (!context) {
    throw new Error('useSoundSight must be used within a SoundSightProvider');
  }
  return context;
};
