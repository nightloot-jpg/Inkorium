const profileFixes = () => {
  const root = document.querySelector('.profile-view-page');
  if (!root || root.getAttribute('data-final-fixes') === '1') return;
  root.setAttribute('data-final-fixes', '1');

  const syncCoverBackground = () => {
    const cover = root.querySelector<HTMLElement>('.profile-view-cover');
    if (!cover) return;

    const inlineBackground = cover.style.backgroundImage;
    if (inlineBackground) {
      cover.style.setProperty('background-image', inlineBackground, 'important');
    } else if (cover.style.getPropertyPriority('background-image') === 'important') {
      cover.style.removeProperty('background-image');
    }
  };

  syncCoverBackground();

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const editable = target.closest('.profile-about-bio, .profile-about-location, .profile-about-interests');
    if (!editable) return;

    const editButton = root.querySelector<HTMLButtonElement>('.profile-about-edit');
    if (!editButton) return;

    editButton.click();

    window.setTimeout(() => {
      if (editable.classList.contains('profile-about-location')) {
        root.querySelector<HTMLInputElement>('#about-city')?.focus();
        return;
      }
      if (editable.classList.contains('profile-about-interests')) {
        root.querySelector<HTMLInputElement>('.profile-about-custom-interest input')?.focus();
        return;
      }
      root.querySelector<HTMLTextAreaElement>('#about-bio')?.focus();
    }, 40);
  });
};

const boot = () => {
  profileFixes();
  const observer = new MutationObserver(() => {
    profileFixes();
    const root = document.querySelector('.profile-view-page');
    if (!root) return;

    const cover = root.querySelector<HTMLElement>('.profile-view-cover');
    if (!cover) return;

    const inlineBackground = cover.style.backgroundImage;
    if (inlineBackground) {
      cover.style.setProperty('background-image', inlineBackground, 'important');
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
