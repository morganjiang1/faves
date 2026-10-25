// Cartesia: the butler's voice (Sonic text-to-speech) and voice notes to text (Ink speech-to-text).
// Both need CARTESIA_API_KEY; without it each request says so and nothing is sent.
const BASE = "https://api.cartesia.ai";
const VERSION = "2026-08-14";

export const cartesiaReady = () => Boolean(process.env.CARTESIA_API_KEY);
const key = () => {
  const k = process.env.CARTESIA_API_KEY;
  if (!k) throw new Error("Cartesia isn't set up yet: add CARTESIA_API_KEY to .env.");
  return k;
};
const headers = (json = true): Record<string, string> => ({ Authorization: `Bearer ${key()}`, "X-API-Key": key(), "Cartesia-Version": VERSION, ...(json ? { "Content-Type": "application/json" } : {}) });

async function check(res: Response, what: string) {
  if (res.ok) return res;
  const body = await res.text().catch(() => "");
  throw new Error(`Cartesia ${what}: ${res.status} ${body.slice(0, 200)}`);
}

// Sonic: text to an mp3.
export async function speak(text: string, voice = process.env.CARTESIA_VOICE_ID || "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4"): Promise<Buffer> {
  const res = await check(await fetch(`${BASE}/tts/bytes`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ model_id: process.env.CARTESIA_TTS_MODEL || "sonic-3", transcript: text.slice(0, 1200), voice: { id: voice }, language: "en", output_format: { container: "mp3", sample_rate: 44100, bit_rate: 128000 } }),
  }), "speech");
  return Buffer.from(await res.arrayBuffer());
}

// Ink: a voice note (m4a, webm, wav, mp3...) to text.
export async function transcribe(audio: Buffer, mime = "audio/m4a"): Promise<string> {
  const ext = mime.includes("webm") ? "webm" : mime.includes("wav") ? "wav" : mime.includes("mpeg") || mime.includes("mp3") ? "mp3" : mime.includes("ogg") ? "ogg" : "m4a";
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: mime }), `note.${ext}`);
  form.append("model", "ink-whisper");
  form.append("language", "en");
  const res = await check(await fetch(`${BASE}/stt`, { method: "POST", headers: headers(false), body: form }), "transcription");
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}
