# Antaria

AI-powered drug-discovery platform by Atregenix.

## Repository structure

```
apps/
  web/        Next.js 14 App Router (TypeScript, Tailwind v4)
  engine/     Python FastAPI scoring engine
.env.example  Environment variable template
```

## Quick start

### Prerequisites

- Node.js 22+
- Python 3.11+ (or Conda)
- An Anthropic API key (for Ana)

### 1. Environment

```bash
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local and add your ANTHROPIC_API_KEY
```

### 2. Web application

```bash
cd apps/web
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 3. Python engine (optional for Phase 1–2)

Using conda:

```bash
cd apps/engine
conda env create -f environment.yml
conda activate antaria-engine
uvicorn app.main:app --reload --port 8000
```

Using pip:

```bash
cd apps/engine
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Design system

| Token | Value | Usage |
|-------|-------|-------|
| `--navy` | `#0A1B3D` | Primary brand ink |
| `--blue` | `#1E6BE6` | Primary action |
| `--cyan` | `#1FB6D6` | Secondary accent |
| `--bg` | `#F5F8FC` | App background |
| `--green` | `#16A375` | Positive/success |
| `--amber` | `#D9962B` | Warning |
| `--red` | `#E0524D` | Error/alert |

Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (data labels).

## Phases

- **Phase 1–2** (current): Scaffold, app shell, home dashboard, Ana copilot
- **Phase 3**: Bayesian scoring engine integration, real ChEMBL/UniProt data
- **Phase 4**: Three.js molecular viewer, Supabase persistence, auth
- **Phase 5**: Full pipeline — experiments, trials, reports, scenario simulation
