// background browser
//
// "Browse collection" in Customize Chat > Background opens a gallery of the backgrounds
// stored in the GitHub repo (BG_COLLECTION). Apply puts the image URL into the Background
// URL field, which applies it like a typed URL; the user still has to press Save in
// Customize Chat to keep it. Only the URL is stored, not the image.
//
// The site's CSP blocks <img> from other hosts, so thumbnails are fetched with
// GM_xmlhttpRequest (small resized copies via wsrv.nl) and shown as blob: URLs.

const BG_COLLECTION = {
    owner: 'pervertir',
    repo: 'Yodayo-Chat-Customizer',
    branch: 'feat/universal-bg',
    dir: 'resources/default_backgrounds',
    categories: ['anime', 'realistic'],
};
const BG_BROWSER_ID = 'ycc-bg-browser';
const BG_INDEX_CACHE_KEY = 'ycc_bg_index';
const BG_INDEX_TTL_MS = 60 * 60 * 1000;
const BG_THUMB_WIDTH = 480;
const BG_THUMB_CONCURRENCY = 6;

/** @type {Map<string, string>} raw URL -> blob URL of its thumbnail, kept while the page lives */
const bgThumbCache = new Map();

/**
 * @param {string} path - repo path of the image
 * @returns {string}
 */
function bgRawUrl(path) {
    const { owner, repo, branch } = BG_COLLECTION;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * @param {string} url
 * @param {'json'|'blob'} responseType
 * @param {number} [timeout]
 * @returns {Promise<any>}
 */
function bgRequest(url, responseType, timeout = 20000) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET', url, responseType, timeout,
            onload: r => (r.status === 200 ? resolve(r.response) : reject(new Error(`HTTP ${r.status}`))),
            onerror: () => reject(new Error('Network error')),
            ontimeout: () => reject(new Error('Timed out')),
        });
    });
}

/**
 * Lists the collection from the GitHub tree API (cached for an hour; one request per hour
 * keeps well inside GitHub's anonymous rate limit).
 * @param {boolean} [refresh=false]
 * @returns {Promise<{name: string, category: string, path: string, url: string}[]>}
 */
async function getBackgroundCollection(refresh = false) {
    const cached = GM_getValue(BG_INDEX_CACHE_KEY, null);
    if (!refresh && cached && Date.now() - cached.time < BG_INDEX_TTL_MS && Array.isArray(cached.items)) {
        return cached.items;
    }
    const { owner, repo, branch, dir, categories } = BG_COLLECTION;
    const tree = await bgRequest(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, 'json');
    const items = (tree.tree || [])
        .filter(n => n.type === 'blob' && n.path.startsWith(dir + '/') && /\.(jpe?g|png|webp)$/i.test(n.path))
        .map(n => {
            const rel = n.path.slice(dir.length + 1).split('/');
            return { file: rel[rel.length - 1], category: rel.length > 1 ? rel[0] : '', path: n.path };
        })
        .filter(n => categories.includes(n.category))          // top-level files are plain fills
        .map(n => ({
            name: n.file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
                .replace(/\b\w/g, c => c.toUpperCase()),
            category: n.category,
            path: n.path,
            url: bgRawUrl(n.path),
        }))
        // "bedroom clean.jpg" and "bedroom_clean.jpg" are the same image stored twice: list it once
        .filter((item, i, all) => all.findIndex(o => o.category === item.category && o.name === item.name) === i)
        .sort((a, b) => a.name.localeCompare(b.name));
    GM_setValue(BG_INDEX_CACHE_KEY, { time: Date.now(), items });
    return items;
}

/**
 * Loads thumbnails for images as they scroll into view, a few at a time.
 */
class BgThumbLoader {
    constructor(root) {
        this.queue = [];
        this.active = 0;
        this.observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                this.observer.unobserve(e.target);
                this.queue.push(e.target);
                this.pump();
            });
        }, { root, rootMargin: '300px' });
    }

    /** @param {HTMLImageElement} img */
    observe(img) {
        const cached = bgThumbCache.get(img.dataset.src);
        if (cached) { img.src = cached; img.classList.remove('opacity-0'); return; }
        this.observer.observe(img);
    }

    pump() {
        while (this.active < BG_THUMB_CONCURRENCY && this.queue.length) {
            const img = this.queue.shift();
            if (!img.isConnected) continue;
            this.active++;
            this.load(img).finally(() => { this.active--; this.pump(); });
        }
    }

    /** @param {HTMLImageElement} img */
    async load(img) {
        const raw = img.dataset.src;
        const thumb = `https://wsrv.nl/?w=${BG_THUMB_WIDTH}&output=webp&q=75&url=${encodeURIComponent(raw.replace(/^https:\/\//, ''))}`;
        let blob;
        try {
            blob = await bgRequest(thumb, 'blob');
        } catch (e) {
            try { blob = await bgRequest(raw, 'blob', 60000); } // resizer down: use the original
            catch (err) { img.alt = 'Preview unavailable'; return; }
        }
        const url = URL.createObjectURL(blob);
        bgThumbCache.set(raw, url);
        img.src = url;
        img.classList.remove('opacity-0');
    }

    disconnect() {
        this.observer.disconnect();
        this.queue = [];
    }
}

/**
 * Puts the chosen image into the Background URL field of the open Customize Chat form,
 * which applies it to the page and stages it for Save.
 * @param {{name: string, url: string}} item
 * @returns {boolean}
 */
function applyCollectionBackground(item) {
    /** @type {HTMLInputElement|null} */
    const input = document.querySelector(`#${chat_customizer_body_id} #bg-url-input`) || document.getElementById('bg-url-input');
    if (!input) return false;
    input.value = item.url;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    showInjectionNotification(notification_resource_name, null, `Applied "${item.name}". Press Save in Customize Chat to keep it.`);
    return true;
}

/**
 * Closes the background browser.
 * @returns {void}
 */
function closeBackgroundBrowser() {
    const root = document.getElementById(BG_BROWSER_ID);
    if (!root) return;
    root._ycc?.loader?.disconnect();
    document.removeEventListener('keydown', root._ycc?.onKey, true);
    root.remove();
}

/**
 * Opens the background browser on top of Customize Chat.
 * @returns {Promise<void>}
 */
async function openBackgroundBrowser() {
    if (document.getElementById(BG_BROWSER_ID)) return;

    // Same layout and classes as the image viewer (overlay, title bar, card grid, footer)
    const root = document.createElement('div');
    root.id = BG_BROWSER_ID;
    root.className = 'relative';
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483000';
    root.innerHTML = `
      <div class="fixed inset-0 bg-backdrop transition-opacity opacity-100" data-ycc-close></div>
      <div class="fixed inset-0 overflow-y-auto" data-ycc-close>
        <div class="flex min-h-screen min-w-screen items-center justify-center p-8" data-ycc-close>
          <div class="flex flex-col w-full rounded-lg bg-secondaryBg shadow-xl" style="height:calc(100vh - 4rem)">
            <div class="relative p-2 bg-secondaryBg text-white text-center text-xl border-b border-[#22242b]">
              Background Collection
              <div data-ycc-close class="absolute top-2 right-2 cursor-pointer hover:scale-110" title="Close (Esc)">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="none" style="pointer-events:none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 px-6 pt-4 pb-2 bg-primaryBg">
              <div class="flex gap-1" data-ycc-tabs>
                <button data-cat="" class="rounded-md px-3 py-1.5 text-sm">All</button>
                <button data-cat="anime" class="rounded-md px-3 py-1.5 text-sm">Anime</button>
                <button data-cat="realistic" class="rounded-md px-3 py-1.5 text-sm">Realistic</button>
              </div>
              <input data-ycc-search type="search" placeholder="Search backgrounds…"
                class="ml-auto w-64 rounded-md bg-tertiaryBg py-1.5 px-3 text-sm text-primaryText" />
            </div>
            <div data-ycc-grid style="grid-auto-rows:max-content;align-content:start"
              class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto overflow-x-hidden p-6 bg-primaryBg">
              <p class="col-span-full text-center text-secondaryText">Loading collection…</p>
            </div>
            <div data-ycc-footer class="p-2 bg-secondaryBg text-secondaryText text-center text-sm border-t border-[#22242b]"></div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(root);

    const grid = root.querySelector('[data-ycc-grid]');
    const search = root.querySelector('[data-ycc-search]');
    const tabs = root.querySelector('[data-ycc-tabs]');
    const footer = root.querySelector('[data-ycc-footer]');
    const loader = new BgThumbLoader(grid);
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); closeBackgroundBrowser(); } };
    root._ycc = { loader, onKey };
    document.addEventListener('keydown', onKey, true);

    // Close on the X or a click on the backdrop (not inside the panel)
    root.addEventListener('click', e => {
        if (e.target instanceof Element && e.target.hasAttribute('data-ycc-close')) closeBackgroundBrowser();
    });

    const { owner, repo, branch } = BG_COLLECTION;
    const setFooter = (text) => {
        footer.innerHTML = '';
        footer.append(text + ' · ');
        const a = document.createElement('a');
        a.href = `https://github.com/${owner}/${repo}/tree/${branch}/${BG_COLLECTION.dir}`;
        a.target = '_blank';
        a.className = 'underline hover:text-primaryText';
        a.textContent = 'View on GitHub';
        footer.append(a);
    };

    let items = [];
    let category = '';
    const current = (document.getElementById('bg-url-input') || {}).value || '';

    const render = () => {
        const q = search.value.trim().toLowerCase();
        const shown = items.filter(i => (!category || i.category === category) && (!q || i.name.toLowerCase().includes(q)));
        tabs.querySelectorAll('button').forEach(b => {
            const on = b.dataset.cat === category;
            b.className = 'rounded-md px-3 py-1.5 text-sm ' + (on ? 'bg-primaryBtn text-white' : 'bg-tertiaryBg text-secondaryText hover:text-primaryText');
        });
        grid.innerHTML = '';
        if (!shown.length) {
            grid.innerHTML = '<p class="col-span-full text-center text-secondaryText">No backgrounds match.</p>';
        }
        for (const item of shown) {
            const card = document.createElement('div');
            const isCurrent = item.url === current;
            card.className = 'flex flex-col overflow-hidden rounded-lg bg-secondaryBg shadow-md border ' +
                (isCurrent ? 'border-primaryBtn' : 'border-[#22242b]');
            card.innerHTML = `
              <div class="relative w-full bg-tertiaryBg" style="aspect-ratio:16/9">
                <img data-src="${item.url}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"/>
              </div>
              <div class="flex items-center gap-2 p-3">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-primaryText"></p>
                  <p class="text-xs text-secondaryText capitalize">${item.category}${isCurrent ? ' · current' : ''}</p>
                </div>
                <a data-ycc-full href="${item.url}" target="_blank" class="text-xs text-secondaryText hover:text-primaryText" title="Open full size in a new tab">Full</a>
                <button data-ycc-apply class="rounded-md bg-primaryBtn px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">Apply</button>
              </div>`;
            const title = card.querySelector('p');
            title.textContent = item.name;
            title.title = item.name;
            card.querySelector('[data-ycc-apply]').addEventListener('click', () => {
                if (applyCollectionBackground(item)) closeBackgroundBrowser();
                else showInjectionNotification(notification_resource_name, null, 'Open Customize Chat first, then Browse collection.');
            });
            grid.appendChild(card);
            loader.observe(card.querySelector('img'));
        }
        setFooter(`${shown.length} of ${items.length} backgrounds`);
    };

    tabs.addEventListener('click', e => {
        const b = e.target instanceof Element && e.target.closest('button[data-cat]');
        if (b) { category = b.dataset.cat; render(); }
    });
    search.addEventListener('input', render);

    try {
        items = await getBackgroundCollection();
    } catch (e) {
        console.error('Background collection failed to load:', e);
        grid.innerHTML = `<p class="col-span-full text-center text-secondaryText">Couldn't load the collection (${e.message}). Try again in a minute.</p>`;
        setFooter('Collection unavailable');
        return;
    }
    render();
    search.focus();
}

/**
 * Adds the "Browse collection" button under the Background URL field of Customize Chat.
 * @param {HTMLElement} form
 * @returns {void}
 */
function addBrowseCollectionButton(form) {
    const urlInput = form.querySelector('#bg-url-input');
    if (!urlInput || form.querySelector('#bg-browse-collection-button')) return;
    const button = document.createElement('button');
    button.id = 'bg-browse-collection-button';
    button.type = 'button';
    button.className = 'mt-2 flex w-full items-center justify-center gap-2 rounded bg-blue-400/40 py-2 px-3 text-xs font-medium text-white hover:bg-blue-400/80';
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v13.5a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V9.75Z"/>
      </svg>
      Browse collection`;
    button.addEventListener('click', openBackgroundBrowser);
    // After the file picker, so the order is: URL, file, collection
    const fileInput = form.querySelector('#bg-file-input');
    (fileInput?.parentElement || urlInput.parentElement).after(button);
}
