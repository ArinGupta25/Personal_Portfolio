const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Navigation and a quiet, persistent evening palette.
$('.menu-toggle')?.addEventListener('click', event => {
  const button = event.currentTarget;
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  $('nav').classList.toggle('open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && $('nav.open')) {
    $('nav').classList.remove('open');
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
    $('.menu-toggle').focus();
  }
});
function setTheme(evening) {
  document.documentElement.dataset.theme = evening ? 'evening' : 'day';
  $('.theme-toggle')?.setAttribute('aria-pressed', String(evening));
  $('.theme-toggle')?.setAttribute('aria-label', `Switch to ${evening ? 'daylight' : 'evening'} colours`);
}
try { setTheme(localStorage.getItem('personal-home-theme') === 'evening'); } catch { setTheme(false); }
$('.theme-toggle')?.addEventListener('click', () => {
  const evening = document.documentElement.dataset.theme !== 'evening';
  setTheme(evening);
  try { localStorage.setItem('personal-home-theme', evening ? 'evening' : 'day'); } catch { /* Palette still works without storage. */ }
});

// Scroll feedback uses a single animation frame, and never hides content without JS.
let frame = 0;
function updateScroll() {
  frame = 0;
  const range = document.documentElement.scrollHeight - innerHeight;
  $('.reading-progress').style.transform = `scaleX(${range > 0 ? scrollY / range : 0})`;
  document.body.classList.toggle('scrolled', scrollY > 15);
}
addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateScroll); }, {passive:true});
addEventListener('resize', updateScroll);
updateScroll();
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.remove('is-waiting');
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }), {threshold:0.08});
  $$('.reveal').forEach(element => {
    if (element.getBoundingClientRect().top > innerHeight) element.classList.add('is-waiting');
    observer.observe(element);
  });
}

// Homepage sections share one selected overview at a time.
$$('button[data-overview]').forEach(button => button.addEventListener('click', () => {
  $$('button[data-overview]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  $$('.overview-panel').forEach(panel => panel.hidden = panel.id !== `overview-${button.dataset.overview}`);
}));
// Search and category filters compose, rather than resetting one another.
let activeCategory = 'all';
function filterCollection() {
  const query = ($('#collection-search')?.value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const category = $('#section-filter')?.value || activeCategory;
  const rating = $('#rating-filter')?.value || 'all';
  let count = 0;
  $$('[data-category]').forEach(item => {
    const matches = (category === 'all' || item.dataset.category === category) && (rating === 'all' || item.dataset.rating === rating) && (!query || (item.dataset.search || item.textContent.toLowerCase()).includes(query));
    item.hidden = !matches;
    if (matches) { count++; item.classList.remove('is-waiting'); }
  });
  if ($('#no-results')) $('#no-results').hidden = count > 0;
  if ($('#book-count')) $('#book-count').textContent = `${count} of ${$$('.book-entry').length} books`;
  updateScroll();
}
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  activeCategory = button.dataset.filter;
  $$('[data-filter]').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  filterCollection();
}));
$('#collection-search')?.addEventListener('input', filterCollection);
$$('button[data-view]').forEach(button => button.addEventListener('click', () => {
  $('#book-collection').dataset.view = button.dataset.view;
  $$('button[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  updateScroll();
}));
$$('[data-reading-size]').forEach(button => button.addEventListener('click', () => {
  document.body.classList.toggle('large-reading', button.dataset.readingSize === 'large');
  $$('[data-reading-size]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  updateScroll();
}));

// A single gallery supports cover images, section attachments and article galleries.
const photos = $$('[data-photo]');
const lightbox = $('#lightbox');
let photoIndex = 0;
function showPhoto(index) {
  photoIndex = (index + photos.length) % photos.length;
  const photo = photos[photoIndex];
  lightbox.querySelector('img').src = photo.dataset.photo;
  lightbox.querySelector('img').alt = photo.dataset.alt;
  lightbox.querySelector('p').textContent = photo.dataset.caption || photo.dataset.alt;
  $('#photo-position').textContent = `${photoIndex + 1} / ${photos.length}`;
  $$('[data-photo-step]').forEach(button => button.disabled = photos.length < 2);
}
photos.forEach((photo, index) => photo.addEventListener('click', () => {
  showPhoto(index); lightbox.showModal(); document.body.style.overflow = 'hidden';
}));
$$('[data-photo-step]').forEach(button => button.addEventListener('click', () => showPhoto(photoIndex + Number(button.dataset.photoStep))));
lightbox?.querySelector('.close-dialog').addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('close', () => { document.body.style.overflow = ''; photos[photoIndex]?.focus(); });
lightbox?.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
lightbox?.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1)); }
});

$$('[data-prompt]').forEach(button => button.addEventListener('click', () => {
  const input = $('#idea');
  input.value = input.value ? `${input.value}\n\n${button.dataset.prompt}` : button.dataset.prompt;
  input.focus();
}));
$('#inquiry')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const note = `Hello,\n\n${data.get('idea')}\n\nFrom: ${data.get('sender')}\nReply to: ${data.get('reply')}`;
  $('#prepared').value = note;
  $('#inquiry-result').hidden = false;
  if (event.currentTarget.dataset.email) location.href = `mailto:${event.currentTarget.dataset.email}?subject=${encodeURIComponent('An idea to explore together')}&body=${encodeURIComponent(note)}`;
});
$('#copy-note')?.addEventListener('click', async event => {
  try { await navigator.clipboard.writeText($('#prepared').value); event.currentTarget.textContent = 'Copied'; }
  catch { $('#prepared').focus(); $('#prepared').select(); event.currentTarget.textContent = 'Select and copy your note above'; }
});

// Map loading cannot prevent navigation, filters or the other interactions working.
if ($('#world-map')) import('./map.js').then(module => module.initMap()).catch(() => { $('#map-error').hidden = false; });

// Library controls combine without changing another collection's filters.
['section-filter','rating-filter'].forEach(id => document.getElementById(id)?.addEventListener('change',filterCollection));
$('#clear-library')?.addEventListener('click',()=>{
 $('#collection-search').value=''; $('#section-filter').value='all'; $('#rating-filter').value='all'; filterCollection();
});
$('#book-sort')?.addEventListener('change',event=>{
 const mode=event.target.value;const cards=$$('.book-entry');
 cards.sort((a,b)=>mode==='rating'?Number(b.dataset.rating)-Number(a.dataset.rating)||Number(a.dataset.order)-Number(b.dataset.order):mode==='original'?Number(a.dataset.order)-Number(b.dataset.order):a.dataset[mode].localeCompare(b.dataset[mode]));
 cards.forEach(card=>$('#book-collection').append(card));updateScroll();
});
