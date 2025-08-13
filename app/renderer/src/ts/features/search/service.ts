import type { SearchItem, Suggestion } from './types';

let demoData: SearchItem[] = [];

export function initDemoData(): void {
  if (demoData.length > 0) return;
  demoData = [
    { id: '1', title: 'Apple Pie', description: 'A delicious apple pie recipe', type: 'doc', tags: ['apple', 'recipe', 'dessert'] },
    { id: '2', title: 'Apple iPhone 15', description: 'Product page for iPhone', type: 'product', tags: ['apple', 'iphone'] },
    { id: '3', title: 'Pineapple Smoothie', description: 'Tropical drink', type: 'video', tags: ['pineapple', 'drink'] },
    { id: '4', title: 'John Appleseed', description: 'Folk hero and gardener', type: 'person', tags: ['john', 'apple'] },
    { id: '5', title: 'Video Editing Basics', description: 'Learn to edit videos', type: 'video', tags: ['video', 'tutorial'] },
    { id: '6', title: 'Apples in Season', description: 'When to buy apples', type: 'doc', tags: ['apple', 'season'] },
  ];
}

export function getSuggestions(query: string, max = 6): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const labels = new Set<string>();
  for (const item of demoData) {
    // Title prefix
    if (item.title.toLowerCase().startsWith(q)) labels.add(item.title);
    // Tag prefix
    for (const tag of item.tags || []) {
      if (tag.toLowerCase().startsWith(q)) labels.add(tag);
    }
  }
  return Array.from(labels)
    .slice(0, max)
    .map((label, idx) => ({ id: `${label}-${idx}`, label }));
}

export function runSearch(query: string, limit = 30): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = demoData.map((item) => ({ item, score: scoreItem(item, q) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
  return scored;
}

function scoreItem(item: SearchItem, q: string): number {
  let score = 0;
  const title = item.title.toLowerCase();
  const description = (item.description || '').toLowerCase();
  const tags = (item.tags || []).map((t) => t.toLowerCase());
  if (title.includes(q)) score += 5;
  if (title.startsWith(q)) score += 10;
  if (description.includes(q)) score += 2;
  for (const tag of tags) {
    if (tag === q) score += 6;
    else if (tag.startsWith(q)) score += 3;
  }
  return score;
}


