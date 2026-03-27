# AGENTS.md

This file provides guidance to AI Agents when working with code in this repository.

## Commands

Run from the repo root (npm workspaces):

```bash
npm run dev        # Start both client (port 3000) and server (port 3001) concurrently
npm run build      # Build both apps
npm run lint       # Lint both apps
```

Run per workspace:

```bash
npm run dev -w apps/client    # Next.js dev server (port 3000)
npm run dev -w apps/server    # Express dev server with tsx watch (port 3001)
npm run build -w apps/client  # next build
npm run build -w apps/server  # tsc (outputs to dist/)
```

There are no tests currently.

## Architecture

**What it does**: Converts text into a WAV audio file where the spectrogram (frequency-time visualization) of the audio visually spells out the input text.

**Monorepo** with two apps (`apps/client`, `apps/server`) linked via npm workspaces.

### Server (`apps/server/src/`)

- [index.ts](apps/server/src/index.ts): Express app. Two endpoints: `GET /health` and `POST /convert` (accepts `{text: string}`, returns `audio/wav` blob). CORS enabled.
- [spectrogram.ts](apps/server/src/spectrogram.ts): Core conversion pipeline — text → glyph pixel columns → sine wave synthesis → PCM → WAV binary. Audio params: 44.1 kHz, mono, 16-bit PCM, 1024 samples/column, 1000–8000 Hz frequency range, Hann windowing.
- [font.ts](apps/server/src/font.ts): Extracts per-character pixel glyphs from the `js-pixel-fonts` library (sevenPlus font, 7px tall).

### Client (`apps/client/src/`)

- [app/(pages)/page.tsx](apps/client/src/app/(pages)/page.tsx): Root page. Owns `blob` state (the WAV file), passes setters down to ConvertForm and the blob itself to Spectrogram.
- [features/convert/convert-form.tsx](apps/client/src/features/convert/convert-form.tsx): Text input form. POSTs to server via Axios, updates blob state, creates object URL for download link.
- [features/convert/spectrogram.tsx](apps/client/src/features/convert/spectrogram.tsx): WaveSurfer.js visualization with the Spectrogram plugin — shows waveform and frequency heatmap of the returned audio.
- [lib/api.ts](apps/client/src/lib/api.ts): Axios instance configured from `NEXT_PUBLIC_API_URL` env var.

### Environment

- Client: `apps/client/.env` — set `NEXT_PUBLIC_API_URL=http://localhost:3001`
- Server: `apps/server/.env` — no required variables; server listens on `PORT` (default 3001)

### Key constraint

Text input is limited to 200 characters (enforced in server's `/convert` handler).
