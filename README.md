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

## 🚀 Client microphone → remote AI

The web client captures mono audio only after the user selects Live Mode. An
`AudioWorklet` converts it to 16 kHz signed 16-bit little-endian PCM and sends
binary frames over the same WebSocket that returns `SoundEvent` JSON. Raw audio
is held only in bounded memory and is never written to History or AsyncStorage.

```text
Expo client mic → audio_config + binary PCM → Python/YAMNet
                                              ↓
Map/History/Alerts ← SoundEvent JSON ← event tracker
```

Start the remote-input engine:

```bash
cd audio-engine
source .venv/bin/activate
python main.py --serve --source websocket --host 0.0.0.0 --port 8765
```

In another terminal:

```bash
EXPO_PUBLIC_AUDIO_ENGINE_WS=ws://127.0.0.1:8765/events pnpm exec expo start --web
```

The existing server-side microphone fallback remains available:

```bash
cd audio-engine
source .venv/bin/activate
python main.py --serve --source microphone
```

Web production requires HTTPS plus a `wss://` engine URL. Native raw-PCM capture
is isolated behind `nativeAudioStream.ts`, but Expo Go does not provide that
native capability. Before an EAS iOS/Android build, select and install a raw-PCM
capture module compatible with the pinned Expo SDK, implement that adapter, add
its config plugin, then create a development build. Microphone usage descriptions
and Android `RECORD_AUDIO` permission are already configured.

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
