#!/usr/bin/env bash
# Mueve a cuarentena los módulos visuales/auxiliares identificados como huérfanos.
# Preserva el historial con git mv. No borra nada.
#
# Uso: ejecutar desde la raíz del repo Inkorium, en una rama nueva:
#   git checkout -b chore/css-quarantine
#   bash cuarentena-css-huerfanos.sh
#   npm run build   # o npm run dev, para verificar visualmente
#   git add -A && git commit -m "chore: cuarentena de CSS/ts huérfanos de Nuenti"

set -euo pipefail

DEST="src/_deprecated"
mkdir -p "$DEST"

FILES=(
  "src/redesign/profile-reference.css"
  "src/redesign/profile-theme.css"
  "src/features/profile/profile-scroll-header-fix.css"
  "src/features/profile/profile-header-tabs-2026.css"
  "src/features/profile/profile-tueni-composition-2026.css"
  "src/features/profile/profile-header-final-2026.css"
  "src/features/profile/profile-browser-scroll-fix.css"
  "src/features/profile/profile-final-polish-2026.css"
  "src/features/profile/profile-light-visual-correction.css"
  "src/features/profile/profile-tueni-2026.css"
  "src/features/profile/profile-tuenti-2026.css"
  "src/features/profile/profile-social-refresh-2026.css"
  "src/features/profile/profile-enhancements.css"
  "src/features/profile/profile-inicio-clean.css"
  "src/features/profile/profile-cover-true-square.css"
  "src/features/profile/profile-header-right-final.css"
  "src/features/profile/profile-cover-square.css"
  "src/features/profile/profile-photos-tab-2026.css"
  "src/features/profile/profile-music-layout.css"
  "src/features/profile/profile-cover-bottom-square-fix.css"
  "src/features/profile/profile-header-layout-v4.css"
  "src/features/profile/profile-background-fix-2026.css"
  "src/features/profile/profile-header-order-v4.css"
  "src/features/profile/profile-about-card.css"
  "src/features/profile/profile-cover-card-redesign.css"
  "src/features/profile/profile-photos-tab.css"
  "src/features/profile/profile-daily-song-profile-action.css"
  "src/features/profile/profile-cover-header-fix.css"
  "src/features/profile/profile-header-order.css"
  "src/features/profile/profile-square-widgets.css"
  "src/features/profile/profile-daily-song.css"
  "src/features/profile/profile-daily-song-polish.css"
  "src/features/profile/profile-header-separated-widgets.css"
  "src/features/profile/profile-music-daily-sync-restore.css"
  "src/features/profile/profile-modern-redesign.css"
  "src/features/profile/profile-daily-song-access-fix.css"
  "src/features/profile/profile-final-fixes.css"
  "src/features/profile/profile-daily-song-click-fix.css"
  "src/features/profile/profile-square-widgets-v2.css"
  "src/features/profile/profile-reference-header-final.css"
  "src/features/profile/profile-home-2026.css"
  "src/features/route-content-bridge-header-fix.css"
  "src/features/route-content-bridge-events-navbar-fix-2026.css"
  "src/features/feed/feed-2026.css"
  "src/tuenti-feed-fullwidth.css"
  "src/people-actions-2026.css"
  # Módulos .ts huérfanos (y sus CSS, que solo ellos cargaban)
  "src/features/profile/profile-final-fixes.ts"
  "src/features/profile/profile-music-daily-sync.ts"
  "src/features/profile/profile-music-daily-sync.css"
  "src/features/profile/profile-music-diary-view.ts"
  "src/features/profile/profile-music-diary-view.css"
  "src/features/profile/profile-music-final.ts"
  "src/features/profile/profile-music-final.css"
  "src/features/profile/profile-music-tab.ts"
  "src/features/profile/profile-music-tab.css"
  "src/features/profile/profile-music-taste-card.ts"
  "src/features/profile/profile-music-taste-card.css"
  "src/features/profile/profile-cover-render-fix.ts"
  "src/features/profile/profile-upcoming-events-more.ts"
  "src/features/profile/profile-image-picker-direct.ts"
)

moved=0
skipped=0
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    mkdir -p "$DEST/$(dirname "$f")"
    git mv "$f" "$DEST/$f"
    moved=$((moved + 1))
  else
    echo "AVISO: no existe (¿ya movido?): $f"
    skipped=$((skipped + 1))
  fi
done

echo ""
echo "Movidos: $moved   Omitidos: $skipped"
echo "Revisa con 'git status', compila, y si todo va bien, haz commit."
