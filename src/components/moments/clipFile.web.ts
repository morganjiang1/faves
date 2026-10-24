// On the web a captured photo stays a small JPEG data URI (taken at quality 0.4 and scaled
// down), saved with the rest of the app state; there is no file system to copy into.
export async function keepClip(tempUri: string, _id?: string, _kind?: "photo" | "video"): Promise<string> {
  return tempUri;
}

export function resolveClip(uri: string | undefined): string | undefined {
  return uri;
}
