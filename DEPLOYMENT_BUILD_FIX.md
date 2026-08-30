# Deployment build fix

- `FeedShell.tsx` no longer imports the missing `src/tuenti-2026.css` file; the supplied design layer is `src/tuenti-zip-design.css`.
- `secure-vite.config.ts` now uses an explicit `.ts` extension when importing `vite.config.ts`, removing the Vite native-config warning.
