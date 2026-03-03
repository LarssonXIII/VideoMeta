# YouTube SEO Automator

YouTube SEO Automator is a web application that allows you to automatically generate high-quality, SEO-optimized metadata (title, description, tags) for your YouTube videos using AI.

By using either OpenAI (Whisper) or Google Gemini Audio, the platform extracts exactly what is being said in your video files (or the audio from existing YouTube links). The text is then sent to your preferred AI model (ChatGPT, Claude, Gemini, or local models via Ollama) to tailor a perfect description in three different formats: "Storytelling", "How-To/Informative", and "SEO-Max".

## Features
* **Drag-and-Drop:** Easily upload `.mp4`, `.mov`, or `.mp3` files.
* **YouTube Links:** Paste a YouTube link directly – the app automatically downloads the audio stream in the background.
* **AI Transcription:** Choose between top-tier speech recognition models (OpenAI Whisper or Google Gemini Audio) to convert speech to text.
* **Multiple AI Providers:** Craft your YouTube description using ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), or completely local and free models (Ollama).
* **Three Perspectives:** Always get three unique video description options and a list of customized SEO tags.
* **Privacy via Settings:** No private API keys are stored in the browser. Enter them in the app's "Settings" menu, and they are securely saved to the server's `.env` file.

## Technical Stack
This application is built with modern web technologies:
* **Frontend:** React, Vite, TypeScript, Vanilla CSS (No heavy UI libraries).
* **Backend:** Node.js, Express, `fluent-ffmpeg` (Audio extraction), `@distube/ytdl-core` (YouTube downloading).

## Prerequisites
*(Since this is a Node.js / JavaScript project, a Python-specific `requirements.txt` is not used. All dependencies are handled automatically via `package.json`)*

You need the following installed on your computer to run the project:
1. **Node.js** (version 20.19.0+ or 22.12.0+ is required for Vite 7). [Download Node.js here](https://nodejs.org/).
2. One or more **API keys** from OpenAI, Anthropic, or Google, depending on which AI you wish to use. (If running locally via Ollama, no keys are required).

## Installation & Usage

**1: Download the project and install dependencies**
Open a terminal in the project folder and run:
```bash
npm install
```
This command reads `package.json` and installs all packages (including built-in ffmpeg handling) necessary to run the project.

**2: Start the application**
Once installation is complete, start both the frontend and backend simultaneously with the command:
```bash
npm run dev
```

**3: Open in Browser**
Go to `http://localhost:5173/` in your browser.
The first time you start the app, click the "Settings" button in the top right corner to paste the API keys you want to use. The keys are then saved locally in the project's `.env` file.

### Running via Docker
If you prefer running the project via Docker (instead of installing Node locally), you can build and run using the included `Dockerfile`:

1. Build the image:
```bash
docker build -t youtube-seo-automator .
```
2. Run the container (Important: mount a local `.env` file so your API keys are saved and persist across restarts!):

**For Mac/Linux (Terminal):**
```bash
docker run -p 5173:5173 -p 3001:3001 -v $(pwd)/.env:/app/.env youtube-seo-automator
```

**For Windows (PowerShell):**
```powershell
docker run -p 5173:5173 -p 3001:3001 -v ${PWD}/.env:/app/.env youtube-seo-automator
```

**For Windows (Command Prompt / CMD):**
```cmd
docker run -p 5173:5173 -p 3001:3001 -v "%cd%\.env":/app/.env youtube-seo-automator
```

## Considerations Before Shipping (Production)
If you plan to deploy this web app to a public server for a business, consider the following:
* **Security:** Currently, the "Settings" menu is designed for personal/local use (it writes directly to `.env`). If thousands of external visitors are to use it, you should phase out the Settings GUI and instead have your company's API keys hardcoded in the environment, *or* implement a user login system (Authentication).
* **Building for Production:** Before a live launch, run `npm run build` to create an optimized version of the client.
* **Temporary Files (tmp):** The backend clears temporary uploads immediately, but if the network crashes, files may be left in the `/uploads/` folder. On a production server, you should add an automatic cleanup job (cron job) that periodically empties the folder.

---
Good luck growing on YouTube! 🚀
