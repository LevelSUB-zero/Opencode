# Hugging Face Spaces Deployment

Open Design on Hugging Face Spaces free tier (no credit card required).

## Prerequisites

- A [Hugging Face account](https://huggingface.co/join)
- A [NVIDIA NIM API key](https://build.nvidia.com) (for the LLM backend)
- A [Vercel token](https://vercel.com/account/tokens) (for website deployment)

## Quick start

### 1. Create a new Space

1. Go to https://huggingface.co/new-space
2. Set **Space name** (e.g. `design`)
3. Choose **Docker** as the Space SDK
4. Choose **CPU** (free tier)
5. Set **Space hardware** to CPU basic (free)
6. Click **Create Space**

### 2. Push the Dockerfile

```bash
git clone https://huggingface.co/spaces/<your-username>/<space-name>
cd <space-name>

# Copy the Dockerfile from this directory
cp path/to/deploy/hf-space/Dockerfile .

git add Dockerfile
git commit -m "Deploy Open Design"
git push
```

The first build takes ~15 minutes (Node deps + better-sqlite3 compilation
+ Next.js build). Subsequent builds use cached layers.

### 3. Access your instance

```
https://<your-username>-<space-name>.hf.space
```

Open this URL in any browser, including from your phone.

### 4. Configure the LLM (API mode)

The Space uses the daemon's built-in API mode (no local agent CLI needed):

1. Open Settings → Mode → **API mode**
2. Set **Base URL** to: `https://integrate.api.nvidia.com/v1`
3. Set **API Key** to your NVIDIA NIM API key
4. Set **Protocol** to: `openai`
5. Choose a model (e.g. `meta/llama-3.1-405b-instruct`)

### 5. Configure Vercel deployment

1. Open Settings → **Deploy**
2. Add your Vercel token and team ID
3. Custom domains can be configured via the `--domain` flag or deploy modal

### 6. Create and publish a website

Chat with the agent:

> "publish website"  
> "create a landing page for a SaaS product and deploy it"  
> "build from https://example.com and publish to my domain"

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `OD_PORT` | `7860` | HTTP port (HF Spaces default) |
| `OD_BIND_HOST` | `0.0.0.0` | Bind address |
| `OD_DATA_DIR` | `/data/.od` | Persistent storage (survives restarts) |
| `NODE_OPTIONS` | `--max-old-space-size=384` | Node.js heap limit |
| `OPEN_DESIGN_REPO` | `https://github.com/KratosZeus/open-design.git` | Git repo to build from |
| `OPEN_DESIGN_REF` | `main` | Git branch/ref to build |

## Notes

- Persistent data (`/data/.od`) contains SQLite database, app config, and
  uploaded files. This survives Space restarts.
- CPU free tier may sleep after extended inactivity. Wake by visiting URL.
- To update the daemon version, trigger a new build on HF Spaces
  (Settings → Factory rebuild).
