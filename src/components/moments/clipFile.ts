// Keeps a captured clip on the phone: copies the camera's temporary file into the app's
// document folder (expo-file-system's File / Directory / Paths API, SDK 58) so it survives
// restarts, and finds it again if the app's container path changed after an update.
import { Directory, File, Paths } from "expo-file-system";

const FOLDER = "moments";

export async function keepClip(tempUri: string, id: string, kind: "photo" | "video"): Promise<string> {
  try {
    const dir = new Directory(Paths.document, FOLDER);
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const ext = kind === "video" ? (tempUri.split(".").pop()?.toLowerCase() === "mov" ? "mov" : "mp4") : "jpg";
    const dest = new File(dir, `${id}.${ext}`);
    await new File(tempUri).copy(dest);
    return dest.uri;
  } catch {
    // Copy failed (no space, or the temp file is gone): keep the original link for this session.
    return tempUri;
  }
}

export function resolveClip(uri: string | undefined): string | undefined {
  if (!uri || !uri.startsWith("file:") || !uri.includes(`/${FOLDER}/`)) return uri;
  try {
    const here = new File(uri);
    if (here.exists) return uri;
    const moved = new File(Paths.document, FOLDER, uri.split("/").pop() ?? "");
    return moved.exists ? moved.uri : uri;
  } catch {
    return uri;
  }
}
