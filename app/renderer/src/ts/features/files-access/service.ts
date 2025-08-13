import type { FileAccessItem, UiFileItem } from './types';

export function mapFilesToItems(files: FileList | File[]): FileAccessItem[] {
  const array = Array.from(files as any as File[]);
  return array.map((f) => ({
    id: `${f.name}-${f.lastModified}-${f.size}`,
    name: f.name,
    relativePath: (f as any).webkitRelativePath || null,
    absolutePath: ((f as any).path as string | undefined) ?? null,
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

export function deriveRootFolderPath(items: FileAccessItem[]): string | null {
  if (items.length === 0) return null;
  const rootName = deriveRootFolderName(items);
  if (!rootName) return null;

  const candidate = items.find((i) => i.absolutePath && i.relativePath);
  if (!candidate || !candidate.absolutePath || !candidate.relativePath) return null;

  const abs = candidate.absolutePath;
  const sep = abs.includes('\\') ? '\\' : '/';
  const relParts = candidate.relativePath.split('/');
  const subRelative = relParts.slice(1).join('/');
  const subRelativeWithSep = subRelative.replace(/\//g, sep);
  const suffix = (subRelativeWithSep ? sep + subRelativeWithSep : '');

  if (suffix && abs.endsWith(suffix)) {
    return abs.slice(0, -suffix.length);
  }

  // Fallback: locate the last occurrence of the root folder name in the absolute path
  const marker1 = sep + rootName + sep;
  const idx = abs.lastIndexOf(marker1);
  if (idx !== -1) return abs.slice(0, idx + marker1.length - 1);

  // Edge case: file directly under the root folder without trailing separator in abs
  const marker2 = sep + rootName;
  const idx2 = abs.lastIndexOf(marker2);
  if (idx2 !== -1) return abs.slice(0, idx2 + marker2.length);

  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}

export function toUiItems(items: FileAccessItem[], options: { recursive: boolean }): UiFileItem[] {
  const recursive = options?.recursive ?? false;
  if (items.length === 0) return [];

  const root = deriveRootFolderName(items);

  if (recursive) {
    return items.map((i) => {
      const rel = i.relativePath || null;
      let location = './';
      if (rel && root) {
        const segs = rel.split('/');
        const dirSegs = segs.slice(1, -1);
        const dir = dirSegs.join('/');
        location = dir ? `${dir}/` : './';
      }
      return {
        id: i.id,
        name: i.name,
        size: formatBytes(i.sizeBytes),
        type: 'file',
        date: new Date(i.lastModified).toISOString().slice(0, 10),
        location,
        sizeBytes: i.sizeBytes,
        lastModified: i.lastModified,
      } satisfies UiFileItem;
    });
  }

  // Non-recursive: show only root-level files and top-level folders
  type FolderAgg = { name: string; sizeBytes: number; lastModified: number };
  const folderMap: Map<string, FolderAgg> = new Map();
  const rootFiles: UiFileItem[] = [];

  for (const i of items) {
    const rel = i.relativePath || null;
    if (!rel || !root) {
      // No relative path information; treat as root-level file
      rootFiles.push({
        id: i.id,
        name: i.name,
        size: formatBytes(i.sizeBytes),
        type: 'file',
        date: new Date(i.lastModified).toISOString().slice(0, 10),
        location: './',
        sizeBytes: i.sizeBytes,
        lastModified: i.lastModified,
      });
      continue;
    }
    const segs = rel.split('/');
    if (segs.length <= 2) {
      // root-level file (Root/file)
      rootFiles.push({
        id: i.id,
        name: i.name,
        size: formatBytes(i.sizeBytes),
        type: 'file',
        date: new Date(i.lastModified).toISOString().slice(0, 10),
        location: './',
        sizeBytes: i.sizeBytes,
        lastModified: i.lastModified,
      });
    } else {
      // nested → aggregate under top-level folder (segs[1])
      const top = segs[1];
      const agg = folderMap.get(top) ?? { name: top, sizeBytes: 0, lastModified: 0 };
      agg.sizeBytes += i.sizeBytes;
      if (i.lastModified > agg.lastModified) agg.lastModified = i.lastModified;
      folderMap.set(top, agg);
    }
  }

  const folderItems: UiFileItem[] = Array.from(folderMap.values()).map((agg) => ({
    id: `folder-${agg.name}`,
    name: agg.name,
    size: formatBytes(agg.sizeBytes),
    type: 'folder',
    date: new Date(agg.lastModified || Date.now()).toISOString().slice(0, 10),
    location: './',
    sizeBytes: agg.sizeBytes,
    lastModified: agg.lastModified || Date.now(),
  }));

  return [...folderItems, ...rootFiles];
}

export async function listFilesFromPath(absPath: string): Promise<FileAccessItem[]> {
  if (!absPath || typeof absPath !== 'string') return [];
  // Use preload-bridged API
  const raw = await window.gc.fs.listDirectory(absPath);
  return raw.map((i) => ({
    id: `${i.absolutePath}-${i.lastModified}-${i.sizeBytes}`,
    name: i.name,
    relativePath: i.relativePath,
    absolutePath: i.absolutePath,
    sizeBytes: i.sizeBytes,
    lastModified: i.lastModified,
    mimeType: 'application/octet-stream',
  }));
}


