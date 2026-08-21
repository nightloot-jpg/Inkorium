const syncProfileBanner = () => {
  const cover = document.querySelector<HTMLElement>('.profile-view-page .profile-view-cover');
  if (!cover) return;
  const inlineBackground = cover.style.backgroundImage;
  if (inlineBackground) {
    cover.style.setProperty('background-image', inlineBackground, 'important');
  }
};

const boot = () => {
  syncProfileBanner();
  const observer = new MutationObserver(syncProfileBanner);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style'],
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
