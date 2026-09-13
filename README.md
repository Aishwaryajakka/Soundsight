# SoundSight

> **See where sound happens.**  
> An accessible, visual and haptic spatial environmental sound mapping application designed for deaf, hard of hearing, and situational awareness users.

---

## 🏔 Features

- **360° Spatial Radar Map**: Visualizes the direction, confidence, decibel intensity, and age decay of detected sounds around the user in real time.
- **Topographic Sound Waves**: Glacier-themed luminous topographic contour lobes that expand and pulse according to sound type and urgency.
- **Multimodal Alert System**: Customizable visual alert banners, peripheral strobe flashes, haptic vibration patterns, and spoken announcements.
- **Sound History & Timeline**: Filterable and searchable acoustic log with interactive activity graphs and CSV export.
- **Acoustic Detail Inspector**: In-depth modal with direction angle, dB level, category, and multi-band frequency contour analysis.
- **Demo Mode**: 7 built-in realistic acoustic scenarios (door knocks, doorbells, speech/name calling, appliance chimes, dog barks, emergency alarms) for instant simulation and testing.

---

## 🏗 Architecture & SoundEvent Data Flow

All sound detections (whether from Demo Mode or a future real on-device microphone + AI classifier) flow through a **single centralized event service**:

```
[ Demo Scenarios / Future Real Mic AI Engine ]
                    │
                    ▼
          soundEventService.emit()
                    │
                    ▼
          soundEventService.subscribe()
                    │
                    ▼
           SoundSightContext
          (stores activeSounds, soundHistory)
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
   Live Map      History      Alerts & Strobe
(Radar Canvas)  (Timeline)     (Haptics/Visual)
```

### Unified `SoundEvent` Schema (`src/types/sound.ts`)

```typescript
export interface SoundEvent {
  id: string;
  soundType: SoundType;        // e.g. 'door_knock', 'doorbell', 'alarm', etc.
  label: string;              // Human-readable title e.g. 'Door Knock'
  direction: SoundDirection;  // 'front' | 'right' | 'back' | 'left' | ...
  confidence: number;         // Normalized ratio 0.0 to 1.0 (e.g. 0.96)
  intensity: number;          // Acoustic amplitude ratio 0.0 to 1.0 (e.g. 0.82)
  priority: SoundPriority;    // 'critical' | 'high' | 'normal' | 'info'
  timestamp: number;          // Epoch milliseconds (Date.now())
  isActive: boolean;          // Active status

  // Spatial / Acoustic helpers
  angle?: number;             // 0 - 360 degrees (0 = front, 90 = right, ...)
  decibels?: number;          // e.g. 78 dB
  distanceMeters?: number;    // e.g. 2.1 m
  category?: SoundCategory;   // 'safety' | 'speech' | 'household' | 'outdoor'
  iconName?: string;
  description?: string;
  waveContours?: number[];
}
```

---

## 🚀 Integrating Real-Time Microphone AI Detection

To connect an on-device machine learning acoustic classifier (e.g. YAMNet, AudioSpectrogram, CoreML / TFLite / ONNX):

1. Initialize your audio stream and classifier in a background service or hook.
2. When a sound is classified, construct and emit a `SoundEvent`:
   ```typescript
   import { soundEventService } from '@/services/soundEventService';

   // Inside your audio classifier callback:
   soundEventService.emit(
     soundEventService.createSoundEvent({
       soundType: detectedClass,     // mapped SoundType
       direction: estimatedSector,   // multi-mic array direction
       confidence: score,            // 0.0 - 1.0
       intensity: rmsEnergy,         // 0.0 - 1.0
       priority: isCritical ? 'critical' : 'normal',
     })
   );
   ```
3. All UI screens (Radar Map, Recent Sounds, History, Alerts, and Strobe) will immediately react with 0 changes needed to UI components.

---

## 🛠 Local Development Setup

### Prerequisites
- Node.js (v18+)
- pnpm / npm / yarn
- Expo Go or iOS Simulator / Android Emulator

### Installation
```bash
# 1. Install dependencies
pnpm install

# 2. Start Expo Development Server
pnpm start

# 3. Run on platforms
pnpm run ios       # Run on iOS Simulator
pnpm run android   # Run on Android Emulator
pnpm run web       # Run on Web Browser
```

### Linting & Type Checking
```bash
pnpm run lint
```

---

## 🎨 Design System & Palette

- **Navy Dark**: `#032A43` (Primary background)
- **Ocean Deep**: `#0B466D` (Elevated card background)
- **Glacier Blue**: `#247CA8` (Structural borders & secondary waves)
- **Cyan Ice**: `#55C2E8` (Primary brand accent, luminous wave lobes & radar reticle)
- **Ice Pale**: `#C6E8F5` (High-contrast labels & secondary text)
- **Snow White**: `#F7FBFD` (Primary typography & critical peak highlights)
- **Signal Coral**: `#FF5A5F` (Emergency & critical safety badges)
