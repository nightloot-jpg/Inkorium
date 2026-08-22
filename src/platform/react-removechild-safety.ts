// Some legacy profile enhancers still patch DOM nodes inside the React-owned
// route bridge. React can then attempt to remove a node that an enhancer has
// already detached. Make removeChild idempotent only for the Inkorium route
// bridge so an outdated enhancer cannot crash the whole profile route.
const nativeRemoveChild = Node.prototype.removeChild;

Node.prototype.removeChild = function <T extends Node>(child: T): T {
  const parent = this as Node & { id?: string; parentNode?: Node | null };
  const isRouteBridge = parent && parent.nodeType === Node.ELEMENT_NODE && (parent as HTMLElement).closest?.('#inkorium-route-content-bridge');

  if (isRouteBridge && child.parentNode !== this) {
    return child;
  }

  return nativeRemoveChild.call(this, child) as T;
};
