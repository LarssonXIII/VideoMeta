import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ytdl from '@distube/ytdl-core';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Ensure .env exists before loading
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, '');
}
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Ensure uploads dir
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// System prompt as specified
const SYSTEM_PROMPT = `Roll: Du är en expert på YouTube SEO och digital marknadsföring.

Uppgift: Analysera den bifogade transkriberingen av en video och generera tre (3) unika alternativ för videobeskrivning samt en lista med optimerade taggar.

Instruktioner för de 3 alternativen:
Alternativ 1 (Storytelling): Börja med en "hook" som adresserar ett problem. Skriv i jag-form, var personlig och skapa engagemang. Avsluta med en CTA (Call to Action) för prenumeration.
Alternativ 2 (How-To/Informative): Fokusera på nytta. Använd punktlistor för att visa vad tittaren lär sig. Håll det sakligt och professionellt.
Alternativ 3 (SEO-Max): Placera de viktigaste sökorden i de första två meningarna. Inkludera föreslagna tidsstämplar (om möjligt utifrån transkriberingen) och en lista med relevanta sökord i slutet.

SEO-Taggar: Generera 15-20 relevanta taggar separerade med kommatecken. Mixa breda termer med specifika "long-tail" sökord.

Format: Svara alltid EXAKT i följande JSON format (och enbart JSON) för att appen ska kunna tolka datan:
{
"option_1": "...",
"option_2": "...",
"option_3": "...",
"tags": ["tag1", "tag2", "tag3"]
}`;

// --- ROUTES ---

// GET Settings overview (to see what is configured)
app.get('/api/settings', (req, res) => {
    res.json({
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
        ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434'
    });
});

// POST Save settings to .env
app.post('/api/settings', (req, res) => {
    const { openaiKey, anthropicKey, geminiKey, ollamaUrl } = req.body;

    // Read existing .env
    let envConfig: Record<string, string> = {};
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        lines.forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) envConfig[match[1]] = match[2];
        });
    }

    // Update provided keys
    if (openaiKey !== undefined) envConfig['OPENAI_API_KEY'] = openaiKey;
    if (anthropicKey !== undefined) envConfig['ANTHROPIC_API_KEY'] = anthropicKey;
    if (geminiKey !== undefined) envConfig['GEMINI_API_KEY'] = geminiKey;
    if (ollamaUrl !== undefined) envConfig['OLLAMA_URL'] = ollamaUrl;

    // Write back to .env
    const updatedEnv = Object.entries(envConfig).map(([k, v]) => `${k}=${v}`).join('\n');
    fs.writeFileSync(envPath, updatedEnv);

    // Reload process.env
    Object.assign(process.env, envConfig);

    res.json({ success: true });
});

// Analyze Video/Audio logic
app.post('/api/analyze', upload.single('file'), async (req, res) => {
    try {
        const { provider, link, transcriptionProvider = 'whisper' } = req.body;
        const file = req.file;

        // Default mock transcript if no valid file upload + OpenAI API key is present
        let transcript = "Det här är en mockad transkribering av en video eftersom ingen giltig API nyckel eller fil hittades.";

        // Real Transcription API integration
        if ((file || link) && (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY)) {
            let audioPath = "";
            let fileWithExt = "";

            if (file) {
                console.log('Extracting audio from file:', file.filename);

                // Re-add the original file extension so ffmpeg can properly detect formats
                const originalExt = path.extname(file.originalname);
                fileWithExt = file.path + originalExt;
                fs.renameSync(file.path, fileWithExt);

                audioPath = path.join(process.cwd(), 'uploads', `${file.filename}.mp3`);

                // Extract audio via ffmpeg
                await new Promise<void>((resolve, reject) => {
                    ffmpeg(fileWithExt)
                        .noVideo() // explicitly drop video stream
                        .toFormat('mp3')
                        .on('error', (err, stdout, stderr) => {
                            console.error("Ffmpeg Error:", err.message);
                            console.error("Ffmpeg Stderr:", stderr);
                            if (err.message.includes('does not contain any stream')) {
                                reject(new Error("Filen verkar sakna ett ljudspår eller är inte en giltig mediafil."));
                            } else {
                                reject(new Error(`Kunde inte extrahera ljud: ${err.message}`));
                            }
                        })
                        .on('end', () => resolve())
                        .save(audioPath);
                });
            } else if (link) {
                if (!ytdl.validateURL(link)) {
                    throw new Error("Länken ser inte ut som en giltig YouTube-länk.");
                }
                console.log('Extracting audio from YouTube link:', link);
                const videoId = ytdl.getURLVideoID(link);
                audioPath = path.join(process.cwd(), 'uploads', `${videoId}.mp3`);

                // Fetch audio stream and convert to mp3
                await new Promise<void>((resolve, reject) => {
                    const stream = ytdl(link, { filter: 'audioonly', quality: 'highestaudio' });
                    ffmpeg(stream)
                        .toFormat('mp3')
                        .on('error', (err) => {
                            console.error("Ffmpeg YouTube Stream Error:", err.message);
                            reject(new Error(`Kunde inte ladda ner strömmen från YouTube: ${err.message}`));
                        })
                        .on('end', () => resolve())
                        .save(audioPath);
                });
            }

            console.log(`Audio extracted. Sending to ${transcriptionProvider === 'gemini' ? 'Gemini' : 'Whisper'} API...`);

            if (transcriptionProvider === 'gemini') {
                if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API Key not configured for transcription");
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

                const uploadResult = await ai.files.upload({ file: audioPath, mimeType: 'audio/mp3' });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [
                        { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } },
                        { text: 'Transkribera denna ljudfil till text så exakt som möjligt på svenska. Skriv enbart ut transkriberingen, inga andra kommentarer.' }
                    ]
                });
                transcript = response.text || "";
            } else {
                if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API Key not configured for Whisper transcription");
                const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                const transcription = await openaiClient.audio.transcriptions.create({
                    file: fs.createReadStream(audioPath),
                    model: "whisper-1",
                    language: "sv", // Hint: defaulting to Swedish for better context based on prompts, can be omitted
                });
                transcript = transcription.text;
            }
            console.log('Transcription successful.');

            // Clean up files immediately after
            if (fileWithExt && fs.existsSync(fileWithExt)) fs.unlinkSync(fileWithExt);
            if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } else if (file) {
            // Clean up file if we couldn't process it
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } else if (link && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
            throw new Error("Ingen API-nyckel för transkribering konfigurerad (krävs för YouTube-länkar).");
        }

        const prompt = `Här är transkriberingen:\n\n${transcript}\n\nFölj systeminstruktionerna för att skapa de 3 alternativen och taggarna i JSON.`;

        let resultText = "";

        if (provider === 'openai') {
            if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API Key not configured");
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });
            resultText = response.choices[0].message.content || "";

        } else if (provider === 'anthropic') {
            if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic API Key not configured");
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            const response = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 1500,
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: prompt }]
            });
            // @ts-ignore
            resultText = response.content[0].text;

        } else if (provider === 'gemini') {
            if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API Key not configured");
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: SYSTEM_PROMPT,
                    responseMimeType: 'application/json',
                }
            });
            resultText = response.text || "";

        } else if (provider === 'ollama') {
            const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
            const response = await fetch(`${ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3', // User might need to change this
                    system: SYSTEM_PROMPT,
                    prompt: prompt,
                    stream: false,
                    format: 'json'
                })
            });
            if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
            const data = await response.json();
            resultText = data.response;
        } else {
            throw new Error(`Unknown provider: ${provider}`);
        }

        // Parse safety check
        const jsonObj = JSON.parse(resultText);
        res.json({ success: true, data: jsonObj });

    } catch (error: any) {
        console.error('Analysis error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Express API Server running on port ${PORT}`);
});
