const rtf = new Intl.RelativeTimeFormat("it", { numeric: "auto" });

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const MONTH = 30 * DAY;

/** Tempo relativo in italiano ("2 ore fa", "ieri"). Il parametro `nowSeconds` rende la funzione testabile. */
export function timeAgo(unixSeconds, nowSeconds = Math.floor(Date.now() / 1000)) {
  const diff = unixSeconds - nowSeconds;
  const abs = Math.abs(diff);
  if (abs < MINUTE) return "adesso";
  if (abs < HOUR) return rtf.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), "hour");
  if (abs < MONTH) return rtf.format(Math.round(diff / DAY), "day");
  return rtf.format(Math.round(diff / MONTH), "month");
}

/** Estrae il dominio leggibile da un URL; stringa vuota se l'URL non è valido. */
export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Iniziale maiuscola del dominio, per il "logo" tondo della fonte. */
export function domainInitial(domain) {
  return domain ? domain.charAt(0).toUpperCase() : "#";
}

/** Tonalità (0-359) stabile per una stringa: lo stesso dominio ha sempre lo stesso colore. */
export function hueFromString(text) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export const HOT_SCORE = 200;

/** Una storia con molti voti è "in tendenza". */
export function isHot(score) {
  return score >= HOT_SCORE;
}

export function pluralizeComments(count) {
  return count === 1 ? "1 commento" : `${count} commenti`;
}

/** Ritarda `fn` finché non passano `ms` millisecondi dall'ultima chiamata. */
export function debounce(fn, ms) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
