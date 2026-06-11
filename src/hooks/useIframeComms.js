import { useEffect } from 'react';

const SOURCE = 'selfiestyler';

// Send a typed message to the parent window (embed.js)
export function sendToParent(type, payload = {}) {
  window.parent.postMessage({ source: SOURCE, type, ...payload }, '*');
}

// Tell embed.js to show a different iframe
export function navigateTo(target, data = {}) {
  sendToParent('SS_NAVIGATE', { target, ...data });
}

// Tell embed.js to close the overlay
export function closeOverlay() {
  sendToParent('SS_CLOSE');
}

// Listen for messages from parent or sibling iframes relayed by parent
export function useParentMessages(handlers) {
  useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.source !== SOURCE) return;
      handlers[e.data.type]?.(e.data);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handlers]);
}
