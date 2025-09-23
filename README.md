## MAX AI

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

---

# MAX AI – Full Documentation

Max AI is a voice-first personal assistant with Jarvis-like capabilities. It combines a modern React UI with a Python Flask backend to deliver natural conversation, wake-word voice control, face authentication, task automation, predictive suggestions, and continuous learning.

## Highlights

- **Voice-first UX**: Wake word (“Hey Max”), live listening indicators, chimes, floating mic control, barge-in, and auto-listen.
- **Face authentication**: Local face enrollment and verification with fallbacks to remain portable.
- **Smarter answers over time**: Feedback-driven memory and semantic retrieval (MiniLM embeddings) to recall previously taught Q/A.
- **Task automation**: System info, file sandbox operations, email/calendar helpers, basic app open routines.
- **Predictive suggestions**: Lightweight proposals based on context and heuristics.
- **Beautiful UI**: Vite + React + TypeScript + Tailwind + shadcn/ui with a 3D hologram (`ThreeJSBubble`).

## Architecture

- **Frontend** (`src/`):
  - React + Vite + TypeScript
  - UI: TailwindCSS + shadcn/ui
  - Voice & Speech: `src/utils/VoiceRecognition.ts`, `src/utils/SpeechSynthesis.ts`
  - Core container: `src/components/MaxCore.tsx`
  - Hologram: `src/components/ThreeJSBubble.tsx`
  - Preferences: `src/components/PreferencesPanel.tsx`
  - API client: `src/utils/MaxJarvisAPI.ts`

- **Backend** (`backend/`):
  - Flask API: `backend/max_jarvis_api.py`
  - SQLite persistence: conversations, training_data, preferences
  - Retrieval: TF cosine + (optional) semantic embeddings via `sentence-transformers` (MiniLM)
  - Features: chat, files sandbox, predictive proposals, voice wake, face enroll/verify, system info, email/calendar helpers

## Quick Start (Local)

Prereqs: Node 18+, Python 3.9+, npm, pip.

```
# Install frontend deps (first run only)
npm install

# Launch both backend and frontend
./run.sh

# Backend: http://localhost:5001
# Frontend: http://localhost:8080 (note: banner may still mention 5173)
```

If you see a Flask warning about production, that’s expected for local dev.

### Backend dependencies

For best answers and memory recall, install embeddings:

```
pip3 install sentence-transformers
```

This enables semantic retrieval (MiniLM) with graceful fallback to TF-based retrieval if not installed.

## Voice-First UX

- Wake word (“Hey Max”), listening chime, and status banner.
- Floating mic toggle for hands-free control.
- Preferences → Voice UX:
  - Enable chime, chime volume
  - Auto-listen after wake
  - Allow barge-in (interrupt TTS with wake word)
  - Silence timeout

Relevant files:
- `src/components/MaxCore.tsx`
- `src/components/PreferencesPanel.tsx`
- `src/components/ThreeJSBubble.tsx`

## Face Authentication

Enroll and verify locally:
- Endpoints: `/api/face/enroll`, `/api/face/verify`
- Uses `face_recognition` when available, falls back to Mediapipe-like portable path, and final simple embedding fallback.

## Learning & Memory

- Send feedback on good answers to log high-score training samples.
- Retrieval uses:
  - `training_data` with positive feedback
  - Recent `conversations`
- Semantic retrieval (if installed) short-circuits with a learned answer when similarity is high; else augments context for better grounding.

## Android APK (Capacitor)

You can package the frontend as an Android app that talks to the Mac backend over Wi‑Fi.

1. Install Capacitor & Android platform:
   ```
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Max AI" com.maxai.app --web-dir=dist
   npm run build
   npx cap add android
   npx cap sync android
   ```
2. Allow cleartext HTTP to your LAN backend:
   - Edit `android/app/src/main/AndroidManifest.xml` application tag:
     ```
     <application
         android:usesCleartextTraffic="true"
         android:networkSecurityConfig="@xml/network_security_config"
         ...>
     ```
   - Create `android/app/src/main/res/xml/network_security_config.xml` with your LAN IP:
     ```
     <?xml version="1.0" encoding="utf-8"?>
     <network-security-config>
       <domain-config cleartextTrafficPermitted="true">
         <domain includeSubdomains="true">192.168.0.186</domain>
         <domain includeSubdomains="true">10.0.2.2</domain>
         <domain includeSubdomains="true">localhost</domain>
       </domain-config>
     </network-security-config>
     ```
   - Ensure permissions (INTERNET, RECORD_AUDIO, CAMERA) are present in the manifest.
3. Build APK:
   ```
   cd android
   ./gradlew assembleDebug
   # APK: android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. Install on device:
   ```
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
5. In the app, set backend URL:
   - Preferences → Backend → `http://YOUR-LAN-IP:5001`

## Configuration

- Frontend backend URL: stored in `localStorage['max_backend_url']`.
  - UI: Preferences → Backend
  - Code: `src/utils/MaxJarvisAPI.ts`
- Backend environment (optional):
  - Gmail: `GMAIL_USER`, `GMAIL_APP_PASSWORD`

## API Endpoints (selected)

- `GET /api/status` – health and capabilities
- `POST /api/chat` – main chat endpoint (uses retrieval + NLP)
- `POST /api/learning/feedback` – store feedback/training sample
- `GET /api/learning/status` – aggregated feedback metrics
- `POST /api/files/*` and `GET /api/files/list` – sandboxed file ops in `data/user_files`
- `POST /api/predict/ack` and `GET /api/predict/proposals` – predictive suggestions
- `POST /api/voice/wake` – wake handler
- `POST /api/face/enroll`, `POST /api/face/verify` – face features
- `POST /api/integrations/gmail/send` – Gmail
- `POST /api/integrations/calendar/create` – ICS generator

## Development Scripts

```
npm run dev       # Vite dev server (frontend)
npm run build     # Build production web (dist/)
./run.sh          # Launch backend + frontend together
```

## Troubleshooting

- **Backend missing Flask**: `pip3 install flask flask-cors`
- **LibreSSL warning**: Harmless for local dev.
- **“uv_cwd” on Node commands**: Open a fresh terminal and `cd` into the project; ensure the external drive is mounted.
- **Android HTTP blocked**: Confirm `usesCleartextTraffic` and `networkSecurityConfig` are set and include your LAN IP.
- **Mic/Camera on Android**: Ensure permissions in the manifest and accept runtime prompts.

## License

MIT (unless a different license file exists in this repository).
