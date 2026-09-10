// ============================================================================
// Nearby Properties — pagination + mobile touch carousel
// ----------------------------------------------------------------------------
// Desktop (>=1024px)
//   • 6 cards
//   • 3 × 2 grid
//   • 6 dots
//   • Clicking card 1 → dot 1
//   • Clicking card 2 → dot 2
//   • Clicking card 3 → dot 3
//   • Clicking card 4 → dot 4
//   • Clicking card 5 → dot 5
//   • Clicking card 6 → dot 6
//
// Mobile/tablet (<1024px)
//   • 4 cards
//   • 1 card visible at a time
//   • Touch/swipe left/right
//   • 4 dots
// ============================================================================

(function () {
  "use strict";

  const grid = document.getElementById("stayGrid");
  const pager = document.getElementById("stayPager");
  const dotsList = document.getElementById("stayPagerDots");
  const prevBtn = document.getElementById("stayPagerPrev");
  const nextBtn = document.getElementById("stayPagerNext");

  if (!grid || !pager || !dotsList || !prevBtn || !nextBtn) return;

  let cards = [];
  let activeIndex = 0;
  let rafId = null;

  // --------------------------------------------------------------------------
  // Mobile/tablet check
  // --------------------------------------------------------------------------

  function isMobile() {
    return window.matchMedia("(max-width: 1023px)").matches;
  }

  // --------------------------------------------------------------------------
  // Find current card
  // --------------------------------------------------------------------------
  // Only used on MOBILE.
  // Desktop does NOT use this calculation because the desktop layout
  // is a static 3 × 2 grid.
  // --------------------------------------------------------------------------

  function getCenteredIndex() {
    if (!cards.length) return 0;

    const center = grid.scrollLeft + grid.clientWidth / 2;

    let closest = 0;
    let smallestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardCenter =
        card.offsetLeft + card.offsetWidth / 2;

      const distance = Math.abs(cardCenter - center);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closest = index;
      }
    });

    return closest;
  }

  // --------------------------------------------------------------------------
  // Update active dot/card
  // --------------------------------------------------------------------------

  function setActive(index) {
    if (!cards.length) return;

    // Make sure index stays inside the available cards.
    activeIndex = Math.max(
      0,
      Math.min(index, cards.length - 1)
    );

    // ------------------------------------------------------
    // Update dots
    // ------------------------------------------------------

    const dots = dotsList.querySelectorAll("li");

    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === activeIndex;

      dot.classList.toggle("is-active", active);

      dot.setAttribute(
        "aria-current",
        active ? "true" : "false"
      );
    });

    // ------------------------------------------------------
    // Update active card
    // ------------------------------------------------------

    cards.forEach((card, cardIndex) => {
      card.classList.toggle(
        "is-active-card",
        cardIndex === activeIndex
      );
    });

    // ------------------------------------------------------
    // Update arrows
    // ------------------------------------------------------

    prevBtn.disabled = activeIndex === 0;
    nextBtn.disabled =
      activeIndex === cards.length - 1;
  }

  // --------------------------------------------------------------------------
  // Scroll to card
  // --------------------------------------------------------------------------

  function scrollToCard(index) {
    if (!cards.length) return;

    index = Math.max(
      0,
      Math.min(index, cards.length - 1)
    );

    const card = cards[index];

    if (!card) return;

    // ------------------------------------------------------
    // MOBILE
    // ------------------------------------------------------
    // Mobile is a horizontal carousel, so scroll to the
    // selected card.
    // ------------------------------------------------------

    if (isMobile()) {
      grid.scrollTo({
        left: card.offsetLeft,
        behavior: "smooth"
      });
    }

    // ------------------------------------------------------
    // DESKTOP
    // ------------------------------------------------------
    // Desktop is a static 3 × 2 grid.
    //
    // IMPORTANT:
    // We DO NOT use scrollIntoView() here.
    //
    // The card number itself determines the dot number.
    // ------------------------------------------------------

    setActive(index);
  }

  // --------------------------------------------------------------------------
  // Build dots
  // --------------------------------------------------------------------------

  function buildDots() {
    dotsList.innerHTML = "";

    cards.forEach((card, index) => {
      const dot = document.createElement("li");

      dot.setAttribute("role", "button");
      dot.setAttribute("tabindex", "0");

      dot.setAttribute(
        "aria-label",
        `Go to property ${index + 1}`
      );

      // --------------------------------------------------
      // Clicking a dot
      // --------------------------------------------------

      dot.addEventListener("click", () => {
        scrollToCard(index);
      });

      // --------------------------------------------------
      // Keyboard support
      // --------------------------------------------------

      dot.addEventListener("keydown", (event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          scrollToCard(index);
        }
      });

      dotsList.appendChild(dot);
    });
  }

  // --------------------------------------------------------------------------
  // Card clicks
  // --------------------------------------------------------------------------

  function wireCards() {
    cards.forEach((card, index) => {
      card.addEventListener("click", (event) => {
        // Do not interfere with links or buttons inside the card.
        if (event.target.closest("a, button")) {
          return;
        }

        // --------------------------------------------------
        // IMPORTANT:
        //
        // The card's array index is its dot index.
        //
        // card 0 → dot 0
        // card 1 → dot 1
        // card 2 → dot 2
        // card 3 → dot 3
        // card 4 → dot 4
        // card 5 → dot 5
        // --------------------------------------------------

        setActive(index);
      });
    });
  }

  // --------------------------------------------------------------------------
  // Mobile scroll → update dot
  // --------------------------------------------------------------------------

  function onScroll() {
    // Desktop does not need scroll-based pagination.
    if (!isMobile()) return;

    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;

      const index = getCenteredIndex();

      if (index !== activeIndex) {
        setActive(index);
      }
    });
  }

  grid.addEventListener("scroll", onScroll, {
    passive: true
  });

  // --------------------------------------------------------------------------
  // Touch swipe
  // --------------------------------------------------------------------------

  let touchStartX = 0;
  let touchEndX = 0;

  grid.addEventListener(
    "touchstart",
    (event) => {
      if (!isMobile()) return;

      touchStartX = event.touches[0].clientX;
    },
    { passive: true }
  );

  grid.addEventListener(
    "touchend",
    (event) => {
      if (!isMobile()) return;

      touchEndX = event.changedTouches[0].clientX;

      const difference =
        touchStartX - touchEndX;

      const swipeDistance = 50;

      // Ignore very small movements.
      if (Math.abs(difference) < swipeDistance) {
        return;
      }

      // --------------------------------------------------
      // Swipe LEFT → next card
      // --------------------------------------------------

      if (difference > 0) {
        if (activeIndex < cards.length - 1) {
          scrollToCard(activeIndex + 1);
        }
      }

      // --------------------------------------------------
      // Swipe RIGHT → previous card
      // --------------------------------------------------

      else {
        if (activeIndex > 0) {
          scrollToCard(activeIndex - 1);
        }
      }
    },
    { passive: true }
  );

  // --------------------------------------------------------------------------
  // Previous button
  // --------------------------------------------------------------------------

  prevBtn.addEventListener("click", () => {
    if (activeIndex > 0) {
      scrollToCard(activeIndex - 1);
    }
  });

  // --------------------------------------------------------------------------
  // Next button
  // --------------------------------------------------------------------------

  nextBtn.addEventListener("click", () => {
    if (activeIndex < cards.length - 1) {
      scrollToCard(activeIndex + 1);
    }
  });

  // --------------------------------------------------------------------------
  // Refresh after property rendering
  // --------------------------------------------------------------------------

  function refresh() {
    cards = Array.from(
      grid.querySelectorAll(".stay-card")
    );

    // No cards → hide pager.
    if (!cards.length) {
      pager.hidden = true;
      return;
    }

    pager.hidden = false;

    // Rebuild dots according to the number of cards.
    buildDots();

    // Reconnect card click events.
    wireCards();

    // Start from first card.
    activeIndex = 0;

    // Mobile starts at first card.
    if (isMobile()) {
      grid.scrollLeft = 0;
    }

    setActive(0);
  }

  // --------------------------------------------------------------------------
  // Listen for property rendering
  // --------------------------------------------------------------------------

  document.addEventListener(
    "stay:rendered",
    (event) => {
      if (event.detail.container !== grid) {
        return;
      }

      requestAnimationFrame(refresh);
    }
  );

  // --------------------------------------------------------------------------
  // Initial refresh
  // --------------------------------------------------------------------------
  // This is a safety check in case the render event happened before
  // this file attached its listener.
  // --------------------------------------------------------------------------

  requestAnimationFrame(refresh);

  // --------------------------------------------------------------------------
  // Resize
  // --------------------------------------------------------------------------

  let previousMobile = isMobile();

  window.addEventListener("resize", () => {
    const currentMobile = isMobile();

    // Only reset when crossing the mobile/desktop breakpoint.
    if (currentMobile !== previousMobile) {
      previousMobile = currentMobile;

      activeIndex = 0;

      if (currentMobile) {
        grid.scrollLeft = 0;
      }

      refresh();
    }
  });

})();