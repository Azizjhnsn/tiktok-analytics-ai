/** File System Access save picker (Chrome/Edge), missing from TypeScript's DOM lib. */
interface SaveFilePickerOptions {
  suggestedName?: string;
  /** Picker remembers its last folder per id. */
  id?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}

interface Window {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
}
