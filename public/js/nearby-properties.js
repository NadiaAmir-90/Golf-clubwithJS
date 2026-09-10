// ============================================================================
// Nearby Properties
// ----------------------------------------------------------------------------
// • Renders property cards into #stayGrid
// • Wires the #staySort dropdown to fetch from /get-property
// • Desktop (>=1024px): 6 cards  |  Mobile/tablet: 4 cards
// • Falls back to local JSON files if the API is unavailable
// • Emits a `stay:rendered` event so nearby-pager.js can rebuild dots
// ============================================================================

(function () {
  "use strict";

  // --------------------------------------------------------------------------
  // 1. Configuration
  // --------------------------------------------------------------------------

  const API_BASE =
    window.STAY_PLAY_CONFIG?.propertyApiBase || "/get-property";

  // Local JSON fallbacks (used only if the API fails).
  // Keys match the `value` of each <option> in #staySort.
  const LOCAL_FILES = {
    "most-popular":  "most_popular.json",
    "highest-price": "highest_price.json",
    "lowest-price":  "lowest_price.json",
  };

  // --------------------------------------------------------------------------
  // 2. DOM references
  // --------------------------------------------------------------------------

  const grid       = document.getElementById("stayGrid");
  const sortSelect = document.getElementById("staySort");

  if (!grid || !sortSelect) return;

  // --------------------------------------------------------------------------
  // 3. State
  // --------------------------------------------------------------------------

  let isLoading = false;
  let wasMobile = isMobile();

  // --------------------------------------------------------------------------
  // 4. Helpers
  // --------------------------------------------------------------------------

  function isMobile() {
    return window.matchMedia("(max-width: 1023px)").matches;
  }

  function getLimit() {
    return isMobile() ? 4 : 6;
  }

  function money(value) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    return "USD $" + Math.round(value).toLocaleString("en-US");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  // --------------------------------------------------------------------------
  // 5. Data fetching
  // --------------------------------------------------------------------------

  async function fetchProperties(sortKey, limit) {
    const url = `${API_BASE}?${encodeURIComponent(sortKey)}=true&limit=${limit}`;

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.results || [];

      if (!list.length) throw new Error("Empty API response");

      return list.slice(0, limit);
    } catch (err) {
      console.warn(
        "[nearby] API failed, falling back to local JSON:",
        err.message
      );
      return fetchLocal(sortKey, limit);
    }
  }

  async function fetchLocal(sortKey, limit) {
    const file = LOCAL_FILES[sortKey] || LOCAL_FILES["most-popular"];

    const res = await fetch(file);
    if (!res.ok) {
      throw new Error(`Local file ${file} not found (HTTP ${res.status})`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Expected JSON from ${file}, got "${contentType}"`);
    }

    const data = await res.json();
    return data.slice(0, limit);
  }

  // --------------------------------------------------------------------------
  // 6. Card template — ONE image per card
  // --------------------------------------------------------------------------

  function buildCard(p) {
    const id   = escapeHtml(p.id);
    const name = escapeHtml(p.name);

    const scoreLabel =
      typeof p.reviewScore === "number"
        ? `${p.reviewScore.toFixed(1)} Exceptional`
        : "New listing";

    const bedrooms  = p.bedrooms  ?? 0;
    const bathrooms = p.bathrooms ?? 0;

    const bedroomWord  = bedrooms  === 1 ? "bedroom"  : "bedrooms";
    const bathroomWord = bathrooms === 1 ? "bathroom" : "bathrooms";

    return `
      <article
        class="stay-card"
        data-property-id="${id}"
        data-lat="${escapeHtml(p.lat)}"
        data-lng="${escapeHtml(p.lng)}"
      >
        <div class="stay-card__media">
          <img
            src="${escapeHtml(p.image)}"
            alt="${name}"
            loading="lazy"
            width="560"
            height="380"
          />

          <div class="stay-card__actions">
            <button
              class="iconbtn js-favorite-toggle"
              type="button"
              data-property-id="${id}"
              aria-label="Save ${name}"
              aria-pressed="false"
            >
              <svg class="icon" aria-hidden="true">
                <use href="#i-heart"></use>
              </svg>
            </button>

            <button
              class="iconbtn"
              type="button"
              aria-label="Share ${name}"
            >
              <svg class="icon" aria-hidden="true">
                <use href="#i-share"></use>
              </svg>
            </button>
          </div>
        </div>

        <div class="stay-card__body">
          <p class="score">
            <b class="score__value">${escapeHtml(scoreLabel)}</b>
          </p>

          <h3 class="stay-card__name">
            <a href="#">${name}</a>
          </h3>

          <p class="stay-card__source">Booking.com</p>

          <p class="stay-card__price">
            From <strong>${money(p.price)}</strong>
            <span>per night</span>
          </p>

          <p class="stay-card__facts">
            ${bedrooms} ${bedroomWord} ·
            ${bathrooms} ${bathroomWord}
          </p>

          <p class="stay-card__place">
            <svg class="icon" aria-hidden="true">
              <use href="#i-pin"></use>
            </svg>
            ${escapeHtml(p.country)} · ${escapeHtml(p.city)}
          </p>

          <p class="stay-card__cta">
            <a class="btn btn--outline btn--sm" href="#">Learn more</a>
            <a class="btn btn--primary btn--sm" href="#">See dates</a>
          </p>
        </div>
      </article>
    `;
  }

  // --------------------------------------------------------------------------
  // 7. Load + render
  // --------------------------------------------------------------------------

  async function load(sortKey) {
    if (isLoading) return;
    isLoading = true;

    grid.setAttribute("aria-busy", "true");
    grid.innerHTML = `<p class="stay__status">Loading properties…</p>`;

    try {
      const limit = getLimit();
      const properties = await fetchProperties(sortKey, limit);

      if (!properties.length) {
        grid.innerHTML = `<p class="stay__empty">No properties found.</p>`;
        return;
      }

      grid.innerHTML = properties.map(buildCard).join("");

      // Notify nearby-pager.js so it rebuilds the dots.
      document.dispatchEvent(
        new CustomEvent("stay:rendered", {
          detail: { properties, container: grid },
        })
      );
    } catch (err) {
      console.error("[nearby] load failed:", err);
      grid.innerHTML = `<p class="stay__status">Unable to load properties.</p>`;
    } finally {
      isLoading = false;
      grid.removeAttribute("aria-busy");
    }
  }

  // --------------------------------------------------------------------------
  // 8. Event wiring
  // --------------------------------------------------------------------------

  sortSelect.addEventListener("change", (event) => {
    load(event.target.value);
  });

  // Refetch if the platform crosses the 1024px breakpoint.
  window.addEventListener("resize", () => {
    const nowMobile = isMobile();
    if (nowMobile !== wasMobile) {
      wasMobile = nowMobile;
      load(sortSelect.value || "most-popular");
    }
  });

  // --------------------------------------------------------------------------
  // 9. Initial load — default to Most Popular
  // --------------------------------------------------------------------------

  load(sortSelect.value || "most-popular");
})();