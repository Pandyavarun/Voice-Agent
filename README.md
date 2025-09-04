# Voice Agent

Interactive real‑time voice/chat demo using [Pipecat](https://github.com/pipecat-ai) with a FastAPI (or raw websocket) backend and a Vite + TypeScript browser client. The bot streams audio responses using Gemini Multimodal Live and handles bi‑directional audio + transcripts over websockets.

---
## ✨ Features
* FastAPI WebSocket endpoint (`/ws`) with optional standalone websocket server mode
* Live microphone streaming, VAD (Silero) based turn detection
* Gemini Multimodal Live LLM with configurable voice (Puck, Aoede, etc.)
* Context aggregation + initial system + user priming message
* Real‑time user + bot transcript logging in the browser
* Simple connect / disconnect controls

---
## � Project Structure
```
server/        Python backend (FastAPI + optional raw websocket server)
client/        Vite + TypeScript front-end
.env           (create from env.example – not committed)
```

---
## 🔑 Prerequisites
* Python 3.10+
* Node.js 18+ (recommended; 16+ may work but 18+ aligns with modern toolchains)
* A Google Gemini API key (`GOOGLE_API_KEY`)

---
## ⚙️ 1. Server Setup (run this first)
From repository root:

```bash
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r server/requirements.txt
```

Create your environment file:
```bash
cp server/env.example .env
```
Edit `.env` and set at minimum:
```
GOOGLE_API_KEY=your_key_here
# Select backend mode: fast_api | websocket_server
WEBSOCKET_SERVER=fast_api
```

Start the server (always do this before opening the client):
```bash
python server/server.py
```

Default endpoints:
* Health check: `GET http://localhost:7860/health`
* WebSocket (FastAPI mode): `ws://localhost:7860/ws`
* Connection bootstrap: `POST http://localhost:7860/connect` (returns the ws URL the client should use)
* Raw websocket mode (if `WEBSOCKET_SERVER=websocket_server`): separate internal server on `ws://localhost:8765`

Mode logic: The FastAPI app always runs on port 7860. If `WEBSOCKET_SERVER=websocket_server`, an additional Pipecat websocket server starts (8765) and `/connect` tells the client to use that URL instead of `/ws`.

---
## 🖥 2. Client Setup & Run
In a second terminal:
```bash
cd client
npm install
npm run dev
```

Open the printed Vite dev URL (typically `http://localhost:5173`). Then:
1. Allow microphone permission when prompted.
2. Click **Connect** – the client calls `http://localhost:7860/connect` to get the appropriate websocket URL.
3. Speak; user and bot transcripts + timing appear in the debug panel. Audio responses auto‑play.
4. Click **Disconnect** to end the session.

Build production bundle (optional):
```bash
npm run build
```
Preview production build:
```bash
npm run preview
```

---
## 🔄 Changing Voice or Behavior
Edit `voice_id` or the `SYSTEM_INSTRUCTION` strings in:
* `server/bot_fast_api.py`
* `server/bot_websocket_server.py`

Restart the server after changes.

---
## 🧪 Quick Smoke Test Checklist
| Step | Expectation |
|------|-------------|
| Server start | Logs show uvicorn running on 0.0.0.0:7860 |
| Health check | `{"status":"ok"}` |
| Connect click | Status transitions Disconnected → Connected |
| Speak | User transcript lines (blue) appear |
| Bot reply | Bot transcript lines (green) + audible response |

---
## � Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| 401 / auth errors | Missing or bad `GOOGLE_API_KEY` | Re‑set key in `.env`, restart server |
| No audio from bot | Mic blocked or track not attached | Allow mic, check console for track setup logs |
| Connect stays pending | Wrong port or server not started | Ensure `python server/server.py` is running first |
| CORS errors | Server not allowing origin | CORS wildcard is already enabled; confirm you use `http://localhost:*` |
| Websocket closes immediately | Using wrong mode URL | Confirm value of `WEBSOCKET_SERVER` and `/connect` response |

View browser console + server logs for stack traces.

---
## � Environment Variables Reference
| Name | Required | Description |
|------|----------|-------------|
| GOOGLE_API_KEY | Yes | Gemini API key for LLM & audio streaming |
| WEBSOCKET_SERVER | No | `fast_api` (default) or `websocket_server` (enables raw server on :8765) |

---
## 🚀 Extending
Ideas:
* Inject additional context turns (modify `OpenAILLMContext` init list)
* Add sentiment or latency metrics via observers
* Cache conversation history server‑side
* Switch to another supported LLM service

---
## 🧹 Housekeeping
`.gitignore` excludes local env, build, and media artifacts. Commit only `env.example`, never your real `.env`.

---
## 📜 License
BSD 2‑Clause (see headers in source files).

---
Happy building! 