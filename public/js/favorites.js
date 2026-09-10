// ============================================================================
// Favorites — toggle heart icon, persist IDs in localStorage
// - Red heart when saved
// - State survives reloads
// - Works for dynamically rendered cards
// ============================================================================

(function () {
  "use strict";

  const STORAGE_KEY = "stayandplay:favorites";

  // --------------------------------------------------------------------------
  // Storage helpers
  // --------------------------------------------------------------------------

  function readFavorites() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeFavorites(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.warn("Could not save favorites:", error);
    }
  }

  function isFavorite(id) {
    return readFavorites().includes(String(id));
  }

  function toggleFavorite(id) {
    const key = String(id);
    const ids = readFavorites();
    const index = ids.indexOf(key);

    if (index >= 0) {
      ids.splice(index, 1);
    } else {
      ids.push(key);
    }

    writeFavorites(ids);
    return index < 0; // true if now favorited
  }

  // --------------------------------------------------------------------------
  // UI helpers
  // --------------------------------------------------------------------------

  function paintButton(button, active) {
    button.classList.toggle("is-favorite", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");

    const label = button.getAttribute("aria-label") || "";
    const baseLabel = label.replace(/^(Save|Remove)\s+/, "");
    button.setAttribute(
      "aria-label",
      active ? `Remove ${baseLabel}` : `Save ${baseLabel}`
    );
  }

  function syncButton(button) {
    const id = button.dataset.propertyId;
    if (!id) return;
    paintButton(button, isFavorite(id));
  }

  // --------------------------------------------------------------------------
  // Delegated click handler — works with dynamic cards
  // --------------------------------------------------------------------------

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".js-favorite-toggle");
    if (!button) return;

    event.preventDefault();

    const id = button.dataset.propertyId;
    if (!id) return;

    const nowActive = toggleFavorite(id);
    paintButton(button, nowActive);
  });

  // --------------------------------------------------------------------------
  // Re-sync buttons whenever new cards are rendered
  // --------------------------------------------------------------------------

  document.addEventListener("stay:rendered", () => {
    document.querySelectorAll(".js-favorite-toggle").forEach(syncButton);
  });

  // Initial sync for any buttons already in the DOM
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".js-favorite-toggle").forEach(syncButton);
  });

  // Optional: expose API for other modules
  window.StayPlayFavorites = {
    isFavorite,
    toggleFavorite,
    getAll: readFavorites,
  };
})();