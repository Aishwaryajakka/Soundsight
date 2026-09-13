# Requirements Document

## 1. Application Overview

**Application Name**: SoundSight

**Description**: SoundSight is a mobile app designed for Deaf and hard-of-hearing users. It detects important environmental sounds in real-time and visualizes WHAT the sound is and WHERE it is coming from through a spatial sound map interface.

**Tagline**: See where sound happens.

**Design Motif**: Sound creates a landscape around you.

**Visual Theme**: Inspired by glaciers, ice, topographic elevation maps, and flowing sound waves.

**Color Palette**:
- Very dark glacier/navy blue: #032A43
- Deep ocean blue: #0B466D
- Glacier blue: #247CA8
- Bright ice/cyan blue: #55C2E8
- Pale ice blue: #C6E8F5
- Snow white: #F7FBFD

**Logo Asset**: `assets/SoundSightLogo.png`

## 2. Target Users and Usage Scenarios

**Target Users**: Deaf and hard-of-hearing individuals who need to be aware of environmental sounds for safety, communication, and daily living.

**Core Usage Scenarios**:
- Detecting emergency sounds (fire alarms, sirens, door knocks)
- Monitoring household sounds (baby crying, appliances, doorbell)
- Awareness of outdoor/traffic sounds for navigation safety
- Understanding speech and voice presence in the environment
- Reviewing historical sound events for pattern recognition

## 3. Page Structure and Functionality

### 3.1 Navigation Structure

```
SoundSight App
├── Onboarding (First Launch Only)
│   ├── Screen 1: Welcome
│   ├── Screen 2: Core Value
│   └── Screen 3: Alert Methods & Start
├── Map (Default)
├── History
├── Alerts
└── Settings
```

### 3.2 Onboarding Experience (First Launch Only)

**Purpose**: Introduce SoundSight's core value proposition and request microphone permission through a visually rich, minimal-text 3-screen flow.

#### Screen 1: Welcome

**Visual Elements**:
- SoundSight logo positioned at top-center
- Abstract glacier/sound-wave landscape background (rich SVG topographic ice waves in glacier color palette)
- Headline: \"See where sound happens.\"
- Body text: \"SoundSight turns important sounds around you into a map you can see.\"

**Navigation**:
- Clean pagination indicator (3 dots, first dot active in bright cyan #55C2E8)
- Swipe right or tap \"Next\" button to advance to Screen 2
- \"Skip\" option in top-right corner to bypass onboarding and proceed directly to microphone permission request

#### Screen 2: Core Value

**Visual Elements**:
- Simplified spatial sound map illustration with directional glacier wave pulses emanating from center
- Headline: \"Know what. Know where.\"
- Body text: \"SoundSight identifies important sounds and shows the direction they came from.\"

**Navigation**:
- Pagination indicator (3 dots, second dot active in bright cyan #55C2E8)
- Swipe right or tap \"Next\" button to advance to Screen 3
- \"Skip\" option in top-right corner

#### Screen 3: Alert Methods & Start

**Visual Elements**:
- Visual alert icon (eye symbol) with glowing ice cyan badge
- Haptic alert icon (vibration symbol) with glowing ice cyan badge
- Headline: \"Awareness that works for you.\"
- Body text: \"Choose how SoundSight communicates through visual and haptic alerts.\"
- Primary button: \"Start SoundSight\" (large, accessible, bright cyan #55C2E8 on dark glacier navy #032A43)

**Navigation**:
- Pagination indicator (3 dots, third dot active in bright cyan #55C2E8)
- Tap \"Start SoundSight\" button to trigger microphone permission request
- Upon permission grant, navigate to Map tab (Live Sound Map)
- Upon permission denial, display prompt requesting microphone access
- \"Skip\" option removed on final screen

**Design Principles**:
- Extremely visual, minimal text
- Glacier color palette throughout
- Clean pagination indicator
- Swipe gesture and \"Next\" button navigation
- \"Skip\" option available on Screen 1 and Screen 2

### 3.3 Map Tab (Primary Screen)

**Purpose**: Real-time spatial sound detection and visualization with ultra-clean hero Live Map design.

**Layout Structure**:

1. **TOP Section**
   - Left: SoundSight logo/name
   - Right: Small cyan pulsing status dot with \"Listening...\" text (when active) or \"Paused\" text (when paused)
   - Center: Start/Pause Listening button (large, accessible, minimum 48px touch target)
     - Active state: \"Pause\" button with bright cyan (#55C2E8) background
     - Paused state: \"Start\" button with glacier blue (#247CA8) background
     - Tapping toggles between active listening and paused states

2. **MAIN VISUAL (HERO Section)**
   - Large circular spatial sound map dominating the viewport
   - Center: User position marked with person icon and \"YOU\" label
   - Cardinal directions labeled: FRONT, LEFT, RIGHT, BACK
   - Visual style: Organic blend of radar, topographic elevation contours, glacier landscape, and flowing sound waves (non-military, calm, futuristic aesthetic)

3. **DETECTED SOUNDS Display**
   - Directional sound nodes positioned around the map based on sound source location
   - Each sound node is tappable and displays:
     - Sound name
     - Category icon
     - Confidence percentage badge
     - Direction vector (FRONT/LEFT/RIGHT/BACK and angle degree)
     - Relative timestamp (Just now, 2s ago, 8s ago, etc.)
   - Visual representation: Translucent glacier-blue elevation contour wave regions
   - Higher confidence/intensity produces:
     - Brighter, more defined contour waves
     - Subtle ripple animations
   - High-priority sounds (e.g., Alarm 98%) receive intense luminous glacier/ice-cyan glowing elevation contours and radiant ring bursts, maintaining the glacier brand aesthetic
   - Low-confidence sounds (<70%) display warning flag badge in pale ice blue (#C6E8F5)
   - Tapping any sound node opens Sound Details Modal

4. **Dynamic Detection Simulation Flow**
   - When a new sound triggers:
     - Directional sound marker appears at its spatial coordinate
     - Glacier-like contour waves expand smoothly around it (animated ripple expansion)
     - Sound name, category icon, confidence %, direction vector, and relative timestamp prominently displayed
     - Event is instantly prepended to Recent Sounds log with timestamp
     - Active sound visualization gradually decays/fades as it ages over time (decay from bright cyan wave into subtle background topography)
   - Waves animate and dynamically react to sound triggers in real-time

5. **Interactive State Indicators**
   - **Listening Paused State**: When user taps Pause button, map displays \"Listening Paused\" message in center with glacier blue overlay, status dot changes to \"Paused\" text
   - **No Sounds Detected State**: When no sounds detected for extended period, map displays \"No Sounds Detected\" message in center with subtle glacier wave animation
   - **Multiple Simultaneous Sounds State**: When multiple sounds detected simultaneously, all sound nodes displayed on map with spatial positioning, prioritized by urgency level

6. **Multi-dimensional Accessibility Information Architecture**
   - WHAT happened: Sound Name & Category Icon
   - WHERE it happened: Direction vector (FRONT, LEFT, RIGHT, BACK and angle degree)
   - WHEN it happened: Relative time (Just now, 2s ago, 8s ago, etc.)
   - HOW CONFIDENT: Crisp confidence percentage badge

7. **BOTTOM DECK Section**
   - Compact \"Recent Sounds\" list
   - Each row item displays:
     - Sound name
     - Direction
     - Time elapsed
     - Confidence percentage
   - Updates automatically when new sound events occur
   - Tapping any row item opens Sound Details Modal
   - \"See all ->\" link to navigate to History tab

**Design Principle**: Clean, uncluttered layout where the circular spatial sound map is the undisputed hero element.

### 3.4 Sound Details Modal

**Purpose**: Display comprehensive information about a detected sound event.

**Trigger**: Tapping any sound node on Map or any event in History timeline.

**Layout Structure**:

1. **Header Section**
   - Sound name (large, bold)
   - Category icon in glacier bubble
   - Close button (X) in top-right corner

2. **Core Information Display**
   - **Direction**: Visual compass indicator with angle degree (e.g., FRONT 0°, LEFT 270°)
   - **Confidence**: Percentage badge with visual confidence bar
   - **Time Detected**: Full timestamp (e.g., 2:41 PM, September 12, 2026)
   - **Acoustic Intensity**: Decibel level (dB) with visual intensity meter
   - **Priority Level**: Badge indicating High/Normal priority

3. **Frequency Profile Visualization**
   - Simplified frequency spectrum graph in glacier color palette
   - Shows dominant frequency ranges of detected sound

4. **Action Buttons**
   - **Dismiss** button: Closes modal and returns to previous screen
   - **Acknowledge** button: Marks event as acknowledged and closes modal

**Design Aesthetic**: Glacier-themed modal with translucent dark glacier navy (#032A43) background, bright cyan (#55C2E8) accents, accessible touch targets.

### 3.5 History Tab

**Purpose**: Comprehensive timeline and log of detected sound events with full filtering and search capabilities.

**Layout Structure**:

1. **Header Section**
   - Title: \"Sound History\"
   - Subtitle: \"Sounds you may have missed.\"
   - Search bar: Live search input field for filtering events by sound name
   - Export button: Opens Export Modal

2. **Flowing Glacier Sound-Wave Activity Graph**
   - Positioned at the top of the screen
   - Displays acoustic density and event peaks over the recent timeline
   - Visual style: SVG wave contours in glacier color palette (#55C2E8, #247CA8, #0B466D)
   - Shows temporal distribution of sound events

3. **Category Filters**
   - Filter options (tappable chips):
     - All (default active)
     - People (speech/voices)
     - Home (appliances, door knocks, doorbells)
     - Alerts (safety/emergencies)
     - Other (outdoor, vehicle, ambient)
   - Active filter highlighted in bright cyan (#55C2E8)
   - Tapping filter updates timeline to show only matching events

4. **Chronological Event Timeline Cards**
   - Each card displays:
     - Category icon in glacier bubble
     - Sound name (e.g. Door Knock, Name Called, Appliance Beep, Dog Bark, Alarm)
     - Direction (RIGHT, FRONT, LEFT, BACK)
     - Time (e.g. 2:41 PM, 2:38 PM, 2:35 PM, 2:31 PM)
     - Confidence % (e.g. 96%, 91%, 76%, 82%)
     - Priority badge if applicable (e.g. HIGH/Critical for alarms, Warning for knocks/chimes)
   - Cards are arranged in reverse chronological order (newest first)
   - Tapping any card opens Sound Details Modal
   - Swipe left on card reveals Delete action button

5. **Export Modal**
   - Triggered by tapping Export button in header
   - Options:
     - Export All Events (CSV format)
     - Export Filtered Events (based on current filter selection)
     - Export Date Range (user selects start and end dates)
   - Confirm and Cancel buttons

6. **Clear History Action**
   - \"Clear All History\" button at bottom of timeline
   - Tapping triggers confirmation dialog
   - Confirmation dialog displays warning message and Confirm/Cancel buttons

7. **Design Aesthetic**
   - Accessible, high-contrast, glacier-themed visual style matching Live Map
   - Consistent use of color palette and visual motifs

### 3.6 Alerts Tab

**Purpose**: Customizable critical sound triggers and notification settings with large, accessible controls and real-time state persistence.

**Layout Structure**:

1. **ALERT METHODS Section**
   - Section title: \"Alert Methods\"
   - Three large toggle controls (minimum 48px touch target):
     - **Visual Alerts** (ON/OFF)
       - Icon: Eye symbol
       - Description: Screen flashes and visual notifications
       - Active state: Bright cyan (#55C2E8) on dark glacier navy (#032A43)
       - Tapping toggles state and persists to SoundSightContext
     - **Haptic Alerts** (ON/OFF)
       - Icon: Vibration symbol
       - Description: Tactile physical vibrations
       - Active state: Bright cyan (#55C2E8) on dark glacier navy (#032A43)
       - Tapping toggles state and persists to SoundSightContext
     - **Spoken Alerts** (ON/OFF)
       - Icon: Speaker symbol
       - Description: Voice announcement for hard-of-hearing or low vision
       - Active state: Bright cyan (#55C2E8) on dark glacier navy (#032A43)
       - Tapping toggles state and persists to SoundSightContext

2. **IMPORTANT SOUNDS Section**
   - Section title: \"Important Sounds\"
   - Seven sound type controls, each with:
     - Sound icon
     - Sound name
     - Category badge
     - Large accessible toggle control (minimum 48px touch target)
     - Active state: Bright cyan (#55C2E8) on dark glacier navy (#032A43)
     - Tapping toggles state and persists to SoundSightContext
   - Sound types:
     - **Door Knock** (ON/OFF)
     - **Doorbell** (ON/OFF)
     - **Name Called** (ON/OFF)
     - **Alarm** (ON/OFF)
     - **Appliance Beep** (ON/OFF)
     - **Dog Bark** (ON/OFF)
     - **Baby Crying** (ON/OFF)

3. **PRIORITY Section**
   - Section title: \"Priority Settings\"
   - **Priority Levels Selector**:
     - Three options with clear visual emphasis:
       - High (critical sounds only)
       - Normal (all enabled sounds)
       - Muted (no alerts)
     - Active selection highlighted in bright cyan (#55C2E8)
     - Tapping option updates priority level and persists to SoundSightContext
   - **Master Filter Toggle**:
     - Label: \"Only alert me for important sounds\"
     - Large accessible toggle control (minimum 48px touch target)
     - Active state: Bright cyan (#55C2E8) on dark glacier navy (#032A43)
     - Tapping toggles state and persists to SoundSightContext

**Accessible Design Rules**:
- All touch targets minimum 48px
- High-contrast active states: bright cyan (#55C2E8) on dark glacier navy (#032A43)
- Clean glacier-blue styling throughout
- No tiny switches or excessive configuration clutter
- Clear visual hierarchy and spacing between sections
- All toggle states persist in real-time to SoundSightContext

### 3.7 Settings Tab

**Purpose**: App configuration and personalization with ultra-clean, uncluttered interface and full functional state persistence.

**Layout Structure**:

1. **DETECTION Section**
   - Section title: \"Detection\"
   - **Detection Sensitivity**:
     - Selector with three options: Low / Medium / High
     - Default: Medium
     - Description: Adjusts overall sound detection sensitivity
     - Active selection highlighted in bright cyan (#55C2E8)
     - Tapping option updates sensitivity and persists to SoundSightContext

2. **MAP Section**
   - Section title: \"Map\"
   - **Show Confidence** (ON/OFF toggle)
     - Controls visibility of confidence percentage badges on map
     - Tapping toggles state and persists to SoundSightContext
   - **Show Sound Intensity** (ON/OFF toggle)
     - Controls visibility of sound intensity visualization (contour wave brightness)
     - Tapping toggles state and persists to SoundSightContext
   - **Keep Events Visible**:
     - Selector with three options: 5s / 10s / 20s
     - Default: 10 seconds
     - Description: Duration before active sound visualizations begin to decay
     - Active selection highlighted in bright cyan (#55C2E8)
     - Tapping option updates duration and persists to SoundSightContext

3. **ACCESSIBILITY Section**
   - Section title: \"Accessibility\"
   - **Visual Alerts**:
     - Quick link / toggle with status indicator
     - Tapping navigates to Alerts tab Visual Alerts setting
   - **Haptic Alerts**:
     - Quick link / toggle with status indicator
     - Tapping navigates to Alerts tab Haptic Alerts setting
   - **Spoken Awareness**:
     - Quick link / toggle with status indicator
     - Tapping navigates to Alerts tab Spoken Alerts setting

4. **ONBOARDING Section**
   - Section title: \"Onboarding\"
   - **Re-launch Onboarding**:
     - Button labeled \"View Onboarding Again\"
     - Tapping this button re-launches the 3-screen onboarding experience
     - User can navigate through onboarding screens and return to Settings afterward

5. **PRIVACY Section**
   - Section title: \"Privacy\"
   - **Privacy Statement Card**:
     - Text: \"SoundSight analyzes environmental audio to identify sound events. Raw audio should not be stored unless explicitly enabled.\"
     - Styled as informational card in glacier color palette
   - **Raw Audio Storage** (ON/OFF toggle):
     - Default: OFF (disabled for privacy protection)
     - Description: When enabled, raw audio recordings are stored locally for debugging or custom training purposes
     - Tapping toggles state and persists to SoundSightContext

6. **DEMO MODE Section**
   - Section title: \"Demo Mode\"
   - Description: \"Trigger demo sound scenarios for testing and demonstration purposes.\"
   - Seven demo scenario buttons:
     - **Door Knock — Left** (270°, 94%)
     - **Door Knock — Right** (90°, 96%)
     - **Doorbell — Front** (0°, 87%)
     - **Name Called — Left** (280°, 91%)
     - **Appliance Beep — Back** (180°, 76%)
     - **Dog Bark — Right** (80°, 82%)
     - **Alarm — Front** (0°, 98%, High Priority)
   - Each button displays sound name, direction, and confidence percentage
   - Tapping any button triggers demo scenario:
     - Adds sound node to spatial map at exact direction
     - Animates expanding glacier contour waves
     - Displays confidence badge
     - Prepends event to Sound History timeline
     - Triggers alert response (haptic/visual strobe) based on current alert settings

7. **ABOUT Section**
   - Section title: \"About\"
   - **App Name**: SoundSight
   - **Tagline**: \"See where sound happens.\"
   - **App Version**: Display current version number
   - **Brand Design Statement**: Brief description of glacier-inspired visual theme and accessibility mission

**Design Guidelines**:
- Ultra-clean, uncluttered interface avoiding unnecessary technical parameters
- Glacier color palette (#032A43, #0B466D, #55C2E8, #C6E8F5, #F7FBFD)
- All touch targets minimum 48px
- High-contrast active states: bright cyan (#55C2E8) on dark glacier navy (#032A43)
- Clear visual hierarchy and spacing between sections
- All settings persist in real-time to SoundSightContext

## 4. Business Rules and Logic

### 4.1 Onboarding Flow Logic

- Onboarding experience is displayed only on first app launch
- User can swipe right or tap \"Next\" button to advance through screens
- \"Skip\" option is available on Screen 1 and Screen 2, allowing user to bypass onboarding and proceed directly to microphone permission request
- On Screen 3, tapping \"Start SoundSight\" button triggers microphone permission request
- Upon microphone permission grant, user is navigated to Map tab (Live Sound Map)
- Upon microphone permission denial, prompt requesting microphone access is displayed
- User can re-launch onboarding experience from Settings tab by tapping \"View Onboarding Again\" button
- When re-launched from Settings, onboarding does not trigger microphone permission request again; user returns to Settings after completing onboarding screens

### 4.2 Sound Detection and Classification

- The app continuously monitors environmental sounds through the device microphone when in active listening state
- Detected sounds are classified into categories: Safety/Emergency, Speech & Voices, Household & Appliances, Outdoor/Traffic
- Each detected sound is assigned a confidence percentage (0-100%)
- Sound direction is determined using spatial audio processing and device orientation sensors

### 4.3 Start/Pause Listening Logic

- Start/Pause Listening button toggles between active listening and paused states
- Active state: Microphone actively monitors environmental sounds, status indicator displays \"Listening...\" with pulsing cyan dot
- Paused state: Microphone monitoring stops, status indicator displays \"Paused\", map displays \"Listening Paused\" message with glacier blue overlay
- Tapping Start button resumes active listening
- Listening state persists across app sessions

### 4.4 Sound Node Interaction Logic

- All sound nodes on Map are tappable
- Tapping any sound node opens Sound Details Modal
- Sound Details Modal displays comprehensive information: sound name, direction, confidence %, time detected, acoustic intensity (dB), priority level, frequency profile
- User can dismiss modal by tapping Close button (X) or Dismiss button
- User can acknowledge event by tapping Acknowledge button, which marks event as acknowledged and closes modal

### 4.5 Urgency Level Assignment

- High Urgency sounds (Fire Alarms, Door Knocks, Baby Crying, Siren) trigger immediate alerts
- Medium/Low Urgency sounds are displayed on the map but do not trigger alerts unless user-configured
- Urgency level affects alert behavior: visual intensity, vibration pattern, and notification priority

### 4.6 Detection Mode Behavior

- The app operates in live detection mode by default when listening is active
- All detected sounds are visualized on the circular spatial sound map with directional positioning

### 4.7 Historical Data Storage

- All detected sound events are automatically logged with timestamp, sound type, confidence %, direction, and urgency level
- Historical data is stored locally on the device
- Users can export logs or clear them manually

### 4.8 Custom Sound Training

- Users can record and label specific sounds in their environment
- The app learns to recognize these custom sounds and adds them to the detection library
- Custom sounds can be assigned urgency levels and alert behaviors

### 4.9 Dynamic Sound Visualization Decay

- Active sound visualizations gradually decay over time
- Decay progression: bright cyan wave → subtle background topography
- Decay rate is proportional to sound age and urgency level
- Decay start time is controlled by \"Keep Events Visible\" setting (5s / 10s / 20s)

### 4.10 Demo Mode Scenario Triggering

- Demo Mode is accessible from Settings tab
- Seven predefined demo scenarios available:
  - Door Knock — Left (270°, 94%)
  - Door Knock — Right (90°, 96%)
  - Doorbell — Front (0°, 87%)
  - Name Called — Left (280°, 91%)
  - Appliance Beep — Back (180°, 76%)
  - Dog Bark — Right (80°, 82%)
  - Alarm — Front (0°, 98%, High Priority)
- When user taps any demo scenario button:
  - Sound node appears on spatial map at exact direction and angle
  - Glacier contour waves animate and expand from sound position
  - Confidence badge displays specified percentage
  - Event is prepended to Sound History timeline with current timestamp
  - Alert response triggers based on current alert settings (haptic vibration, visual strobe flash)
- Demo scenarios simulate complete detection flow identical to real sound detection

### 4.11 Alert Methods Logic

- Visual Alerts: When enabled, screen flashes and visual notifications appear for detected important sounds
- Haptic Alerts: When enabled, device vibrates with tactile patterns corresponding to sound type
- Spoken Alerts: When enabled, voice announcements describe detected sounds for users with low vision or additional accessibility needs
- Multiple alert methods can be enabled simultaneously
- Alert method states persist in SoundSightContext

### 4.12 Important Sounds Configuration

- Each sound type (Door Knock, Doorbell, Name Called, Alarm, Appliance Beep, Dog Bark, Baby Crying) can be individually enabled or disabled
- Only enabled sounds trigger alerts based on selected alert methods
- Disabled sounds are still detected and logged but do not trigger alerts
- Important sound states persist in SoundSightContext

### 4.13 Priority Settings Logic

- High Priority: Only critical sounds (Alarm, Baby Crying) trigger alerts
- Normal Priority: All enabled sounds trigger alerts
- Muted Priority: No alerts are triggered, but sounds are still detected and logged
- Master filter toggle \"Only alert me for important sounds\" overrides individual sound settings when enabled
- Priority settings persist in SoundSightContext

### 4.14 Detection Sensitivity Logic

- Low Sensitivity: Reduces false positives, requires higher confidence threshold for detection
- Medium Sensitivity: Balanced detection (default)
- High Sensitivity: Increases detection rate, may produce more false positives
- Sensitivity setting persists in SoundSightContext

### 4.15 Map Display Settings Logic

- Show Confidence: When enabled, confidence percentage badges are displayed on map sound nodes; when disabled, badges are hidden
- Show Sound Intensity: When enabled, sound intensity is visualized through contour wave brightness; when disabled, all sounds use uniform visualization
- Keep Events Visible: Controls duration before sound visualizations begin to decay (5s / 10s / 20s)
- Map display settings persist in SoundSightContext

### 4.16 Privacy and Raw Audio Storage Logic

- By default, Raw Audio Storage is OFF for privacy protection
- When Raw Audio Storage is enabled, raw audio recordings are stored locally on the device
- Raw audio is used for debugging, custom sound training, or user review purposes
- Users can delete stored raw audio at any time
- Raw audio storage setting persists in SoundSightContext

### 4.17 History Tab Filtering and Search Logic

- Category filters (All, People, Home, Alerts, Other) update timeline to show only matching events
- Active filter highlighted in bright cyan (#55C2E8)
- Live search input filters events by sound name in real-time
- Tapping any event card opens Sound Details Modal
- Swipe left on event card reveals Delete action button
- Tapping Delete removes event from timeline
- \"Clear All History\" button triggers confirmation dialog before deleting all events

### 4.18 History Export Logic

- Export button in History tab header opens Export Modal
- Export options:
  - Export All Events: Exports all logged events in CSV format
  - Export Filtered Events: Exports events matching current filter selection in CSV format
  - Export Date Range: User selects start and end dates, exports events within range in CSV format
- Exported file includes: timestamp, sound name, direction, confidence %, priority level, acoustic intensity

### 4.19 Low Confidence Warning Logic

- Sounds detected with confidence percentage below 70% display warning flag badge in pale ice blue (#C6E8F5)
- Warning flag indicates potential false positive or uncertain detection
- Low-confidence sounds are still logged and displayed on map

### 4.20 Multiple Simultaneous Sounds Logic

- When multiple sounds detected simultaneously, all sound nodes displayed on map with spatial positioning
- Sounds prioritized by urgency level: High Urgency sounds displayed with more prominent visual emphasis
- Recent Sounds deck updates to show all simultaneous events
- User can tap any sound node to view details in Sound Details Modal

## 5. Exceptions and Edge Cases

| Scenario | Handling |
|----------|----------|
| User skips onboarding on first launch | Microphone permission request is triggered immediately; user proceeds to Map tab upon permission grant |
| User denies microphone permission during onboarding | Display prompt requesting microphone access; app cannot function without it |
| User re-launches onboarding from Settings | Onboarding screens are displayed; microphone permission request is not triggered again; user returns to Settings after completing onboarding |
| Microphone permission denied | Display banner at top of Map screen with \"Microphone Access Required\" message and \"Enable\" action button; tapping button opens system settings |
| Listening paused by user | Map displays \"Listening Paused\" message in center with glacier blue overlay; status indicator shows \"Paused\" text; no sound detection occurs |
| No sounds detected for extended period | Map displays \"No Sounds Detected\" message in center with subtle glacier wave animation; Recent Sounds deck remains empty |
| Low confidence detection (<70%) | Sound node displays warning flag badge in pale ice blue (#C6E8F5); event logged normally |
| Multiple simultaneous sounds | All sound nodes displayed on map with spatial positioning; prioritized by urgency level; Recent Sounds deck shows all events |
| Low microphone sensitivity | Prompt user to calibrate microphone in Settings |
| Compass/gyroscope unavailable | Display warning; directional detection may be inaccurate |
| Background app usage | Continue sound detection and send notifications when critical sounds are detected |
| Device in silent/Do Not Disturb mode | Vibration and visual alerts still function; respect system notification settings |
| Export logs failure | Display error message; retry option provided |
| Custom sound training failure | Display error message; suggest re-recording or adjusting sensitivity |
| All alert methods disabled | Display warning message; user will not receive any alerts |
| All important sounds disabled | Display warning message; no sounds will trigger alerts |
| Priority set to Muted | Display confirmation; no alerts will be triggered |
| Raw Audio Storage enabled with insufficient storage | Display warning; prompt user to free up storage space or disable Raw Audio Storage |
| Detection Sensitivity set to High with excessive false positives | Suggest user adjust sensitivity to Medium or Low |
| Demo Mode scenario triggered while listening paused | Demo scenario executes normally; sound node appears on map, event logged, alerts triggered |
| User taps sound node that has decayed | Sound Details Modal opens with full event information retrieved from history |
| User attempts to export empty history | Display message \"No events to export\" |
| User attempts to clear empty history | Display message \"History is already empty\" |

## 6. Acceptance Criteria

1. User opens SoundSight app for the first time and lands on Onboarding Screen 1
2. User swipes right or taps \"Next\" to advance through Screen 1 and Screen 2
3. User reaches Onboarding Screen 3 and taps \"Start SoundSight\" button
4. App triggers microphone permission request
5. User grants microphone permission
6. App navigates to Map tab with live detection mode active, Start/Pause button displays \"Pause\" state
7. User navigates to Settings tab and scrolls to Demo Mode section
8. User taps \"Alarm — Front (0°, 98%, High Priority)\" demo scenario button
9. App displays alarm sound node at FRONT position (0°) with intense luminous glacier/ice-cyan glowing elevation contours and radiant ring bursts
10. Sound information is displayed: sound name (Alarm), category icon, confidence percentage badge (98%), direction vector (FRONT 0°), and relative timestamp (Just now)
11. Event is instantly prepended to Recent Sounds log in the bottom deck and Sound History timeline
12. Alert response triggers: haptic vibration and visual strobe flash (based on current alert settings)
13. User taps the alarm sound node on the map
14. Sound Details Modal opens displaying comprehensive information: sound name, direction, confidence %, time detected, acoustic intensity (dB), priority level (High), and frequency profile
15. User taps \"Dismiss\" button to close modal
16. User observes the active sound visualization gradually decaying from bright cyan wave into subtle background topography over time
17. User navigates to History tab and views the logged alarm event in the timeline
18. User taps the alarm event card in History timeline
19. Sound Details Modal opens again with full event information

## 7. Out of Scope for This Release

- Social sharing or community features
- Cloud synchronization of sound logs across devices
- Integration with smart home devices or IoT systems
- Multi-language support beyond English
- Wearable device integration (smartwatch alerts)
- Advanced AI chatbot or voice assistant
- In-app purchases or subscription models
- Offline sound library downloads
- Video recording or camera-based features
- Third-party API integrations for weather, news, or other external data
- User accounts, login, or registration system
- Custom vibration pattern configuration for individual sound types
- Visual strobe flash customization (color, intensity, duration)
- Advanced sensitivity thresholds per sound category
- Microphone calibration functionality
- Spatial orientation calibration functionality
- Emergency contacts configuration