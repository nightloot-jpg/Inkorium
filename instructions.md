### CORS de Supabase y Dominio Canónico

He revisado el repositorio y el archivo `supabase/config.toml` (que es la configuración para desarrollo local y no afecta directamente a producción si se despliega desde el Dashboard). El origen permitido (CORS) y la URL del sitio no están definidos a nivel de código de forma que se puedan inyectar en el backend de Supabase automáticamente sin usar la CLI en producción.

Además, las variables de entorno en el frontend (ej. `VITE_SUPABASE_URL`) son correctas y dinámicas.

Por lo tanto, los cambios de CORS y Dominio deben hacerse manualmente en Supabase y Coolify/DNS.

**1. Cambios manuales en Supabase (para solucionar CORS):**

1. Ve al Dashboard de Supabase.
2. Selecciona tu proyecto.
3. Ve a **Authentication** -> **URL Configuration**.
4. En el campo **Site URL**, asegúrate de que el valor sea exactamente:
   `https://www.inkorium.es`
5. En la sección **Additional Redirect URLs**, asegúrate de tener añadido:
   `https://www.inkorium.es` (y si lo deseas, `https://inkorium.es` para mayor flexibilidad, aunque el tráfico irá a www).
6. Ve a **Project Settings** -> **API**.
7. En la sección **API Settings**, busca **Additional CORS Origins** (o si no está allí, la Site URL de Auth ya actúa como origen permitido base). Asegúrate de que `https://www.inkorium.es` y `https://inkorium.es` están permitidos. Si usas custom domains, asegúrate de haberlo configurado.

**2. Cambios en Coolify (Redirección de inkorium.es a www.inkorium.es):**

Para asegurar que no existan dos versiones simultáneas de la web y que las sesiones/cookies funcionen correctamente, Coolify (o Traefik/Caddy) debe redirigir el tráfico sin www hacia www.

1. Ve al Dashboard de Coolify.
2. Selecciona tu recurso (Aplicación).
3. En la pestaña **Configuration** -> **General** (o Domains), asegúrate de que el **FQDN (Domains)** tenga `https://www.inkorium.es`.
4. Si quieres que Coolify gestione la redirección automáticamente, añade también `https://inkorium.es` (separado por comas) y habilita la opción de **Redirect www/non-www** a favor de `www`, si tu versión de Coolify lo soporta en la interfaz.
5. Si no lo soporta en la interfaz, debes añadir una directiva personalizada (Traefik labels o Caddyfile, dependiendo de tu proxy en Coolify) para redirigir 301 de `inkorium.es` a `www.inkorium.es`.

A nivel de frontend en el repositorio, `vite.config.ts` ya permite `.inkorium.es` para los hosts, por lo que responderá bien a la petición redirigida.
