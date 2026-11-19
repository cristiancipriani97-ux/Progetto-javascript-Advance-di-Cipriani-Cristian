import {
  timeAgo,
  domainOf,
  pluralizeComments,
  domainInitial,
  hueFromString,
  isHot,
} from "../utils/format.js";
import { getVisibleStories, hasMore } from "../store/selectors.js";

const HN_ITEM_URL = "https://news.ycombinator.com/item?id=";
const MAX_STAGGER = 10;

/**
 * View: costruisce il DOM a partire dallo stato e inoltra le azioni dell'utente
 * agli `handlers`. Non conosce API né storage. Si usa solo textContent (mai innerHTML
 * con dati esterni) per evitare XSS.
 */
export function createView(doc, handlers) {
  const els = {
    list: doc.getElementById("list"),
    status: doc.getElementById("status"),
    loadMore: doc.getElementById("load-more"),
    tabs: [...doc.querySelectorAll(".tab")],
    form: doc.getElementById("search-form"),
    input: doc.getElementById("search-input"),
    theme: doc.getElementById("theme-toggle"),
    favCount: doc.getElementById("fav-count"),
  };

  // L'animazione d'ingresso vale solo per le card nuove, non a ogni ridisegno.
  let listKey = "";
  let seenIds = new Set();

  /* ---------- Eventi ---------- */

  els.tabs.forEach((tab) => tab.addEventListener("click", () => handlers.onSelectSection(tab.dataset.tab)));
  els.loadMore.addEventListener("click", () => handlers.onLoadMore());
  els.theme.addEventListener("click", () => handlers.onToggleTheme());
  els.input.addEventListener("input", () => handlers.onSearchInput(els.input.value));
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    handlers.onSearchSubmit(els.input.value);
  });
  els.list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fav-id]");
    if (button) handlers.onToggleFavorite(Number(button.dataset.favId));
  });
  els.status.addEventListener("click", (event) => {
    if (event.target.closest("[data-retry]")) handlers.onRetry();
  });

  // Scorciatoie: "/" porta alla ricerca, Esc la svuota.
  doc.addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement?.tagName ?? "");
    if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      els.input.focus();
    } else if (event.key === "Escape" && doc.activeElement === els.input) {
      els.input.value = "";
      els.input.blur();
      handlers.onSearchSubmit("");
    }
  });

  /* ---------- Rendering ---------- */

  function el(tag, className, text) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function link(href, className, text) {
    const a = el("a", className, text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  function renderCard(story, { isFavorite, rank, featured, staggerIndex }) {
    const li = el("li", "card");
    if (featured) li.classList.add("card--featured");
    if (staggerIndex !== null) {
      li.classList.add("is-new");
      li.style.setProperty("--i", String(Math.min(staggerIndex, MAX_STAGGER)));
    }

    if (rank) li.append(el("div", "rank", String(rank)));

    const body = el("div", "body");

    // Fonte: pallino colorato con iniziale + dominio (+ badge "in tendenza")
    const domain = story.url ? domainOf(story.url) : "";
    const source = el("div", "source");
    const chip = el("span", "chip", domainInitial(domain));
    chip.style.setProperty("--hue", String(hueFromString(domain)));
    chip.setAttribute("aria-hidden", "true");
    source.append(chip, el("span", "", domain || "Discussione su Hacker News"));
    if (isHot(story.score)) source.append(el("span", "hot", "🔥 In tendenza"));

    const title = link(story.url || HN_ITEM_URL + story.id, "card-title", story.title);

    const meta = el("div", "meta");
    meta.append(el("span", "score", `▲ ${story.score}`));
    if (story.author) meta.append(el("span", "", `di ${story.author}`));
    if (story.time) meta.append(el("span", "", timeAgo(story.time)));

    const actions = el("div", "actions");
    const comments = link(HN_ITEM_URL + story.id, "link", `💬 ${pluralizeComments(story.commentsCount)}`);

    const fav = el("button", "fav", isFavorite ? "♥ Salvata" : "♡ Salva");
    fav.type = "button";
    fav.dataset.favId = String(story.id);
    fav.setAttribute("aria-pressed", String(isFavorite));
    fav.setAttribute("aria-label", `${isFavorite ? "Rimuovi dai preferiti" : "Salva nei preferiti"}: ${story.title}`);

    actions.append(comments, fav);
    body.append(source, title, meta, actions);
    li.append(body);
    return li;
  }

  function renderSkeletons(count = 5) {
    return Array.from({ length: count }, () => el("li", "skeleton"));
  }

  function renderStatus(state, visibleCount) {
    els.status.replaceChildren();

    if (state.status) {
      els.status.append(state.status.message);
      if (state.status.retryable) {
        const retry = el("button", "btn btn-small", "Riprova");
        retry.type = "button";
        retry.dataset.retry = "";
        els.status.append(retry);
      }
      return;
    }

    if (state.section === "favorites" && visibleCount === 0) {
      els.status.append(
        state.query.trim()
          ? "Nessun preferito corrisponde alla ricerca."
          : "Nessun preferito: salva una notizia con ♡ per ritrovarla qui."
      );
    }
  }

  function render(state) {
    doc.documentElement.dataset.theme = state.theme;
    els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === state.section));
    els.favCount.textContent = String(state.favorites.length);

    // Non sovrascrivere il testo mentre l'utente sta scrivendo.
    if (doc.activeElement !== els.input && els.input.value !== state.query) {
      els.input.value = state.query;
    }

    const stories = getVisibleStories(state);
    renderStatus(state, stories.length);

    const key = `${state.section}|${state.query}`;
    if (key !== listKey || stories.length === 0) {
      listKey = key;
      seenIds = new Set();
    }

    if (state.loading && stories.length === 0) {
      els.list.replaceChildren(...renderSkeletons());
    } else {
      const favoriteIds = new Set(state.favorites.map((story) => story.id));
      const ranked = state.section !== "favorites" && !state.query;
      let newCount = 0;

      const cards = stories.map((story, index) => {
        const isNew = !seenIds.has(story.id);
        return renderCard(story, {
          isFavorite: favoriteIds.has(story.id),
          rank: ranked ? index + 1 : 0,
          featured: ranked && index === 0,
          staggerIndex: isNew ? newCount++ : null,
        });
      });
      stories.forEach((story) => seenIds.add(story.id));
      els.list.replaceChildren(...cards);
    }

    els.loadMore.hidden = !hasMore(state);
    els.loadMore.disabled = state.loading;
    els.loadMore.textContent = state.loading ? "Caricamento…" : "Carica altre notizie";
  }

  return { render };
}
