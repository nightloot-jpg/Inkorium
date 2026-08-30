(() => {
  const EMOTICONS = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','🙂','🙃','😉',
    '😎','😍','🥰','😘','😋','😜','🤪','🤗','🤩','😇','🤔','😴',
    '😢','😭','😡','😱','🤭','🤫','🙄','😏','👍','👎','👏','🙌',
    '🙏','💪','❤️','💙','🔥','✨','⭐','🎉','🎵','🎮','☀️','🌙',
    'XD','xD',':)',':D',';)',';D',':P',':/','<3',':-)',';-)',
    '^^','^_^','-_-','T_T','O:)','B)','<3 :)','<3 <3'
  ];

  let picker = null;
  let anchor = null;
  let textarea = null;

  const isElement = (value) => value instanceof Element;

  const getEmoticonButton = (target) => {
    if (!isElement(target)) return null;
    const button = target.closest('button');
    if (!button) return null;
    const label = (button.textContent || '').replace(/\s+/g, ' ').trim();
    const title = (button.getAttribute('title') || '').toLowerCase();
    return label === 'Emoticono' || title.includes('emoticono') ? button : null;
  };

  const findComposer = (button) => {
    let node = button?.parentElement;
    for (let i = 0; i < 15 && node; i += 1) {
      const candidate = node.querySelector('textarea[placeholder*="Escribe tu estado"], textarea');
      if (candidate instanceof HTMLTextAreaElement) return candidate;
      node = node.parentElement;
    }
    return document.querySelector('textarea[placeholder*="Escribe tu estado"], textarea');
  };

  const closePicker = () => {
    if (picker) picker.remove();
    picker = null;
    anchor = null;
    textarea = null;
  };

  const insertAtCursor = (field, value) => {
    if (!(field instanceof HTMLTextAreaElement)) return;
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;
    const next = field.value.slice(0, start) + value + field.value.slice(end);
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) setter.call(field, next);
    else field.value = next;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    const caret = start + value.length;
    field.focus();
    field.setSelectionRange(caret, caret);
  };

  const positionPicker = () => {
    if (!picker || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 16);
    const height = 310;
    let left = rect.left;
    let top = rect.bottom + 8;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    if (window.innerHeight - rect.bottom < height + 16) top = rect.top - height - 8;
    picker.style.left = `${Math.max(8, left)}px`;
    picker.style.top = `${Math.max(8, top)}px`;
    picker.style.width = `${width}px`;
  };

  const createPicker = (button, field) => {
    closePicker();
    anchor = button;
    textarea = field;
    picker = document.createElement('div');
    picker.id = 'inkorium-emoticon-picker';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-label', 'Seleccionar emoticono');
    picker.style.cssText = [
      'position:fixed','z-index:2147483647','max-height:310px','overflow-y:auto',
      'padding:10px','display:grid','grid-template-columns:repeat(6,minmax(0,1fr))',
      'gap:6px','background:#fff','border:1px solid #cbd5e1','border-radius:8px',
      'box-shadow:0 12px 34px rgba(15,23,42,.24)','font-family:inherit'
    ].join(';');

    EMOTICONS.forEach((value) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = value;
      item.title = `Insertar ${value}`;
      item.setAttribute('aria-label', `Insertar ${value}`);
      item.style.cssText = [
        'min-height:38px','padding:4px 3px','border:1px solid #e2e8f0','border-radius:6px',
        'background:#f8fafc','color:#1e293b','font-size:19px','line-height:1','cursor:pointer',
        'display:flex','align-items:center','justify-content:center'
      ].join(';');
      item.addEventListener('mousedown', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      item.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        insertAtCursor(textarea, value);
        closePicker();
      });
      item.addEventListener('mouseenter', () => { item.style.background = '#eaf1f8'; });
      item.addEventListener('mouseleave', () => { item.style.background = '#f8fafc'; });
      picker.appendChild(item);
    });
    document.body.appendChild(picker);
    positionPicker();
  };

  const handleDocumentPointerDown = (event) => {
    const target = event.target;
    if (!isElement(target)) return;

    const button = getEmoticonButton(target);
    if (!button) return;

    const field = findComposer(button);
    if (!field) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (picker && anchor === button) closePicker();
    else createPicker(button, field);
  };

  document.addEventListener('pointerdown', handleDocumentPointerDown, true);

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!picker || !isElement(target)) return;
    if (!picker.contains(target) && !anchor?.contains(target)) closePicker();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePicker();
  });

  window.addEventListener('resize', positionPicker);
  window.addEventListener('scroll', positionPicker, true);
})();
