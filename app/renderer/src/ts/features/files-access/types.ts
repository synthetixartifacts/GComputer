export type FileAccessItem = {
  id: string;
  name: string;
  relativePath: string | null;
  sizeBytes: number;
  lastModified: number;
  mimeType: string;
};

export type UiFileItem = {
  id: string;
  name: string;
  size: string;
  type: 'file' | 'folder';
  date: string;
};


