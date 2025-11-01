// ===== Load data từ localStorage (do main.js đã set) =====
const raw = localStorage.getItem('items');
let items = raw ? JSON.parse(raw) : [];

// Fallback demo nếu mở thẳng trang lần đầu
if (!Array.isArray(items) || !items.length) {
  items = Array.from({length:12}).map((_,i)=>({
    stt:i+1,
    mainImage:`https://picsum.photos/seed/e${i}/700/900`,
    image2:`https://picsum.photos/seed/f${i}/700/900`,
    links:{shirt:"#",pants:"#",shoes:"#"},
  }));
}

// ===== Gắn tags mặc định nếu thiếu để lọc hoạt động mượt =====
const defaultTags = (i)=>({
  colors: ["black","white","gray","blue","beige"][i%5] ? [ ["black"],["white"],["gray"],["blue"],["beige"] ][i%5] : ["black"],
  season: [ ["spring"],["summer"],["fall"],["winter"] ][i%4],
  vibe:   [ ["minimal"],["street"],["trendy"],["retro"],["sporty"] ][i%5],
  formality: ["casual","smart-casual","formal"][i%3],
  fit: ["regular","oversize","slim"][i%3],
  gender: "unisex",
});

items = items.map((it,idx)=>({
  ...it,
  title: it.title || `Outfit #${it.stt}`,
  tags: it.tags || defaultTags(idx)
}));

// ====== Helpers ======
const $ = (id)=>document.getElementById(id);
const grid = $('grid'), countEl=$('count'), activeTags=$('activeTags'), qEl=$('q');

function card(it){
  const wrap = document.createElement('a');
  wrap.href = `product.html?id=${it.stt}`;
  wrap.className = "card block ring-1 ring-neutral-200 bg-white hover:shadow transition";
  wrap.innerHTML = `
    <img loading="lazy" src="${it.mainImage}" alt="Outfit #${it.stt}" class="w-full h-auto object-cover"/>
    <div class="p-3 text-sm flex items-center justify-between">
      <span class="font-medium">#${it.stt}</span>
      <span class="text-neutral-500">${(it.tags?.vibe||[]).join(', ')||'—'}</span>
    </div>
  `;
  return wrap;
}

function render(list){
  grid.innerHTML = '';
  list.forEach(it=>grid.appendChild(card(it)));
  countEl.textContent = list.length;
}

// ====== State ======
const state = {
  q: '',
  vibe: new Set(),
  fit: new Set(),
  formality: new Set(),
  season: new Set(),
  colors: new Set(),
};

function summarizeActive(){
  const chips = [];
  if (state.q) chips.push(`"${state.q}"`);
  if (state.vibe.size) chips.push([...state.vibe].join(' · '));
  if (state.fit.size) chips.push([...state.fit].join(' · '));
  if (state.formality.size) chips.push([...state.formality].join(' · '));
  if (state.season.size) chips.push([...state.season].join(' · '));
  if (state.colors.size) chips.push([...state.colors].join(' · '));
  activeTags.textContent = chips.length ? chips.join(' • ') : 'Không có bộ lọc';
}

// ====== Filtering ======
function matchArray(hay = [], need = new Set()){
  if (!need.size) return true;
  for (const v of need) if (!hay.includes(v)) return false;
  return true;
}

function matchColors(hay = [], need = new Set()){
  if (!need.size) return true;
  // chỉ cần item có ít nhất 1 màu được chọn
  return [...need].some(c => hay.includes(c));
}

function searchText(it, q){
  if (!q) return true;
  const all = [
    it.title || '',
    ...(it.tags?.vibe || []),
    it.tags?.formality || '',
    ...(it.tags?.season || []),
    ...(it.tags?.colors || []),
  ].join(' ').toLowerCase();
  return all.includes(q.toLowerCase());
}

function applyFilters(){
  const filtered = items.filter(it =>
    searchText(it, state.q) &&
    matchArray(it.tags?.vibe||[], state.vibe) &&
    matchArray([it.tags?.fit].filter(Boolean), state.fit) &&
    matchArray([it.tags?.formality].filter(Boolean), state.formality) &&
    matchArray(it.tags?.season||[], state.season) &&
    matchColors(it.tags?.colors||[], state.colors)
  );
  render(filtered);
  summarizeActive();
}

// ====== Wire up dropdowns ======
function setupDropdown(btnId, popId, set){
  const btn = $(btnId), pop=$(popId);
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    pop.classList.toggle('hidden');
  });
  pop.addEventListener('click', (e)=>{
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    cb.checked ? set.add(cb.value) : set.delete(cb.value);
    applyFilters();
  });
  // đóng khi bấm ngoài
  document.addEventListener('click', (e)=>{
    if (!pop.contains(e.target) && !btn.contains(e.target)) pop.classList.add('hidden');
  });
}

setupDropdown('btnVibe','popVibe',state.vibe);
setupDropdown('btnFit','popFit',state.fit);
setupDropdown('btnForm','popForm',state.formality);
setupDropdown('btnSeason','popSeason',state.season);
setupDropdown('btnColor','popColor',state.colors);

// Search input
qEl.addEventListener('input', ()=>{ state.q = qEl.value.trim(); applyFilters(); });

// Clear filters
$('btnClear').addEventListener('click', ()=>{
  state.q=''; qEl.value='';
  [state.vibe,state.fit,state.formality,state.season,state.colors].forEach(s=>s.clear());
  document.querySelectorAll('.pop input[type="checkbox"]').forEach(i=>{ i.checked=false; });
  applyFilters();
});

// Initial render
applyFilters();
