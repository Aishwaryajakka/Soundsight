# SoundSight

> **See where sound happens.**

**SoundSight is an accessibility and environmental-awareness platform that transforms important sounds into visual, spatial, haptic, and contextual information.**

Built for **HyperBloom Hacks 2026**.

---

## What is SoundSight?

Sound carries more information than just *what happened*.

A knock tells you someone may be at the door.  
A voice tells you someone nearby may be speaking.  
An appliance beep may need your attention.  
A dog bark, alarm, or approaching vehicle can change how you respond to your surroundings.

For Deaf and hard-of-hearing people, some or all of that environmental information may not be readily accessible.

Most sound-recognition tools stop at:

> **"Doorbell detected."**

SoundSight asks a bigger question:

> **What happened, where did it happen, and does the person need to know about it?**

SoundSight uses AI-powered environmental sound recognition to transform audio into persistent visual information that can be displayed through a spatial map, alerts, history, and accessibility feedback.

The goal is not to replace someone's senses.

**The goal is to make useful environmental information available in another form they can perceive.**

---

# The Problem

Sound is transient.

If you don't perceive a sound when it happens, that information can disappear almost immediately.

But environmental sound often contains several pieces of information at once:

- What happened?
- When did it happen?
- How strong was it?
- How confident is the detection?
- Where might it have happened?
- Is it important enough to interrupt the user?

Traditional sound notifications often flatten all of this into a single label.

SoundSight explores what happens when that information becomes a persistent, accessible representation of the environment.

---

# The Solution

SoundSight converts microphone audio into structured environmental events.

```text
Microphone
    ↓
Audio Processing
    ↓
AI Sound Classification
    ↓
Confidence + Temporal Stabilization
    ↓
Spatial / Acoustic Processing
    ↓
SoundEvent
    ↓
Visual Map • Recent Sounds • History • Alerts • Haptics
```

Instead of displaying only:

```text
Doorbell
```

SoundSight can represent:

```text
Doorbell
Front
92% confidence
Detected 3 seconds ago
```

The result is a visual representation of environmental sound designed around **awareness rather than notifications alone**.

---

# 🏔 Features

## 🎯 Live Sound Awareness

SoundSight processes microphone audio and uses machine learning to recognize environmental sounds.

Predictions are filtered, stabilized, and transformed into structured `SoundEvent` objects before reaching the interface.

This prevents the UI from depending directly on raw model predictions.

---

## 🧭 Spatial Sound Map

The central SoundSight experience is a radar-inspired visualization of sounds occurring around the user.

Events can communicate:

- sound type
- confidence
- relative sound level
- direction when supported
- timestamp
- priority
- active/inactive state

Sound events appear as glacier-inspired topographic contours that visually represent activity around the user.

> **Note:** The current mono microphone configuration cannot provide reliable left/right spatial localization. Mono input intentionally falls back to a Front/Center representation rather than fabricating directional information.

---

## 🌊 Topographic Sound Visualization

SoundSight uses luminous glacier-inspired contour waves to make detected sound events visually distinct.

The visualization can respond to event properties such as:

- sound type
- intensity
- confidence
- priority
- event age

Older events visually fade as newer environmental information becomes more relevant.

---

## 🚨 Alerts

Important sounds can be surfaced through dedicated alert experiences rather than disappearing into the general event stream.

The architecture supports multimodal accessibility feedback including:

- visual alerts
- interface emphasis
- haptic feedback
- accessibility-oriented event prioritization

Haptic behavior requires physical-device validation before being treated as production-ready.

---

## 📜 Sound History

SoundSight maintains a persistent local history of detected environmental events.

Users can review sounds after they occur instead of losing that information immediately.

History supports functionality such as:

- chronological event history
- search
- event metadata
- sound categories
- confidence information
- local persistence
- clearing history

Sound history stores **derived event metadata**, not raw microphone recordings.

---

## 💬 Conversation Mode

SoundSight also explores a second accessibility problem: nearby conversation.

Conversation Mode is designed to provide live speech transcription so a Deaf or hard-of-hearing user can read spoken conversation as it happens.

Environmental sound recognition and conversation transcription are intentionally treated as separate modes:

```text
Environmental Mode
Microphone
→ Sound Classification
→ SoundEvent
→ Map / Alerts / History


Conversation Mode
Microphone
→ Speech Recognition
→ TranscriptSegment
→ Live Conversation UI
```

Conversation Mode is currently under active development and should not yet be considered production-ready.

Transcript information is intended to remain local and temporary rather than becoming permanent audio history.

---

## 🧪 Demo Mode

SoundSight includes deterministic demo scenarios so the accessibility experience can be explored without waiting for specific sounds to occur naturally.

Example demo events include sounds such as:

- door knock
- doorbell
- speech
- appliance beep
- dog bark
- vehicle activity
- alarm/siren events

Demo Mode uses the **same centralized SoundEvent pipeline** as live detections.

That means the UI does not need separate implementations for simulated and real events.

---

# 🤖 AI / ML

AI/ML is fundamental to SoundSight.

The current environmental sound engine uses **YAMNet**, a pretrained environmental sound-classification model.

The inference pipeline is:

```text
Environmental Audio
        ↓
PCM Preprocessing
        ↓
Mono Waveform
        ↓
16 kHz
        ↓
YAMNet
        ↓
Class Probabilities
        ↓
Confidence Filtering
        ↓
Temporal Stabilization
        ↓
Event Aggregation
        ↓
SoundEvent
```

Using a pretrained model allowed SoundSight to focus not only on recognizing sounds, but also on the accessibility layer surrounding those predictions.

SoundSight adds application logic around the model output including:

- confidence thresholds
- temporal stabilization
- duplicate suppression
- event aggregation
- intensity calculation
- event categorization
- persistence
- alerts
- visual representation

The ML model is therefore not an isolated feature. It is the source of the environmental information driving the application.

---

# 🧠 Why YAMNet?

YAMNet is an environmental audio classification model capable of identifying a broad range of sound categories.

Instead of training a new sound classifier from scratch during the hackathon, SoundSight uses pretrained environmental-audio intelligence and focuses on transforming those predictions into an accessible experience.

The classifier produces candidate sound classes and confidence scores.

SoundSight then determines how those predictions become meaningful application events.

```text
YAMNet prediction
      ↓
confidence threshold
      ↓
stable across multiple windows?
      ↓
event aggregation
      ↓
duplicate / cooldown handling
      ↓
SoundEvent
```

This helps prevent every individual model prediction from immediately becoming a user-facing alert.

---

# 🧭 Spatial Audio Experimentation

SoundSight also experiments with sound localization using **GCC-PHAT / Time Difference of Arrival (TDOA)**.

With two synchronized microphone channels, a sound can arrive at each microphone at slightly different times.

```text
               SOUND
                 ↓

Mic A  ● ---------------- ●  Mic B
          arrival delay
                ↓
            GCC-PHAT
                ↓
               TDOA
                ↓
        Direction Estimate
```

With suitable synchronized hardware, this can support coarse:

```text
LEFT
CENTER
RIGHT
```

localization.

### Current limitation

The hardware used for current testing exposes mono microphone input.

Therefore SoundSight does **not** claim true 360° localization from the current hardware.

Mono detections intentionally use a Front/Center fallback.

The radar interface represents the broader spatial interaction concept while the localization engine remains hardware-dependent.

---

# 🏗 Architecture

SoundSight separates audio processing from presentation.

## Current Client-Microphone Architecture

```text
┌───────────────────────────────────┐
│         SoundSight Client         │
│                                   │
│       Expo / React Native         │
│                                   │
│            Microphone             │
└────────────────┬──────────────────┘
                 │
                 │ PCM audio
                 ▼
┌───────────────────────────────────┐
│       Bidirectional WebSocket     │
└────────────────┬──────────────────┘
                 │
                 ▼
┌───────────────────────────────────┐
│        Python Audio Engine        │
│                                   │
│   PCM Buffering / Preprocessing   │
│                 ↓                 │
│              YAMNet               │
│                 ↓                 │
│       Confidence Filtering        │
│                 ↓                 │
│       Temporal Stabilization      │
│                 ↓                 │
│          Event Tracking           │
│                 ↓                 │
│            SoundEvent             │
└────────────────┬──────────────────┘
                 │
                 │ JSON
                 ▼
┌───────────────────────────────────┐
│        SoundSightContext          │
│                                   │
│       Central Event State         │
└────────────────┬──────────────────┘
                 │
       ┌─────────┼─────────┬─────────┐
       ▼         ▼         ▼         ▼
    Live Map   Recent    History   Alerts
```

The Python engine also retains its original direct-microphone mode for development and testing.

---

# 🔄 Centralized SoundEvent Data Flow

All environmental detections ultimately flow through a shared event architecture.

```text
        Demo Events
             │
             │
             ▼
      ┌───────────────┐
      │  SoundEvent   │
      └───────┬───────┘
              │
              ▼
     SoundSightContext
              ▲
              │
      ┌───────┴───────┐
      │   Live AI     │
      │   Detection   │
      └───────────────┘
              │
              ▼

     Shared Application State

       ┌──────┼──────┬──────┐
       ▼      ▼      ▼      ▼

      Map   Recent  History Alerts
```

This is an important architectural decision.

**Demo Mode and Live Mode do not require separate UI implementations.**

Both produce the same fundamental application object:

`SoundEvent`.

---

# 📦 SoundEvent Schema

Defined in:

```text
src/types/sound.ts
```

A SoundEvent contains the normalized information the application needs to represent a detected sound.

```typescript
export interface SoundEvent {
  id: string;

  soundType: SoundType;
  label: string;

  direction: SoundDirection;

  confidence: number;
  intensity: number;

  priority: SoundPriority;

  timestamp: number;
  isActive: boolean;

  // Optional spatial/acoustic metadata
  angle?: number;
  decibels?: number;
  distanceMeters?: number;

  category?: SoundCategory;

  iconName?: string;
  description?: string;

  waveContours?: number[];
}
```

Example:

```json
{
  "id": "event-001",
  "soundType": "door_knock",
  "label": "Door Knock",
  "direction": "front",
  "confidence": 0.96,
  "intensity": 0.82,
  "priority": "normal",
  "timestamp": 1789401600000,
  "isActive": true
}
```

Acoustic fields should be interpreted according to the available hardware.

For example, uncalibrated microphone amplitude should not be interpreted as laboratory-grade sound pressure level measurements.

---

# 🎙 Client Microphone → Remote AI

The web version of SoundSight can capture microphone audio directly from the browser.

The browser pipeline uses:

```text
getUserMedia
      ↓
Web Audio API
      ↓
AudioWorklet
      ↓
Mono PCM
      ↓
16 kHz S16LE
      ↓
WebSocket
```

The WebSocket connection is bidirectional.

### Client → AI engine

The client first sends an audio configuration message:

```json
{
  "type": "audio_config",
  "format": "pcm_s16le",
  "sampleRate": 16000,
  "channels": 1
}
```

Microphone samples then travel as binary WebSocket frames.

### AI engine → Client

The Python engine processes the stream and returns the existing `SoundEvent` JSON.

```text
SoundSight
     │
     │ binary PCM
     ▼
Python / YAMNet
     │
     │ SoundEvent JSON
     ▼
SoundSight
```

Raw microphone audio is kept only in bounded working memory during processing and is not intentionally written to SoundSight History or AsyncStorage.

---

# 🔒 Privacy

Environmental audio can contain sensitive information.

SoundSight is designed around a privacy-conscious architecture.

Current principles include:

- raw microphone audio is not intentionally persisted
- raw audio is not added to Sound History
- environmental History contains derived event metadata
- users can clear stored History
- transcript information is intended to remain local and temporary
- environmental events and conversation transcripts remain separate data types
- raw microphone recordings are not intended to become part of the user's permanent profile

A future production version could move additional inference directly onto the device to further minimize audio transmission.

---

# 🛠 Tech Stack

## Frontend

- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind
- React Native SVG

## AI / Audio

- Python
- TensorFlow
- TensorFlow Hub
- YAMNet
- NumPy
- WebSockets
- GCC-PHAT / TDOA
- Web Audio API
- AudioWorklet

## Application Data

- Local application storage
- Persistent SoundEvent history
- Local settings/preferences
- Temporary transcript architecture

---

# 📁 Project Structure

A simplified view of the repository:

```text
Soundsight/
│
├── audio-engine/
│   ├── main.py
│   ├── classifier.py
│   ├── audio_capture.py
│   ├── audio_sources.py
│   ├── websocket_server.py
│   ├── config.py
│   └── tests/
│
├── src/
│   ├── app/
│   │   ├── microphone.tsx
│   │   └── (app)/
│   │       └── (tabs)/
│   │
│   ├── components/
│   │   ├── SoundRadarCanvas.tsx
│   │   ├── SoundActivityGraph.tsx
│   │   ├── SoundDetailModal.tsx
│   │   ├── SoundIcon.tsx
│   │   └── StrobeOverlay.tsx
│   │
│   ├── context/
│   │   └── SoundSightContext.tsx
│   │
│   ├── services/
│   │   ├── audio/
│   │   ├── liveSoundEventService.ts
│   │   ├── soundEventService.ts
│   │   └── soundHistoryStorage.ts
│   │
│   └── types/
│       └── sound.ts
│
├── assets/
├── app.json
├── package.json
└── README.md
```

---

# 🚀 Running SoundSight Locally

## Prerequisites

Install:

- Node.js 18+
- pnpm
- Python 3
- a modern browser
- a microphone

---

## 1. Install Frontend Dependencies

From the project root:

```bash
pnpm install
```

---

## 2. Configure Python

Enter the audio engine:

```bash
cd audio-engine
```

Create a virtual environment if one does not already exist:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# 🌐 Run With the Browser Microphone

This is the current client-microphone development architecture.

### Terminal 1 — AI Engine

```bash
cd audio-engine
source .venv/bin/activate

python main.py \
  --serve \
  --source websocket \
  --host 0.0.0.0 \
  --port 8765
```

The Python process should start without opening the Mac microphone.

---

### Terminal 2 — SoundSight Web

From the project root:

```bash
EXPO_PUBLIC_AUDIO_ENGINE_WS=ws://127.0.0.1:8765/events \
pnpm exec expo start --web
```

Open the application in your browser.

Choose **Live Mode** and grant microphone permission.

The complete development pipeline is:

```text
Browser Microphone
        ↓
AudioWorklet
        ↓
PCM
        ↓
WebSocket
        ↓
Python
        ↓
YAMNet
        ↓
SoundEvent
        ↓
SoundSight UI
```

---

# 🎤 Python Microphone Fallback

The original server-side microphone architecture remains available for development.

```bash
cd audio-engine
source .venv/bin/activate

python main.py \
  --serve \
  --source microphone
```

A specific device can also be selected when required:

```bash
python main.py \
  --serve \
  --source microphone \
  --device <INDEX> \
  --channels 1
```

Use multi-channel localization only with verified synchronized microphone hardware.

---

# 📱 Mobile Packaging

SoundSight is structured as an Expo/React Native application so the same product can target:

```text
Web
iOS
Android
```

The current browser microphone implementation uses Web APIs.

Native microphone streaming is isolated behind:

```text
src/services/audio/nativeAudioStream.ts
```

A production iOS/Android implementation requires a compatible native raw-PCM capture module and an Expo Development Build/EAS Build.

The project already accounts for microphone permissions including:

- iOS microphone usage description
- Android `RECORD_AUDIO`

Python is **not intended to be embedded inside the mobile application** in the current architecture.

---

# 🌐 Production Architecture

A hosted web/mobile configuration can use:

```text
SoundSight Web / Mobile
          │
          │ microphone audio
          ▼
       wss://
          │
          ▼
Hosted Python AI Engine
          │
          │ SoundEvent
          ▼
     SoundSight UI
```

The backend URL is configured through:

```text
EXPO_PUBLIC_AUDIO_ENGINE_WS
```

Local development:

```text
ws://127.0.0.1:8765/events
```

Production should use a secure endpoint:

```text
wss://<audio-engine-host>/events
```

This prevents production hostnames from being hard-coded into the application.

---

# 🧪 Validation

The SoundSight pipeline includes automated testing for core audio and transport behavior.

Current validation includes:

- audio configuration validation
- PCM conversion
- sample-rate validation
- malformed audio handling
- unconfigured binary frame handling
- WebSocket binary ingestion
- disconnect cleanup
- bounded audio handling
- SoundEvent transport
- TypeScript validation
- Expo web export

Latest development validation:

```text
Python tests:       29 / 29 PASS
TypeScript:         PASS
Lint:               PASS
Expo Web Export:    PASS
git diff --check:   PASS
```

Physical-device testing remains necessary for native microphone and haptic behavior.

---

# ⚠️ Current Limitations

SoundSight is a hackathon prototype.

It should **not be treated as a safety-critical emergency alerting system**.

Current limitations include:

- sound-classification accuracy depends on recording conditions and model confidence
- acoustically similar sounds may occasionally be confused
- true directional localization requires appropriate synchronized microphone hardware
- mono microphone input cannot reliably determine left/right direction
- sound-level measurements are not calibrated SPL measurements unless explicitly calibrated
- native iOS/Android raw-PCM microphone streaming still requires physical-device integration
- haptic behavior requires physical-device validation
- Conversation Mode remains under development
- the current AI architecture requires connectivity between the client and Python inference engine

These limitations are intentionally exposed rather than hidden behind simulated precision.

---

# 🎨 Design System

SoundSight's visual language is inspired by glaciers, topographic maps, sound waves, and environmental sensing.

| Token | Color | Purpose |
|---|---|---|
| **Navy Dark** | `#032A43` | Primary background |
| **Ocean Deep** | `#0B466D` | Elevated surfaces |
| **Glacier Blue** | `#247CA8` | Structural elements |
| **Cyan Ice** | `#55C2E8` | Primary accent / radar |
| **Ice Pale** | `#C6E8F5` | Secondary text |
| **Snow White** | `#F7FBFD` | Primary typography |
| **Signal Coral** | `#FF5A5F` | Critical alert emphasis |

The topographic contour system is intended to visually connect:

```text
sound
+
space
+
environment
+
accessibility
```

into one recognizable visual identity.

---

# 🤖 AI Tools Disclosure

AI-assisted development tools were used during the creation of SoundSight.

They assisted with areas including:

- product ideation
- architecture planning
- UI/UX iteration
- code refactoring
- documentation
- technical research

AI-generated suggestions and code were reviewed and integrated into the project as part of the development process.

The application's runtime environmental sound intelligence uses the pretrained **YAMNet** environmental sound-classification model.

---

# 🌱 Built for HyperBloom Hacks 2026

SoundSight was built for **HyperBloom Hacks**, an AI/ML hackathon focused on intelligent solutions to real-world problems.

The project aligns with the hackathon's judging categories:

### Impact & Relevance — 25%

SoundSight addresses access to environmental information for Deaf and hard-of-hearing users.

### Innovation & Creativity — 20%

Rather than treating sound accessibility as a collection of notifications, SoundSight explores a spatial, persistent representation of the surrounding acoustic environment.

### Technical Implementation — 25%

The project combines:

- real-time microphone capture
- browser audio processing
- binary PCM streaming
- bidirectional WebSockets
- Python audio processing
- machine-learning inference
- event stabilization
- signal-processing experimentation
- persistent application state
- cross-platform React Native UI

### AI/ML Integration — 20%

Machine-learning sound recognition is fundamental to the application.

Without environmental audio classification, SoundSight cannot construct the SoundEvents that power its core experience.

### Presentation & Demo — 10%

The Live Map transforms model predictions into an immediately visible representation, while Demo Mode provides deterministic scenarios for demonstrating the accessibility concept.

---

# 🔭 Future Direction

SoundSight is ultimately intended to become more local, private, and multimodal.

Future work includes:

- on-device environmental sound classification
- on-device speech transcription
- production-ready Conversation Mode
- improved multi-microphone localization
- personalized sound categories
- user-selectable alert priorities
- richer haptic patterns
- wearable integrations
- improved false-positive suppression
- calibrated acoustic measurements
- accessibility personalization
- offline inference

A future on-device architecture could remove the remote inference requirement entirely:

```text
Phone Microphone
       ↓
On-Device AI
       ↓
SoundEvent
       ↓
SoundSight
```

This would improve privacy, offline availability, and latency.

---

# 💙 Why SoundSight?

Sound accessibility should be about more than displaying the name of a sound.

Sound contains information about:

**what happened, when it happened, where it happened, and whether it matters.**

SoundSight explores how that information can be transformed rather than lost.

---

## SOUNDS REVEAL MORE.

### Listen. Understand. Orient. Belong.

**Same sounds. A brighter tomorrow.**