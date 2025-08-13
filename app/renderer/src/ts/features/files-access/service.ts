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


