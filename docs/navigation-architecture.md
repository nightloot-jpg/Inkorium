# Navigation architecture

Inkorium uses one React root and browser history as the routing source of truth.

## Rules

- Navigation is rendered inside the existing React tree.
- Route changes use `history.pushState` and `popstate`.
- Route parameters use the URL query string.
- No document-level click interception is used for routing.
- Route labels and button text are not parsed to determine destinations.
- `sessionStorage` may be read once for legacy URL migration, but it is not the routing source of truth.

`RouteContentBridge.tsx` is kept as a compatibility-oriented name for the routed content component. It no longer creates a React root or installs global navigation listeners.
