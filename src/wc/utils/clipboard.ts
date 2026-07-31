export interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

function browserClipboard(): ClipboardWriter | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.clipboard;
}

export async function writeClipboardText(
  text: string,
  clipboard: ClipboardWriter | undefined = browserClipboard()
): Promise<boolean> {
  if (!text || !clipboard) return false;

  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
