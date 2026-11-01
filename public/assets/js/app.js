'use strict';

const state = {
  components: [],
  selectedCategory: 'all',
  selectedComponent: null,
  selectedFile: 'html',
  sourceFiles: {},
};

const elements = {
  componentCount: document.querySelector('#component-count'),
  allCount: document.querySelector('#all-count'),
  categoryList: document.querySelector('#category-list'),
  catalogTitle: document.querySelector('#catalog-title'),
  searchInput: document.querySelector('#search-input'),
  componentGrid: document.querySelector('#component-grid'),
  emptyState: document.querySelector('#empty-state'),
  dialog: document.querySelector('#component-dialog'),
  dialogTitle: document.querySelector('#dialog-title'),
  dialogCategory: document.querySelector('#dialog-category'),
  dialogDescription: document.querySelector('#dialog-description'),
  dialogTags: document.querySelector('#dialog-tags'),
  previewFrame: document.querySelector('#preview-frame'),
  sourceCode: document.querySelector('#source-code'),
  sourceFilename: document.querySelector('#source-filename'),
  urlList: document.querySelector('#url-list'),
  toast: document.querySelector('#toast'),
};

const categoryLabels = {
  buttons: 'Buttons',
  inputs: 'Inputs',
  modals: 'Modals',
  dropdowns: 'Dropdowns',
  navigation: 'Navigation',
  loaders: 'Loaders',
  cards: 'Cards',
  feedback: 'Feedback',
};

const fileLabels = {
  html: 'index.html',
  css: 'style.css',
  js: 'script.js',
  info: 'info.json',
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();

  try {
    const response = await fetch('./assets/data/components.json');
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    const catalog = await response.json();
    const entries = Array.isArray(catalog.components) ? catalog.components : [];
    state.components = await Promise.all(entries.map(loadComponentMetadata));
    state.components = state.components.filter(Boolean);
    renderCategories();
    renderComponents();
    elements.componentCount.textContent = `${state.components.length} COMPONENTS AVAILABLE`;
    elements.allCount.textContent = state.components.length;
  } catch (error) {
    elements.componentGrid.innerHTML = '<div class="loading-state">Could not load the component catalog. Check the published files and browser console.</div>';
    elements.componentCount.textContent = 'CATALOG UNAVAILABLE';
    console.error(error);
  }
}

function bindEvents() {
  elements.searchInput.addEventListener('input', renderComponents);
  elements.categoryList.addEventListener('click', handleCategoryClick);
  document.querySelector('.category-button[data-category="all"]').addEventListener('click', () => {
    state.selectedCategory = 'all';
    renderCategories();
    renderComponents();
  });
  elements.componentGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open-component]');
    if (button) openComponent(button.dataset.openComponent);
  });
  document.querySelector('#dialog-close').addEventListener('click', closeDialog);
  elements.dialog.addEventListener('click', (event) => {
    if (event.target === elements.dialog) closeDialog();
  });
  document.querySelectorAll('.source-tab').forEach((tab) => {
    tab.addEventListener('click', () => selectSource(tab.dataset.file));
  });
  document.querySelector('#copy-current').addEventListener('click', () => copyText(state.sourceFiles[state.selectedFile] || ''));
  document.querySelector('#copy-all').addEventListener('click', copyAllSources);
  elements.urlList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-copy-url]');
    if (button) copyText(button.dataset.copyUrl);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      elements.searchInput.focus();
    }
    if (event.key === 'Escape' && elements.dialog.open) closeDialog();
  });
}

async function loadComponentMetadata(entry) {
  try {
    const basePath = normalizePath(entry.path);
    const response = await fetch(`${basePath}info.json`);
    if (!response.ok) throw new Error(`Metadata missing for ${entry.id}`);
    const info = await response.json();
    return { ...info, id: info.id || entry.id, path: basePath };
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function normalizePath(path) {
  return `${path.replace(/^\/+|\/+$/g, '')}/`;
}

function handleCategoryClick(event) {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  state.selectedCategory = button.dataset.category;
  renderCategories();
  renderComponents();
}

function renderCategories() {
  const counts = state.components.reduce((result, component) => {
    result[component.category] = (result[component.category] || 0) + 1;
    return result;
  }, {});
  document.querySelector('.category-button[data-category="all"]').classList.toggle('is-active', state.selectedCategory === 'all');
  elements.categoryList.innerHTML = Object.entries(counts).map(([category, count]) => `
    <button class="category-button ${state.selectedCategory === category ? 'is-active' : ''}" data-category="${escapeHtml(category)}">
      <span class="category-icon">◈</span>${escapeHtml(categoryLabels[category] || titleCase(category))}
      <span class="category-count">${count}</span>
    </button>
  `).join('');
}

function renderComponents() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const visible = state.components.filter((component) => {
    const matchesCategory = state.selectedCategory === 'all' || component.category === state.selectedCategory;
    const searchable = [component.name, component.id, component.description, ...(component.tags || [])].join(' ').toLowerCase();
    return matchesCategory && searchable.includes(query);
  });

  elements.catalogTitle.textContent = state.selectedCategory === 'all'
    ? 'All components'
    : categoryLabels[state.selectedCategory] || titleCase(state.selectedCategory);
  elements.emptyState.hidden = visible.length > 0;
  elements.componentGrid.innerHTML = visible.map((component) => componentCard(component)).join('');

  elements.componentGrid.querySelectorAll('iframe[data-preview]').forEach((frame) => {
    const component = visible.find((item) => item.id === frame.dataset.preview);
    if (component) loadPreview(frame, component).catch(console.warn);
  });
}

function componentCard(component) {
  const fileTypes = ['HTML', 'CSS', ...(component.files?.js ? ['JS'] : [])].join(' + ');
  return `
    <article class="component-card">
      <div class="card-preview">
        <iframe title="${escapeHtml(component.name)} preview" data-preview="${escapeHtml(component.id)}" sandbox="allow-scripts" loading="lazy"></iframe>
      </div>
      <div class="card-content">
        <div class="card-topline"><span class="card-category">${escapeHtml(categoryLabels[component.category] || component.category)}</span><span class="file-badge">${fileTypes}</span></div>
        <h3>${escapeHtml(component.name)}</h3>
        <p>${escapeHtml(component.description || '')}</p>
        <div class="card-bottom"><span class="card-id">${escapeHtml(component.id)}</span><button class="card-open" data-open-component="${escapeHtml(component.id)}">View source ↗</button></div>
      </div>
    </article>
  `;
}

async function loadPreview(frame, component) {
  const html = await fetchComponentFile(component, 'html');
  const css = await fetchComponentFile(component, 'css');
  const js = component.files?.js ? await fetchComponentFile(component, 'js') : '';
  frame.srcdoc = buildPreviewDocument(html, css, js);
}

function buildPreviewDocument(html, css, js) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}html,body{min-height:100%;margin:0}body{display:grid;place-items:center;padding:18px;background:transparent;font-family:system-ui,sans-serif}
    ${css}
  </style></head><body>${html}<script>${js.replace(/<\/script/gi, '<\\/script')}<\/script></body></html>`;
}

async function openComponent(id) {
  const component = state.components.find((item) => item.id === id);
  if (!component) return;
  state.selectedComponent = component;
  state.sourceFiles = {};
  elements.dialogTitle.textContent = component.name;
  elements.dialogCategory.textContent = categoryLabels[component.category] || component.category;
  elements.dialogDescription.textContent = component.description || '';
  elements.dialogTags.innerHTML = (component.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  elements.dialog.showModal();

  try {
    const types = ['html', 'css', 'info'];
    if (component.files?.js) types.push('js');
    await Promise.all(types.map(async (type) => {
      state.sourceFiles[type] = await fetchComponentFile(component, type);
    }));
    if (!component.files?.js) state.sourceFiles.js = 'No JavaScript file for this component.';
    await loadPreview(elements.previewFrame, component);
    renderUrls(component);
    selectSource('html');
  } catch (error) {
    elements.sourceCode.textContent = `Unable to load source: ${error.message}`;
    console.error(error);
  }
}

async function fetchComponentFile(component, type) {
  const filename = component.files?.[type];
  if (!filename) return '';
  const response = await fetch(`${component.path}${filename}`);
  if (!response.ok) throw new Error(`${filename} request failed (${response.status})`);
  return response.text();
}

function selectSource(type) {
  state.selectedFile = type;
  document.querySelectorAll('.source-tab').forEach((tab) => {
    const active = tab.dataset.file === type;
    tab.classList.toggle('is-active', active);
    tab.disabled = type === 'js' && !state.selectedComponent?.files?.js;
  });
  elements.sourceCode.textContent = state.sourceFiles[type] || (type === 'js' ? 'No JavaScript file for this component.' : 'Source not available.');
  elements.sourceFilename.textContent = fileLabels[type];
}

function renderUrls(component) {
  const types = ['html', 'css', 'js', 'info'].filter((type) => component.files?.[type]);
  elements.urlList.innerHTML = types.map((type) => {
    const url = new URL(`${component.path}${component.files[type]}`, document.baseURI).href;
    return `<div class="url-row"><span class="url-type">${type.toUpperCase()}</span><span class="url-value" title="${escapeHtml(url)}">${escapeHtml(url)}</span><button class="url-copy" data-copy-url="${escapeHtml(url)}">Copy URL</button></div>`;
  }).join('');
}

async function copyAllSources() {
  const component = state.selectedComponent;
  if (!component) return;
  const blocks = ['html', 'css', 'js'].filter((type) => component.files?.[type]).map((type) => `/* ${fileLabels[type]} */\n${state.sourceFiles[type]}`);
  await copyText(blocks.join('\n\n'));
}

async function copyText(value) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    showToast('Copied to clipboard');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    showToast('Copied to clipboard');
  }
}

function closeDialog() {
  elements.dialog.close();
  elements.previewFrame.srcdoc = '';
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 1800);
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}
