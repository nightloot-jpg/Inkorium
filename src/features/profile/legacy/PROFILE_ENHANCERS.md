# Perfil legacy: retirada progresiva

`RouteContentBridge` todavía carga enhancers históricos de Perfil. No se eliminan todos de golpe.

## Criterio de retirada

Un enhancer puede eliminarse cuando su responsabilidad esté cubierta por un componente React/hook/service y no tenga efectos secundarios necesarios fuera de Perfil.

## Orden de auditoría

1. `profile-photos-tab`
2. `profile-upcoming-events-more`
3. `profile-image-picker-direct`
4. `profile-cover-render-fix`
5. `profile-music-diary-sync`
6. `profile-music-taste-card`

Cada retirada debe hacerse en una PR pequeña, probar navegación Perfil → Feed → Perfil, F5 y build de producción.
