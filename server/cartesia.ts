// Cartesia: the butler's voice (Sonic text-to-speech), voice notes to text (Ink speech-to-text),
// and the booking call (a Cartesia managed agent that phones a place and says it's an AI).
// Everything needs CARTESIA_API_KEY; without it each call says so and nothing is sent.
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

// The booking caller: a managed agent made once (npm run cartesia:setup) and reused.
export const BOOKER_INSTRUCTIONS = [
  "You are Fave, an AI assistant from the Faves app, calling {{place_name}} to book for a group of friends.",
  "Say at the start that you are an AI assistant calling on behalf of {{booker_name}}. Never pretend to be a person.",
  "Ask to book for {{party_size}} people on {{day}} at {{time}}, under the name {{booker_name}}.",
  "If that time isn't free, ask for the closest time within an hour either side and accept it if they have one.",
  "Read the booking back to confirm: the day, the time, the number of people and the name.",
  "Never give payment details. If they need a card or a deposit, say {{booker_name}} will call back to finish it.",
  "If they don't take bookings, thank them and ask if walk-ins are fine for a group of {{party_size}}.",
  "Keep it short and friendly. When it's settled, thank them and end the call.",
].join(" ");

export async function createBooker(): Promise<{ id: string }> {
  const res = await check(await fetch(`${BASE}/v1/agents`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: "Faves Booker",
      description: "Calls a place to book for a Faves group, after a group member confirms. Says it's an AI.",
      config: {
        instructions: BOOKER_INSTRUCTIONS,
        initial_message: "Hi! This is Fave, an AI assistant, calling to book a table for {{booker_name}}'s group. Is now a good time?",
        audio: { output: { voice_id: process.env.CARTESIA_VOICE_ID || "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4" } },
        language: { primary: "en" },
        model: { id: process.env.CARTESIA_AGENT_MODEL || "gpt-5.4-mini", fallback_strategy: { type: "auto" } },
        system_tools: { end_call: { description: null, pre_tool_speech: "auto" }, voicemail_detection: { description: null, pre_tool_speech: "off", message: "Hi, this is Fave, an AI assistant, calling to book a table for {{booker_name}}'s group of {{party_size}} on {{day}} at {{time}}. We'll try again later. Thank you!" } },
        timezone: "America/Los_Angeles",
        turn: { inactivity_end_call_secs: 60, inactivity_check_in_secs: 8 },
        dynamic_variable_placeholders: { place_name: "M Pot", booker_name: "Morgan", party_size: "4", day: "Saturday, Oct 31", time: "5 PM" },
      },
    }),
  }), "create agent");
  return (await res.json()) as { id: string };
}

export async function phoneNumbers(): Promise<{ id: string; number?: string; phone_number?: string }[]> {
  for (const path of ["/agents/phone-numbers", "/v1/agents/phone-numbers", "/v1/phone-numbers"]) {
    const res = await fetch(`${BASE}${path}`, { headers: headers(false) });
    if (res.ok) {
      const data = (await res.json()) as { data?: unknown[]; phone_numbers?: unknown[] } | unknown[];
      return (Array.isArray(data) ? data : data.data ?? data.phone_numbers ?? []) as { id: string; number?: string }[];
    }
  }
  return [];
}

export type CallVars = { place_name: string; booker_name: string; party_size: string; day: string; time: string };

export async function placeCall(to: string, vars: CallVars): Promise<string> {
  const agent = process.env.CARTESIA_AGENT_ID, from = process.env.CARTESIA_FROM_NUMBER_ID;
  if (!agent || !from) throw new Error("The booking caller isn't set up yet: run npm run cartesia:setup, then add CARTESIA_AGENT_ID and CARTESIA_FROM_NUMBER_ID to .env.");
  const res = await check(await fetch(`${BASE}/agents/calls`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ from_number_id: from, agent_id: agent, ringing_timeout_seconds: 40, outbound_calls: [{ to_number: to, dynamic_variables: vars }] }),
  }), "call");
  const data = (await res.json()) as { calls?: { agent_call_id?: string; error?: string }[] };
  const first = data.calls?.[0];
  if (!first?.agent_call_id) throw new Error(first?.error ?? "Cartesia didn't place the call.");
  return first.agent_call_id;
}

export type CallResult = { status: string; end_reason?: string | null; summary?: string | null; error_message?: string | null; transcript?: { role: string; text: string | null }[] | null };

export async function getCall(id: string): Promise<CallResult> {
  const res = await check(await fetch(`${BASE}/agents/calls/${id}`, { headers: headers(false) }), "call status");
  return (await res.json()) as CallResult;
}

// "+1 415 555 0101", "(415) 555-0101" -> "+14155550101" (US numbers without a country code).
export function e164(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  const d = digits.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}
