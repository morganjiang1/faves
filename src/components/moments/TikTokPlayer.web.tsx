// Web build of the TikTok player: TikTok's official embed player in an <iframe>
// (https://www.tiktok.com/player/v1/<id>), allowed to autoplay.
import { tiktokPlayerUrl } from "./clips";

export function TikTokPlayer({ id, onReady, onError }: { id: string; onReady: () => void; onError: () => void }) {
  return (
    <div data-testid="tiktok-player" style={{ position: "absolute", inset: 0, background: "#000" }}>
      <iframe
        title="TikTok video"
        src={tiktokPlayerUrl(id)}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={onReady}
        onError={onError}
        style={{ border: 0, width: "100%", height: "100%", display: "block", background: "#000" }}
      />
    </div>
  );
}
