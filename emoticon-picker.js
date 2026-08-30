(() => {
  const EMOTICONS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '🙂', '🙃', '😉', '😎', '😍', '🥰', '😘',
    '😋', '😜', '🤪', '🤗', '🤩', '😇', '🤔', '😴',
    '😢', '😭', '😡', '😱', '🤭', '🤫', '🙄', '😏',
    '👍', '👎', '👏', '🙌', '🙏', '💪', '❤️', '💙',
    '🔥', '✨', '⭐', '🎉', '🎵', '🎮', '☀️', '🌙',
    '😂', 'XD', 'xD', ':)', ':D', ';)',';D', ':P', ':/', '<3'
  ];

  let picker = null;
  let activeButton = null;

  const findComposer = (button) => {
    let node = button?.parentElement;
    for (let i = 0; i < 8 && node; i += 1) {
      const textarea = node.querySelector('textarea');
      if (textarea) return textarea;
      node = node.parentElement;
    }
    return document.querySelector('textarea[placeholder*="Escribe tu estado"]');
  };

  const closePicker = () => {
    if (picker) {
      picker.remove();
      picker = null;
    }
    activeButton = null;
  };

  const insertAtCursor = (textarea, value) => {
    if (!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const nextValue = textarea.value.slice(0, start) + value + textarea.value.slice(end);

    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) setter.call(textarea, nextValue);
    else textarea.value = nextValue;

    textarea.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
    const caret = start + value.length;
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  };

  const createPicker = (button, textarea) => {
    closePicker();
    activeButton = button;

    picker = document.createElement('div');
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-label', 'Seleccionar emoticono');
    picker.style.cssText = [
      'position:fixed', 'z-index:2147483646', 'width:300px', 'max-height:250px',
      'overflow:auto', 'padding:10px', 'display:grid', 'grid-template-columns:repeat(6,minmax(0,1fr))',
      'gap:6px', 'background:#fff', 'border:1px solid #cbd5e1', 'border-radius:8px',
      'box-shadow:0 12px 30px rgba(15,23,42,.2)', 'font-family:inherit'
    ].join(';');

    EMOTICONS.forEach((emoticon) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = emoticon;
      item.title = `Insertar ${emoticon}`;
      item.style.cssText = [
        'height:36px', 'border:0', 'border-radius:6px', 'background:#f3f6fa',
        'color:#334155', 'font-size:20px', 'cursor:pointer', 'display:flex',
        'align-items:center', 'justify-content:center', 'padding:0 4px'
      ].join(';');
      item.addEventListener('mouseenter', () => { item.style.background = '#e5edf6'; });
      item.addEventListener('mouseleave', () => { item.style.background = '#f3f6fa'; });
      item.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        insertAtCursor(textarea, emoticon);
        closePicker();
      });
      picker.appendChild(item);
    });

    const rect = button.getBoundingClientRect();
    const left = Math.min(rect.left, window.innerWidth - 312);
    const top = rect.bottom + 8;
    picker.style.left = `${Math.max(8, left)}px`;
    picker.style.top = `${Math.max(8, Math.min(top, window.innerHeight - 270))}px`;

    document.body.appendChild(picker);
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button');
    if (!button) {
      if (picker && !picker.contains(target)) closePicker();
      return;
    }

    const label = (button.textContent || '').replace(/\s+/g, ' ').trim();
    if (label !== 'Emoticono') {
      if (picker && !picker.contains(target)) closePicker();
      return;
    }

    const textarea = findComposer(button);
    if (!textarea) return;
    event.preventDefault();
    event.stopPropagation();

    if (picker && activeButton === button) closePicker();
    else createPicker(button, textarea);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePicker();
  });

  window.addEventListener('resize', closePicker);
  window.addEventListener('scroll', closePicker, true);
})();
