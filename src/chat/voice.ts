// Voice for the group chat: the butler's replies read aloud (Cartesia Sonic through the Faves
// server, or the phone's own voice when Cartesia isn't set up) and voice notes typed out
// (Cartesia Ink). Keys stay on the server; the app only calls /api/tts, /api/stt, /api/voice.
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import { plainText } from "@/lib/linktext";
import { relayUrl } from "./transport";

export function apiBase(): string | null {
  const ws = relayUrl();
  return ws ? ws.replace(/^ws/, "http") : null;
}

export type VoiceStatus = { ready: boolean };
let cached: { at: number; v: VoiceStatus } | null = null;

export async function voiceStatus(): Promise<VoiceStatus> {
  if (cached && Date.now() - cached.at < 60_000) return cached.v;
  const base = apiBase();
  let v: VoiceStatus = { ready: false };
  if (base) {
    try {
      const r = await fetch(`${base}/api/voice`);
      if (r.ok) v = (await r.json()) as VoiceStatus;
    } catch { /* offline: the phone's own voice */ }
  }
  cached = { at: Date.now(), v };
  return v;
}

let player: AudioPlayer | null = null;

// Say it out loud: Cartesia's voice when the server has it, else the phone's.
export async function say(text: string): Promise<"cartesia" | "device"> {
  const clean = plainText(text).replace(/https?:\/\/\S+/g, "").replace(/[•*_#]/g, "").replace(/\s+/g, " ").trim().slice(0, 600);
  if (!clean) return "device";
  const base = apiBase();
  const v = await voiceStatus();
  if (base && v.ready) {
    try {
      player?.remove();
      player = createAudioPlayer({ uri: `${base}/api/tts?text=${encodeURIComponent(clean)}` });
      player.play();
      return "cartesia";
    } catch { /* fall through to the phone's voice */ }
  }
  Speech.stop();
  Speech.speak(clean, { rate: 1.02 });
  return "device";
}

export function hush() {
  Speech.stop();
  try { player?.pause(); } catch { /* already gone */ }
}

// A recorded voice note (a file uri on the phone, a blob url on the web) to text.
export async function transcribe(uri: string, mime: string): Promise<string> {
  const base = apiBase();
  if (!base) throw new Error("No Faves server to reach.");
  const audio = await (await fetch(uri)).blob();
  const r = await fetch(`${base}/api/stt`, { method: "POST", headers: { "Content-Type": mime }, body: audio });
  const data = (await r.json()) as { text?: string; error?: string };
  if (!r.ok) throw new Error(data.error ?? "Couldn't type that out.");
  return data.text ?? "";
}
