// ============================================================================
// Google Map + property markers
// ----------------------------------------------------------------------------
// • Renders a marker for each property card in #stayGrid
// • Hover card  → map pans to that marker
// • Click card  → info window opens
// • Click marker → matching card is outlined + scrolled into view
// • Re-renders whenever #stayGrid dispatches "stay:rendered"
// ============================================================================

(function () {
  "use strict";

  // --------------------------------------------------------------------------
  // 1. DOM references
  // --------------------------------------------------------------------------

  const mapEl = document.getElementById("stayMap");
  const grid  = document.getElementById("stayGrid");

  if (!mapEl || !grid) return;

  // --------------------------------------------------------------------------
  // 2. State
  // --------------------------------------------------------------------------

  let map        = null;
  let infoWindow = null;
  const markersByProperty = new Map();  
  
//   for the blue marker :


  // id  -> google.maps.Marker
  const cardsByProperty   = new Map();   // id  -> HTMLElement
  let pendingProperties   = null;        // stored until the map is ready

  // Fallback center: Orlando, Florida
  const DEFAULT_CENTER = { lat: 28.5383, lng: -81.3792 };

  // --------------------------------------------------------------------------
  // 3. Helpers
  // --------------------------------------------------------------------------

  function num(value) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }

  function propertyCoords(p) {
    const lat = num(p.lat);
    const lng = num(p.lng);
    return lat !== null && lng !== null ? { lat, lng } : null;
  }

  function centroid(props) {
    const points = props
      .map(propertyCoords)
      .filter((c) => c !== null);

    if (!points.length) return { ...DEFAULT_CENTER };

    const sum = points.reduce(
      (acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lng }),
      { lat: 0, lng: 0 }
    );

    return { lat: sum.lat / points.length, lng: sum.lng / points.length };
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function infoHtml(p) {
    const price =
      typeof p.price === "number"
        ? "USD $" + Math.round(p.price).toLocaleString("en-US")
        : "—";

    return `
      <div class="map-info" style="max-width:220px;font-family:inherit;">
        <img
          src="${escapeHtml(p.image)}"
          alt=""
          style="width:100%;border-radius:8px;margin-bottom:6px;display:block;"
        />
        <strong style="display:block;margin-bottom:2px;">
          ${escapeHtml(p.name)}
        </strong>
        <span style="color:#6c7d73;font-size:12px;display:block;">
          ${escapeHtml(p.city)}, ${escapeHtml(p.country)}
        </span>
        <span style="display:block;margin-top:4px;font-weight:700;">
          ${escapeHtml(price)} / night
        </span>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // 4. Map initialization
  // --------------------------------------------------------------------------

  function createMap(properties) {
    if (!window.google || !window.google.maps) return;

    map = new google.maps.Map(mapEl, {
      center: centroid(properties),
      zoom: properties.length > 1 ? 5 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    infoWindow = new google.maps.InfoWindow();
  }

  // --------------------------------------------------------------------------
  // 5. Highlighting
  // --------------------------------------------------------------------------

  function highlightCard(id, on) {
    const card = cardsByProperty.get(String(id));
    if (card) card.classList.toggle("is-active-card", on);
  }

  // --------------------------------------------------------------------------
  // 6. Markers
  // --------------------------------------------------------------------------

  function renderMarkers(properties) {
    if (!map) return;

    // Clear old markers
    markersByProperty.forEach(function (marker) {
      marker.setMap(null);
    });
    markersByProperty.clear();

    const bounds = new google.maps.LatLngBounds();
    let placed = 0;

    properties.forEach(function (p) {
      const coords = propertyCoords(p);
      if (!coords) return;

      const marker = new google.maps.Marker({
        position: coords,
        map: map,
        title: p.name,
      });

      marker.addListener("click", function () {
        infoWindow.setContent(infoHtml(p));
        infoWindow.open({ map: map, anchor: marker });
        highlightCard(p.id, true);
        scrollCardIntoView(p.id);
      });

      marker.addListener("mouseover", function () {
        highlightCard(p.id, true);
      });

      marker.addListener("mouseout", function () {
        highlightCard(p.id, false);
      });

      markersByProperty.set(String(p.id), marker);
      bounds.extend(coords);
      placed++;
    });

    if (placed > 1) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else if (placed === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(12);
    }
  }

  // --------------------------------------------------------------------------
  // 7. Card <-> marker syncing
  // --------------------------------------------------------------------------

  function scrollCardIntoView(id) {
    const card = cardsByProperty.get(String(id));
    if (!card) return;

    // Only scroll the page (not the carousel) — carousel handled by pager
    if (window.matchMedia("(min-width: 1024px)").matches) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function indexCards() {
    cardsByProperty.clear();

    grid.querySelectorAll(".stay-card").forEach(function (card) {
      const id = card.dataset.propertyId;
      if (!id) return;

      cardsByProperty.set(id, card);

      // Hover card → pan map to its marker
      card.addEventListener("mouseenter", function () {
        const marker = markersByProperty.get(id);
        if (marker && map) {
          map.panTo(marker.getPosition());
        }
      });

      // Click card (not on a link/button) → open its info window
      card.addEventListener("click", function (event) {
        if (event.target.closest("a, button")) return;

        const marker = markersByProperty.get(id);
        if (!marker || !map) return;

        // Find the property object from the last render
        const p = lastProperties.find(function (x) {
          return String(x.id) === id;
        });
        if (!p) return;

        infoWindow.setContent(infoHtml(p));
        infoWindow.open({ map: map, anchor: marker });
        highlightCard(id, true);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 8. Keep last properties list for lookup
  // --------------------------------------------------------------------------

  let lastProperties = [];

  // --------------------------------------------------------------------------
  // 9. Public init — called by Google Maps as callback=initStayMap
  // --------------------------------------------------------------------------

  window.initStayMap = function initStayMap() {
    // If a render already happened while Google was loading, apply it now
    if (pendingProperties) {
      if (!map) createMap(pendingProperties);
      renderMarkers(pendingProperties);
      indexCards();
      pendingProperties = null;
    }

    // Otherwise wait for the next render event
    document.addEventListener("stay:rendered", function (event) {
      const detail = event.detail;
      if (!detail || detail.container !== grid) return;

      lastProperties = detail.properties;

      if (!map) {
        createMap(detail.properties);
      }

      // If the map isn't ready yet (Google script still loading), store
      if (!map) {
        pendingProperties = detail.properties;
        return;
      }

      renderMarkers(detail.properties);
      indexCards();
    });
  };
})();