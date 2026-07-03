import { writeFileSync } from 'node:fs';

const map = {
  label: 'tag',
  folder: 'folder',
  inbox: 'inbox',
  bolt: 'zap',
  edit: 'square-pen',
  image: 'image',
  camera: 'camera',
  brush: 'brush',
  palette: 'palette',
  star: 'star',
  code: 'code',
  terminal: 'terminal',
  translate: 'languages',
  language: 'globe',
  search: 'search',
  article: 'file-text',
  description: 'file-text',
  note: 'sticky-note',
  psychology: 'brain',
  lightbulb: 'lightbulb',
  work: 'briefcase',
  school: 'graduation-cap',
  science: 'flask-conical',
  build: 'wrench',
  handyman: 'hammer',
  chat: 'message-square',
  mail: 'mail',
  link: 'link',
  settings: 'settings',
  person: 'user',
  groups: 'users',
  home: 'house',
  menu_book: 'book-open',
  category: 'shapes',
  layers: 'layers',
  grid_view: 'layout-grid',
  list: 'list',
  cloud: 'cloud',
  lock: 'lock',
  favorite: 'heart',
  flag: 'flag',
  schedule: 'clock',
  calendar_today: 'calendar',
  attach_file: 'paperclip',
  download: 'download',
  upload: 'upload',
  refresh: 'refresh-cw',
  auto_awesome: 'sparkles',
  smart_toy: 'bot',
  public: 'earth',
  restaurant: 'utensils',
  shopping_cart: 'shopping-cart',
  music_note: 'music',
  videocam: 'video',
  mic: 'mic',
};

function extractPaths(mod) {
  const node = mod.__iconNode ?? mod.default?.__iconNode;
  if (!node) return null;
  return node
    .filter(([tag]) =>
      ['path', 'circle', 'rect', 'line', 'polyline', 'polygon'].includes(tag),
    )
    .map(([tag, attrs]) => ({ tag, attrs }));
}

const out = {};
for (const [id, lucide] of Object.entries(map)) {
  const mod = await import(`lucide-react/dist/esm/icons/${lucide}.js`);
  const paths = extractPaths(mod);
  if (!paths) {
    console.error('no paths', id, lucide);
    continue;
  }
  out[id] = paths;
}

writeFileSync('scripts/lucide-paths.json', JSON.stringify(out, null, 2));
console.log('written', Object.keys(out).length);
