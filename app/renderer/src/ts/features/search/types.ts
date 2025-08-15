export type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  type?: 'doc' | 'image' | 'video' | 'person' | 'product';
  tags?: string[];
};

export type Suggestion = {
  id: string;
  label: string;
  type?: string;
};

export type SearchState = {
  query: string;
  suggestions: Suggestion[];
  results: SearchItem[];
  loading: boolean;
  selectedIndex: number | null;
};


