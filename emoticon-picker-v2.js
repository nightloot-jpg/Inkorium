(() => {
  const EMOTICONS = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','🙂','🙃','😉','😎','😍','🥰','😘','😋','😜','🤪','🤗','🤩','😇','🤔','😴','😢','😭','😡','😱','🤭','🤫','🙄','😏','👍','👎','👏','🙌','🙏','💪','❤️','💙','🔥','✨','⭐','🎉','🎵','🎮','☀️','🌙','XD','xD',':)',':D',';)',';D',':P',':/','<3',':-)',';-)','^^','^_^','-_-','T_T','O:)','B)','<3 :)','<3 <3'];
  let picker = null;
  let anchor = null;
  let textarea = null;
  let suppressClick = false;

  const getTrigger = (target) => {
    if (!(target instanceof Element)) return null;
    const button = target.closest('button');
    if (!button) return null;
    return (button.textContent || '').replace(/\s+/g, ' ').trim() === 'Emoticono' ? button : null;
  };

  const findComposer = (button) => {
    let node = button?.parentElement;
    for (let i = 0; i < 10 && node; i += 1) {
      const candidate = node.querySelector('textarea[placeholder*="Escribe tu estado"], textarea');
      if (candidate instanceof HTMLTextAreaElement) return candidate;
      node = node.parentElement;
    }
    return document.querySelector('textarea[placeholder*="Escribe tu estado"]');
  };

  const closePicker = () => {
    if (picker) picker.remove();
    picker = null;
    anchor = null;
    textarea = null;
  };

  const insert = (field, value) => {
    if (!(field instanceof HTMLTextAreaElement)) return;
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;
    const next = field.value.slice(0, start) + value + field.value.slice(end);
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) setter.call(field, next); else field.value = next;
    field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
    const caret = start + value.length;
    field.focus();
    field.setSelectionRange(caret, caret);
  };

  const position = () => {
    if (!picker || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const width = 320;
    const height = 280;
    const left = Math.min(Math.max(8, r.left), Math.max(8, innerWidth - width - 8));
    const below = innerHeight - r.bottom - 8;
    const top = below >= height ? r.bottom + 8 : Math.max(8, r.top - height - 8);
    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
  };

  const openPicker = (button) => {
    const field = findComposer(button);
    if (!field) return;
    closePicker();
    anchor = button;
    textarea = field;

    picker = document.createElement('div');
    picker.id = 'inkorium-emoticon-picker';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-label', 'Seleccionar emoticono');
    picker.style.cssText = 'position:fixed;z-index:2147483647;width:320px;max-height:280px;overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;background:#fff;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 12px 34px rgba(15,23,42,.24);font-family:inherit;';

    EMOTICONS.forEach((value) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = value;
      item.title = `Insertar ${value}`;
      item.style.cssText = 'min-height:36px;padding:4px 3px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;color:#1e293b;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;';
      item.addEventListener('mouseenter', () => { item.style.background = '#eaf1f8'; });
      item.addEventListener('mouseleave', () => { item.style.background = '#f8fafc'; });
      item.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
      item.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); insert(textarea, value); closePicker(); });
      picker.appendChild(item);
    });

    document.body.appendChild(picker);
    position();
  };

  document.addEventListener('pointerdown', (event) => {
    const button = getTrigger(event.target);
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    suppressClick = true;
    if (picker && anchor === button) closePicker(); else openPicker(button);
  }, true);

  document.addEventListener('click', (event) => {
    const button = getTrigger(event.target);
    if (suppressClick && button) {
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    if (picker && target && !picker.contains(target) && !anchor?.contains(target)) closePicker();
  }, true);

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closePicker(); });
  window.addEventListener('resize', closePicker);
  window.addEventListener('scroll', closePicker, true);
})();
