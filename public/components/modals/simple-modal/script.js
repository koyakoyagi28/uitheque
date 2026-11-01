(() => {
  const root = document.querySelector('.cl-modal-demo');
  if (!root) return;
  const dialog = root.querySelector('.cl-modal');
  root.querySelector('.cl-modal-trigger').addEventListener('click', () => dialog.showModal());
  root.querySelector('.cl-modal__close').addEventListener('click', () => dialog.close());
  root.querySelector('.cl-modal__done').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
})();