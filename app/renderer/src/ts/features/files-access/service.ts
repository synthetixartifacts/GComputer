import type { FileAccessItem, UiFileItem } from './types';

export function mapFilesToItems(files: FileList | File[]): FileAccessItem[] {
  const array = Array.from(files as any as File[]);
  return array.map((f) => ({
    id: `${f.name}-${f.lastModified}-${f.size}`,
    name: f.name,
    relativePath: (f as any).webkitRelativePath || null,
    sizeBytes: f.size,
    lastModified: f.lastModified,
    mimeType: f.type || 'application/octet-stream',
  }));
}

export function deriveRootFolderName(items: FileAccessItem[]): string | null {
  if (items.length === 0) return null;
  const first = items.find((i) => i.relativePath);
  if (!first || !first.relativePath) return null;
  const seg = first.relativePath.split('/')[0];
  return seg || null;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}

export function toUiItems(items: FileAccessItem[]): UiFileItem[] {
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    size: formatBytes(i.sizeBytes),
    type: 'file',
    date: new Date(i.lastModified).toISOString().slice(0, 10),
  }));
}


