/**
 * Wrapper sicuro attorno a un backend tipo localStorage (getItem/setItem).
 * Se il backend manca, è pieno o contiene JSON corrotto, l'app continua a funzionare.
 */
export function createSafeStorage(backend) {
  return {
    get(key, fallback) {
      try {
        const raw = backend?.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        backend?.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
  };
}
