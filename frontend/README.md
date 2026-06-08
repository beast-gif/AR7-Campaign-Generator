# AR7 Campaign Generator

An AI-powered multi-format content campaign tool. Feed it a **seed** (what the campaign is about) and a **vibe** (the aesthetic direction) — it generates a full brand package in 15–25 seconds.

![AR7 Campaign Generator](./docs/preview.png)

---

## What it generates

| Output | Description |
|--------|-------------|
| **Brand DNA** | Brand name, manifesto, taglines, color palette, typography, voice & tone, sound direction |
| **X Thread** | 6–8 tweet thread with hook, body, CTA and hashtags |
| **LinkedIn Post** | Long-form post with hook, narrative body, CTA and hashtags |
| **IG Carousel** | 7-slide carousel with headline, body copy and caption |
| **ZIP Bundle** | Everything packaged for download |

---

## Tech Stack

### Frontend
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- React Router + TanStack Query
- canvas-confetti, html2canvas, jsPDF

### Backend
- FastAPI (Python)
- Google Gemini (google-genai SDK) — text generation + structured Brand DNA
- Pillow — carousel slide composition
- Pydantic — schema validation

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google Gemini API key

### 1. Clone
```bash
git clone https://github.com/YOUR_USERNAME/ar7-campaign-generator.git
cd ar7-campaign-generator
```

### 2. Backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1       # Windows PowerShell
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:
```env
GEMINI_API_KEY=your_key_here
```

Start the server:
```powershell
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`

### 3. Frontend
```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/dna` | Generate Brand DNA JSON |
| POST | `/generate/thread` | Generate X Thread |
| POST | `/generate/linkedin` | Generate LinkedIn post |
| POST | `/generate/carousel` | Generate IG Carousel copy |
| POST | `/compose/carousel` | Render carousel slides (Pillow) |
| POST | `/campaign` | Full pipeline — returns ZIP |
| GET | `/download/{id}` | Download ZIP bundle |

### Request body (all endpoints)
```json
{
  "seed": "A cold brew brand for night-shift workers who treat sleep as optional",
  "vibe": "Cyberpunk underground, neon-soaked, typographically aggressive"
}
```

---

## Project Structure
ar7-campaign-generator/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + CORS
│   │   ├── routes/          # Endpoint handlers
│   │   ├── services/        # Gemini calls, Pillow composition
│   │   └── schemas/         # Pydantic models
│   └── requirements.txt
│
└── frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx  # Input page + preloader
│   │   └── Canvas.tsx   # Campaign output (4 tabs)
│   ├── lib/
│   │   └── api.ts       # Backend client
│   ├── types/
│   │   └── api.ts       # TypeScript types
│   └── index.css        # Full design system
└── vite.config.ts
---

## Design System

**Theme:** Brutalist Streetwear + Deep Navy

| Token | Value |
|-------|-------|
| Background | `#06091A` |
| Accent | `#FF2D00` |
| Typography | Impact (hero) + Space Mono (UI) + Bebas Neue (data) |
| Aurora | Electric blue / teal / indigo |

---

## Known Limitations

- **Image generation parked** — `/generate/poster` uses a placeholder. fal.ai (zero balance) and Gemini image model (regional quota) are both deferred.
- **No persistent storage** — campaigns are not saved server-side. Share links use `localStorage` and are browser-local only.
- **Single user** — no auth, no multi-tenancy. Built for personal/demo use.

---

## Roadmap (v0.2)

- [ ] fal.ai / Flux image generation when balance is restored
- [ ] iPhone mockup for IG Carousel tab
- [ ] Postgres + Cloudflare R2 storage layer
- [ ] Redis job queue for async generation
- [ ] Selective regeneration per format

---

## Built by

Amrith — EAC student, AI/ML enthusiast.  
Built with Google Gemini, FastAPI, and React.
