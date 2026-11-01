(() => {
  const root = document.querySelector('.cl-search');
  if (!root) return;
  const input = root.querySelector('input');
  const clear = root.querySelector('.cl-search__clear');
  const status = document.querySelector('.cl-search__status');

  input.addEventListener('input', () => {
    clear.hidden = input.value.length === 0;
    status.textContent = input.value ? `Searching for: ${input.value}` : 'Type to try the search field.';
  });

  clear.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  });
})();