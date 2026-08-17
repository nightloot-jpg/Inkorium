#!/bin/bash
./pr_simulate.sh "feat(photos): create Fotolog-style photos experience" "
- Crea una experiencia de fotos independiente (estilo Fotolog/Tuenti) usando la estructura visual solicitada (Inkorium 2026).
- Añade migración limpia: photos, photo_albums, photo_comments, photo_likes, photo_visibility_users (reutilizando RLS existente de Inkorium para privacidad pública/amigos/privada).
- Permite subida de archivos (JPG, PNG, WEBP, GIF) validando formato y peso (<10MB) contra Supabase Storage.
- Incluye galería de fotos con tarjetas (me gusta, comentarios), visor estilo modal (anterior, siguiente, información), y sección lateral de álbumes y estadísticas.
- Interfaz responsive que colapsa sidebars en móvil/tablet y ajusta la cuadrícula de la galería sin usar Tailwind.
- Total compatibilidad con Navbar y ruteo existente (se añadió 'fotos' al tipo Page).
- Comprobaciones: npm run lint y npm run build ejecutadas y sin errores.
"
