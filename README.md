# SoundSight

> **SOUNDS REVEAL MORE.**

**SoundSight is an accessibility and environmental-awareness platform that transforms important sounds into visual, spatial, haptic, and contextual information.**

Built for **HyperBloom Hacks 2026**.

---

## Try SoundSight

### [Launch SoundSight](https://soundsight-eight.vercel.app)

The deployed web application includes the complete SoundSight interface and **Demo Mode**.

For the most reliable walkthrough, select **Continue in Demo Mode**.

**Live Mode** connects the browser microphone to the SoundSight Python AI audio engine when the backend service is available.

---

## What is SoundSight?

Sound carries more information than simply **what happened**.

A knock can tell you someone may be at the door. A voice can tell you someone nearby is speaking. An appliance beep may need your attention. A dog bark, alarm, siren, or approaching vehicle can change how you respond to your surroundings.

For Deaf and hard-of-hearing people, some or all of that environmental information may not be readily accessible.

Many sound-recognition experiences stop at:

> **"Doorbell detected."**

SoundSight asks a bigger question:

> **What happened, where did it happen, and does the person need to know about it?**

SoundSight uses AI-powered environmental sound recognition to transform audio into persistent visual information displayed through a spatial map, sound history, alerts, and accessibility feedback.

The goal is not to replace someone's senses.

**The goal is to make useful environmental information available in another form they can perceive.**

---

# The Problem

Sound is transient.

If you do not perceive a sound when it happens, that information can disappear almost immediately.

Environmental sound often contains several pieces of information at once:

- What happened?
- When did it happen?
- How strong was it?
- How confident is the detection?
- Where might it have happened?
- Is it important enough to interrupt the user?

Traditional sound notifications often flatten this information into a single label.

SoundSight explores what happens when environmental audio becomes a **persistent, accessible representation of the world around the user**.

---

# The Solution

SoundSight converts environmental audio into structured `SoundEvent` objects.

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
Visual Map
    ↓
History • Alerts • Haptics
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

The result is an accessibility experience designed around **environmental awareness rather than notifications alone**.

---

# Features

## Live Sound Awareness

SoundSight processes microphone audio and uses machine learning to recognize environmental sounds.

Predictions are filtered, stabilized, and transformed into structured `SoundEvent` objects before reaching the interface.

This means the user interface does not depend directly on noisy raw model predictions.

---

## Spatial Sound Map

The central SoundSight experience is a radar-inspired visualization of sounds occurring around the user.

Events can communicate:

- sound type
- confidence
- relative sound level
- direction when supported
- timestamp
- priority
- active or inactive state

Sound events appear as glacier-inspired topographic contours that visually represent activity around the user.

> **Current hardware limitation:** The mono microphone configuration used during development cannot provide reliable live left/right localization. Mono input intentionally falls back to a Front/Center representation rather than fabricating directional information.

---

## Topographic Sound Visualization

SoundSight uses luminous glacier-inspired contour waves to make detected sound events visually distinct.

The visualization can respond to properties such as:

- sound type
- intensity
- confidence
- priority
- event age

Older events visually fade as newer environmental information becomes more relevant.

---

## Alerts

Important sounds can be surfaced through dedicated alert experiences rather than disappearing into the general event stream.

SoundSight supports an accessibility-oriented alert architecture including:

- visual alerts
- interface emphasis
- event prioritization
- haptic feedback on supported devices

Haptic behavior depends on the platform and hardware.

Desktop web browsers should not be treated as guaranteed haptic devices.

---

## Sound History

SoundSight maintains a persistent local history of environmental events.

Users can review sounds after they occur instead of losing that information immediately.

History includes:

- chronological event history
- grouped repeated detections
- search
- event metadata
- sound categories
- confidence information
- analytics
- local persistence
- history controls

Sound History stores **derived event metadata**, not raw microphone recordings.

---

## Demo Mode

SoundSight includes a deterministic Demo Mode so the complete accessibility experience can be explored without waiting for specific sounds to occur naturally.

Demo Mode can simulate events such as:

- Door Knock
- Doorbell
- Voice / Speech
- Appliance Beep
- Dog Bark
- Vehicle activity
- Alarm / Siren events

Demo Mode uses the **same centralized `SoundEvent` pipeline** as live detections.

```text
Demo Event
    ↓
SoundEvent
    ↓
SoundSightContext
    ↓
Map • History • Alerts
```

This means Demo Mode and Live Mode do not require separate user interfaces.

Demo events are explicitly presented as simulated and allow the complete SoundSight concept to be evaluated even when the live AI backend is unavailable.

---

## Conversation Mode

SoundSight also explores another accessibility challenge: nearby conversation.

Conversation Mode is intended to provide speech transcription so a Deaf or hard-of-hearing user can read spoken conversation.

Environmental sound recognition and conversation transcription are intentionally treated as separate concepts.

```text
Environmental Mode

Microphone
    ↓
Sound Classification
    ↓
SoundEvent
    ↓
Map • Alerts • History
```

```text
Conversation Mode

Microphone
    ↓
Speech Recognition
    ↓
TranscriptSegment
    ↓
Conversation UI
```

Conversation Mode remains an experimental part of the prototype and should not be considered production-ready.

---

# AI / ML

AI/ML is fundamental to SoundSight.

The environmental sound engine uses **Google YAMNet**, a pretrained environmental audio classification model available through TensorFlow Hub.

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

Using a pretrained model allowed SoundSight to focus not only on recognizing sounds, but also on building the accessibility system surrounding those predictions.

SoundSight adds application logic around model output including:

- confidence thresholds
- temporal stabilization
- transient-event handling
- duplicate suppression
- event aggregation
- intensity calculation
- event categorization
- persistence
- alerts
- visual representation

The ML model is not an isolated feature.

**It is the source of the environmental information driving the core application.**

---

# Why YAMNet?

YAMNet is an environmental audio classification model trained using the AudioSet ontology.

Instead of training a new classifier from scratch during the hackathon, SoundSight uses pretrained environmental-audio intelligence and focuses on transforming model predictions into an accessible experience.

```text
YAMNet Prediction
        ↓
Confidence Threshold
        ↓
Stability / Transient Handling
        ↓
Event Aggregation
        ↓
Duplicate / Cooldown Handling
        ↓
SoundEvent
```

This prevents every individual model prediction from immediately becoming a user-facing event.

YAMNet supports a much larger vocabulary than SoundSight exposes. SoundSight intentionally maps a curated subset of relevant environmental sounds into its product experience.

Recognition reliability depends on microphone quality, environment, volume, overlapping sounds, and model confidence.

---

# Spatial Audio Experimentation

SoundSight also experiments with sound localization using **GCC-PHAT and Time Difference of Arrival (TDOA)**.

With two synchronized microphone channels, a sound can arrive at each microphone at slightly different times.

```text
                 SOUND
                   ↓

Mic A  ● ---------------------- ●  Mic B

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

## Current Localization Limitation

The hardware used for current live testing exposes mono microphone input.

SoundSight therefore does **not** claim true 360-degree localization from the current development hardware.

Mono detections intentionally use a Front/Center fallback.

Synthetic GCC-PHAT tests validate timing-based left/center/right localization logic, while live spatial accuracy remains dependent on appropriate synchronized multi-channel microphone hardware.

---

# Architecture

SoundSight separates audio intelligence from presentation.

## Live Architecture

```text
┌───────────────────────────────────┐
│         SoundSight Client         │
│                                   │
│       Expo / React Native         │
│                                   │
│            Microphone             │
└────────────────┬──────────────────┘
                 │
                 │ PCM Audio
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
      Map      Recent    History   Alerts
```

The Python engine also retains direct-microphone functionality for local development and testing.

---

# Centralized SoundEvent Flow

All environmental detections ultimately flow through the same event architecture.

```text
            Demo Events
                 │
                 ▼
           ┌───────────┐
           │SoundEvent │
           └─────┬─────┘
                 │
                 ▼
         SoundSightContext
                 ▲
                 │
           ┌─────┴─────┐
           │  Live AI  │
           │ Detection │
           └───────────┘
                 │
                 ▼
       Shared Application State
        ┌────────┼────────┬────────┐
        ▼        ▼        ▼        ▼
       Map     Recent   History   Alerts
```

This is an important architectural decision.

**Demo Mode and Live Mode use the same application event model.**

Both ultimately produce:

```text
SoundEvent
```

---

# SoundEvent Schema

The core event model is defined in:

```text
src/types/sound.ts
```

A `SoundEvent` contains normalized information the application needs to represent a detected sound.

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

Acoustic fields should always be interpreted according to available hardware.

Uncalibrated microphone amplitude should **not** be interpreted as laboratory-grade dB SPL or dBA measurements.

---

# Browser Microphone to Remote AI

The web architecture can capture microphone audio directly from the browser.

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

## Client to AI Engine

The client sends an audio configuration message:

```json
{
  "type": "audio_config",
  "format": "pcm_s16le",
  "sampleRate": 16000,
  "channels": 1
}
```

Microphone samples then travel as binary WebSocket frames.

## AI Engine to Client

The Python engine processes the stream and returns normalized `SoundEvent` JSON.

```text
Browser
   │
   │ PCM
   ▼
Python Audio Engine
   │
   ▼
YAMNet
   │
   ▼
SoundEvent JSON
   │
   ▼
SoundSight
```

Raw microphone audio is used for processing and is not intended to become part of Sound History.

---

# Privacy

Environmental audio can contain sensitive information.

SoundSight is designed around a privacy-conscious prototype architecture.

Current principles include:

- raw microphone audio is not intentionally added to Sound History
- environmental History contains derived event metadata
- users can clear stored History
- environmental events and conversation transcripts remain separate data types
- raw microphone recordings are not intended to become permanent user history

A future production version could move more inference directly onto the device to further reduce audio transmission and improve offline availability.

---

# Tech Stack

## Frontend

- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind
- React Native SVG
- Web Audio API
- AudioWorklet

## AI and Audio

- Python
- TensorFlow
- TensorFlow Hub
- Google YAMNet
- NumPy
- WebSockets
- GCC-PHAT / TDOA

## Application Data

- local application storage
- persistent `SoundEvent` history
- local settings and preferences
- Demo Mode event state

## Deployment

- **Vercel** for the SoundSight web frontend
- **Render** for the Python/WebSocket AI backend

---

# Project Structure

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
│   ├── requirements.txt
│   └── tests/
│
├── src/
│   ├── app/
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
├── docs/
├── app.json
├── package.json
├── vercel.json
└── README.md
```

---

# Running SoundSight Locally

## Prerequisites

You will need:

- Node.js
- pnpm
- Python 3
- Git
- a modern browser
- microphone access for Live Mode

---

## 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Soundsight
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the repository's GitHub URL.

---

## 2. Install Frontend Dependencies

From the project root:

```bash
pnpm install
```

---

## 3. Start the Frontend

```bash
pnpm exec expo start
```

For web:

```bash
pnpm exec expo start --web
```

Expo can also allow you to press:

```text
w
```

to open the web version.

---

# Running the Python AI Engine

Enter the audio engine directory:

```bash
cd audio-engine
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it on macOS or Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# Running Live AI Locally

You need two terminals.

## Terminal 1: Start the AI Engine

From `audio-engine`:

```bash
source .venv/bin/activate

python main.py \
  --serve \
  --source websocket \
  --host 0.0.0.0 \
  --port 8765
```

The local WebSocket endpoint is:

```text
ws://127.0.0.1:8765/events
```

---

## Terminal 2: Start SoundSight

From the repository root:

```bash
EXPO_PUBLIC_AUDIO_ENGINE_WS=ws://127.0.0.1:8765/events \
pnpm exec expo start --web
```

Open SoundSight and select **Live Mode**.

Grant microphone permission when prompted.

The development pipeline becomes:

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

# Direct Python Microphone Mode

The Python engine can also use a microphone attached directly to the computer running Python.

```bash
cd audio-engine
source .venv/bin/activate

python main.py \
  --serve \
  --source microphone
```

A specific input device can be selected when required:

```bash
python main.py \
  --serve \
  --source microphone \
  --device <INDEX> \
  --channels 1
```

Use multi-channel localization only with verified synchronized microphone hardware.

---

# WebSocket Configuration

SoundSight uses:

```text
EXPO_PUBLIC_AUDIO_ENGINE_WS
```

to configure the AI engine WebSocket endpoint.

## Local Development

```text
ws://127.0.0.1:8765/events
```

## Production

```text
wss://YOUR_RENDER_SERVICE.onrender.com/events
```

Production websites served over HTTPS should use `wss://` rather than insecure `ws://`.

For example:

```bash
EXPO_PUBLIC_AUDIO_ENGINE_WS=wss://YOUR_RENDER_SERVICE.onrender.com/events
```

Replace the placeholder with the actual Render service URL after the backend is deployed.

---

# Deploying the Web App with Vercel

SoundSight's public frontend is deployed with Vercel.

## Production Web App

**[Launch SoundSight](https://soundsight-eight.vercel.app)**

Build the web application:

```bash
pnpm exec expo export -p web
```

Expo generates:

```text
dist/
```

Install the Vercel CLI if needed:

```bash
npm install -g vercel
```

Authenticate:

```bash
vercel login
```

Deploy a preview:

```bash
vercel
```

Deploy production:

```bash
vercel --prod
```

Vercel hosts the **SoundSight frontend**.

The Python/TensorFlow audio engine is deployed separately.

---

# Deploying the AI Backend with Render

The Python AI/WebSocket backend can be deployed using a Render Web Service.

## Render Configuration

Create:

```text
New
→ Web Service
```

Connect the SoundSight GitHub repository.

Configure:

```text
Name:
soundsight-audio

Language:
Python 3

Branch:
main

Root Directory:
audio-engine

Build Command:
pip install -r requirements.txt

Start Command:
python main.py

Compute:
Free
```

For the hackathon prototype, the free service is sufficient to begin testing.

---

## Render Port Configuration

Render provides a `PORT` environment variable to web services.

The SoundSight server should:

- bind to `0.0.0.0`
- use Render's `PORT` when provided
- fall back to `8765` locally

Conceptually:

```python
import os

port = int(os.environ.get("PORT", "8765"))
```

Local development therefore continues to use:

```text
8765
```

while Render can assign the production port.

---

## Render WebSocket URL

After deployment, Render provides a public hostname similar to:

```text
https://soundsight-audio.onrender.com
```

The corresponding secure WebSocket endpoint would be:

```text
wss://soundsight-audio.onrender.com/events
```

Replace the example hostname with the actual Render service hostname.

Then configure the frontend:

```text
EXPO_PUBLIC_AUDIO_ENGINE_WS=wss://YOUR_RENDER_SERVICE.onrender.com/events
```

Because Expo public environment variables are included in the web build, rebuild and redeploy the Vercel frontend after changing the production WebSocket URL.

---

## Render Free Service Behavior

The Render backend may be inactive when nobody is using SoundSight.

When the service needs to start again, the frontend should clearly communicate connection state instead of appearing broken.

Useful states include:

```text
Starting SoundSight AI
Connecting
Listening
AI Offline
```

Demo Mode remains available independently of the live AI service.

---

# Production Architecture

The intended hosted architecture is:

```text
┌─────────────────────────────────┐
│             Vercel              │
│                                 │
│       SoundSight Web App        │
└──────────────┬──────────────────┘
               │
               │ Browser Microphone
               ▼
          AudioWorklet
               │
               │ PCM Audio
               ▼
              wss://
               │
               ▼
┌─────────────────────────────────┐
│             Render              │
│                                 │
│       Python Audio Engine       │
│               ↓                 │
│             YAMNet              │
│               ↓                 │
│       Event Stabilization       │
│               ↓                 │
│           SoundEvent            │
└──────────────┬──────────────────┘
               │
               │ JSON
               ▼
┌─────────────────────────────────┐
│        SoundSight Frontend      │
│                                 │
│ Map • History • Alerts • Detail │
└─────────────────────────────────┘
```

This separates **presentation** from **audio inference** while preserving the shared `SoundEvent` contract.

---

# Mobile Architecture

SoundSight is structured as an Expo / React Native application so the same product can target:

```text
Web
iOS
Android
```

The current browser microphone implementation uses Web APIs.

Native raw-PCM microphone streaming requires a compatible native capture implementation and physical-device testing.

Python is not intended to run inside the mobile application in the current architecture.

---

# Haptics

On supported native/mobile devices, SoundSight can provide haptic feedback for detected or important sounds when enabled.

On web, physical vibration depends on browser and device support.

```text
Supported Mobile Device
        ↓
Physical Haptic / Vibration

Unsupported Browser or Device
        ↓
Visual Feedback
```

Desktop browsers should not be treated as guaranteed haptic hardware.

---

# Testing

The SoundSight pipeline includes automated validation for core audio and transport behavior.

Testing covers areas including:

- audio configuration validation
- PCM conversion
- sample-rate validation
- malformed audio handling
- WebSocket binary ingestion
- disconnect cleanup
- bounded audio handling
- `SoundEvent` transport
- TypeScript validation
- Expo web export

## Python Tests

From the repository root:

```bash
audio-engine/.venv/bin/python -m unittest discover -s audio-engine/tests -v
```

## TypeScript

```bash
pnpm exec tsc --noEmit
```

## Lint

```bash
pnpm lint
```

## Web Export

```bash
pnpm exec expo export -p web
```

## Git Validation

```bash
git diff --check
```

Physical-device testing remains necessary for native microphone and haptic behavior.

---

# Current Prototype Limitations

SoundSight is a hackathon prototype.

It should **not be treated as a certified safety-critical or emergency-alerting system**.

Current limitations include:

- classification accuracy depends on acoustic conditions and model confidence
- acoustically similar sounds may occasionally be confused
- true directional localization requires appropriate synchronized microphone hardware
- mono microphone input cannot reliably determine left/right direction
- sound-level measurements are not calibrated SPL measurements unless explicitly calibrated
- native iOS/Android raw-PCM streaming requires additional physical-device integration
- web haptic support varies by browser and hardware
- Conversation Mode remains experimental
- Live Mode requires connectivity to the Python inference engine

These limitations are intentionally exposed rather than hidden behind simulated precision.

---

# Design System

SoundSight's visual language is inspired by glaciers, topographic maps, sound waves, and environmental sensing.

| Token | Color | Purpose |
|---|---|---|
| **Navy Dark** | `#032A43` | Primary background |
| **Ocean Deep** | `#0B466D` | Elevated surfaces |
| **Glacier Blue** | `#247CA8` | Structural elements |
| **Cyan Ice** | `#55C2E8` | Primary accent and radar |
| **Ice Pale** | `#C6E8F5` | Secondary text |
| **Snow White** | `#F7FBFD` | Primary typography |
| **Signal Coral** | `#FF5A5F` | Critical alert emphasis |

The topographic contour system visually connects:

```text
Sound
  +
Space
  +
Environment
  +
Accessibility
```

into one recognizable visual identity.

---

# AI Tools Disclosure

AI-assisted development tools were used during the creation of SoundSight.

They assisted with:

- product ideation
- architecture planning
- UI/UX iteration
- debugging
- code refactoring
- documentation
- technical research

Development assistance included:

- ChatGPT
- OpenAI Codex
- GitHub Copilot

AI-generated suggestions and code were reviewed and integrated into the project as part of the development process.

The application's **runtime environmental sound intelligence** uses Google's pretrained **YAMNet** model.

ChatGPT, Codex, and GitHub Copilot were development tools. They are **not** the runtime sound classifier.

---

# Built for HyperBloom Hacks 2026

SoundSight was built for **HyperBloom Hacks 2026**, an AI/ML hackathon focused on intelligent solutions to real-world problems.

## Impact and Relevance

SoundSight explores access to environmental information for Deaf and hard-of-hearing users.

## Innovation and Creativity

Rather than treating sound accessibility as a collection of notifications, SoundSight explores a spatial and persistent representation of the surrounding acoustic environment.

## Technical Implementation

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

## AI / ML Integration

Machine-learning sound recognition is fundamental to the application.

Without environmental audio classification, SoundSight cannot construct the `SoundEvent` objects that power its core experience.

## Presentation and Demo

The Live Map transforms model predictions into an immediately visible representation, while Demo Mode provides deterministic scenarios for demonstrating the accessibility concept.

---

# Future Work

SoundSight is ultimately intended to become more local, private, spatial, and multimodal.

Future work includes:

- on-device environmental sound classification
- on-device speech transcription
- production-ready Conversation Mode
- improved multi-microphone localization
- browser-to-cloud audio infrastructure improvements
- expanded curated sound recognition
- improved transient-event detection
- personalized sound categories
- user-selectable alert priorities
- richer DeafBlind haptic patterns
- wearable integrations
- improved false-positive suppression
- calibrated acoustic measurements
- accessibility personalization
- offline inference
- optional spoken spatial context for blind and low-vision users

A future on-device architecture could reduce or remove the remote inference requirement:

```text
Phone Microphone
       ↓
On-Device AI
       ↓
SoundEvent
       ↓
SoundSight
```

This could improve privacy, latency, and offline availability.

---

# Why SoundSight?

Sound accessibility should be about more than displaying the name of a sound.

Sound contains information about:

**what happened, when it happened, where it happened, and whether it matters.**

SoundSight explores how that information can be transformed rather than lost.

---

# SOUNDS REVEAL MORE.

### See where sound happens.

### Same sounds. A brighter tomorrow.

### [Launch SoundSight](https://soundsight-eight.vercel.app)

---

**SoundSight — HyperBloom Hacks 2026**