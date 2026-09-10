// ============================================================================
// Gallery Modal
// - Mobile/tablet: horizontal slider
// - 5 dynamic dots
// - Previous / Next arrows
// - Swipe support
// - Desktop: vertical image list
// ============================================================================

(function () {
  "use strict";

  const DESKTOP_QUERY = "(min-width: 1024px)";

  // Always show a maximum of 5 dots
  const DOT_WINDOW = 5;

  // Swipe sensitivity
  const SWIPE_THRESHOLD_RATIO = 0.15;

  // --------------------------------------------------------------------------
  // Elements
  // --------------------------------------------------------------------------

  const triggers = document.querySelectorAll("[data-gallery-trigger]");

  const modal = document.getElementById("galleryModal");
  const dialog = modal?.querySelector(".gallery-modal__dialog");

  const viewport = document.getElementById("galleryViewport");
  const track = document.getElementById("galleryTrack");

  const dotsContainer = document.getElementById("galleryDots");

  const currentCounter = document.getElementById("galleryCurrent");
  const totalCounter = document.getElementById("galleryTotal");

  const prevButton = document.getElementById("galleryPrevBtn");
  const nextButton = document.getElementById("galleryNextBtn");
  const closeButton = document.getElementById("galleryCloseBtn");

  if (
    !modal ||
    !dialog ||
    !viewport ||
    !track ||
    !dotsContainer ||
    !prevButton ||
    !nextButton ||
    !closeButton
  ) {
    return;
  }

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  let images = [];
  let currentIndex = 0;
  let imagesLoaded = false;

  let touchStartX = 0;
  let touchCurrentX = 0;
  let isDragging = false;

  // --------------------------------------------------------------------------
  // Fetch images
  // --------------------------------------------------------------------------

  async function fetchImages() {
    if (imagesLoaded) {
      return images;
    }

    try {
      const response = await fetch("/images");

      if (!response.ok) {
        throw new Error("Unable to load gallery images.");
      }

      const data = await response.json();

      images = Array.isArray(data) ? data : [];

      imagesLoaded = true;

      return images;
    } catch (error) {
      console.error("Gallery error:", error);

      images = [];

      return images;
    }
  }

  // --------------------------------------------------------------------------
  // Render slides
  // --------------------------------------------------------------------------

  function renderSlides() {
    if (!images.length) {
      track.innerHTML = `
        <li class="gallery-modal__status">
          No images available.
        </li>
      `;

      return;
    }

    track.innerHTML = images
      .map(
        (src, index) => `
          <li class="gallery-modal__slide">
            <img
              src="${src}"
              alt="Golf club image ${index + 1}"
              loading="${index === 0 ? "eager" : "lazy"}"
            >
          </li>
        `
      )
      .join("");
  }

  // --------------------------------------------------------------------------
  // Calculate which 5 dots should be visible
  //
  // For 10 images:
  //
  // Image 1  -> [● ○ ○ ○ ○]
  // Image 2  -> [○ ● ○ ○ ○]
  // Image 3  -> [○ ○ ● ○ ○]
  // Image 4  -> [○ ○ ● ○ ○]
  // Image 5  -> [○ ○ ● ○ ○]
  // Image 6  -> [○ ○ ● ○ ○]
  // Image 7  -> [○ ○ ● ○ ○]
  // Image 8  -> [○ ○ ● ○ ○]
  // Image 9  -> [○ ○ ○ ● ○]
  // Image 10 -> [○ ○ ○ ○ ●]
  //
  // This keeps the active dot in the middle for the majority of the gallery.
  // --------------------------------------------------------------------------

  function getDotStartIndex() {
    const totalImages = images.length;

    if (totalImages <= DOT_WINDOW) {
      return 0;
    }

    const middlePosition = Math.floor(DOT_WINDOW / 2);

    return Math.min(
      Math.max(currentIndex - middlePosition, 0),
      totalImages - DOT_WINDOW
    );
  }

  // --------------------------------------------------------------------------
  // Render 5 dynamic dots
  // --------------------------------------------------------------------------

  function renderDots() {
    dotsContainer.innerHTML = "";

    if (images.length <= 1) {
      return;
    }

    const dotCount = Math.min(DOT_WINDOW, images.length);

    const startIndex = getDotStartIndex();

    for (let dotIndex = 0; dotIndex < dotCount; dotIndex++) {
      const imageIndex = startIndex + dotIndex;

      const dot = document.createElement("li");

      if (imageIndex === currentIndex) {
        dot.classList.add("is-active");
      }

      dot.setAttribute(
        "aria-label",
        `Go to image ${imageIndex + 1}`
      );

      // Make the dots clickable
      dot.addEventListener("click", function () {
        goTo(imageIndex);
      });

      dotsContainer.appendChild(dot);
    }
  }

  // --------------------------------------------------------------------------
  // Update image position
  // --------------------------------------------------------------------------

  function updateSlidePosition() {
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      track.style.transform = "none";
      return;
    }

    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  }

  // --------------------------------------------------------------------------
  // Update UI
  // --------------------------------------------------------------------------

  function updateUI() {
    if (!images.length) {
      return;
    }

    if (currentCounter) {
      currentCounter.textContent = currentIndex + 1;
    }

    if (totalCounter) {
      totalCounter.textContent = images.length;
    }

    renderDots();
    updateSlidePosition();

    // Disable/enable arrows at the ends
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === images.length - 1;

    prevButton.setAttribute(
      "aria-disabled",
      currentIndex === 0 ? "true" : "false"
    );

    nextButton.setAttribute(
      "aria-disabled",
      currentIndex === images.length - 1 ? "true" : "false"
    );
  }

  // --------------------------------------------------------------------------
  // Go to image
  // --------------------------------------------------------------------------

  function goTo(index) {
    if (!images.length) {
      return;
    }

    currentIndex = Math.max(
      0,
      Math.min(index, images.length - 1)
    );

    updateUI();
  }

  // --------------------------------------------------------------------------
  // Next image
  // --------------------------------------------------------------------------

  function goNext() {
    if (currentIndex < images.length - 1) {
      goTo(currentIndex + 1);
    }
  }

  // --------------------------------------------------------------------------
  // Previous image
  // --------------------------------------------------------------------------

  function goPrev() {
    if (currentIndex > 0) {
      goTo(currentIndex - 1);
    }
  }

  // --------------------------------------------------------------------------
  // Open modal
  // --------------------------------------------------------------------------

  async function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("has-modal-open");

    currentIndex = 0;

    // Show loading state
    track.innerHTML = `
      <li class="gallery-modal__status">
        Loading images…
      </li>
    `;

    const loadedImages = await fetchImages();

    images = loadedImages;

    renderSlides();
    updateUI();

    closeButton.focus();
  }

  // --------------------------------------------------------------------------
  // Close modal
  // --------------------------------------------------------------------------

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("has-modal-open");
  }

  // --------------------------------------------------------------------------
  // Gallery triggers
  // --------------------------------------------------------------------------

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      event.preventDefault();

      openModal();
    });
  });

  // --------------------------------------------------------------------------
  // Close button
  // --------------------------------------------------------------------------

  closeButton.addEventListener("click", function () {
    closeModal();
  });

  // --------------------------------------------------------------------------
  // Click outside dialog
  // --------------------------------------------------------------------------

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Prevent dialog clicks from closing modal
  dialog.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  // --------------------------------------------------------------------------
  // Previous / Next buttons
  // --------------------------------------------------------------------------

  prevButton.addEventListener("click", function () {
    goPrev();
  });

  nextButton.addEventListener("click", function () {
    goNext();
  });

  // --------------------------------------------------------------------------
  // Keyboard controls
  // --------------------------------------------------------------------------

  document.addEventListener("keydown", function (event) {
    if (!modal.classList.contains("is-open")) {
      return;
    }

    if (event.key === "Escape") {
      closeModal();
    }

    if (event.key === "ArrowRight") {
      goNext();
    }

    if (event.key === "ArrowLeft") {
      goPrev();
    }
  });

  // --------------------------------------------------------------------------
  // Touch / Swipe
  // --------------------------------------------------------------------------

  viewport.addEventListener(
    "touchstart",
    function (event) {
      if (!event.touches.length) {
        return;
      }

      touchStartX = event.touches[0].clientX;
      touchCurrentX = touchStartX;

      isDragging = true;
    },
    { passive: true }
  );

  viewport.addEventListener(
    "touchmove",
    function (event) {
      if (!isDragging || !event.touches.length) {
        return;
      }

      touchCurrentX = event.touches[0].clientX;
    },
    { passive: true }
  );

  function finishSwipe() {
    if (!isDragging) {
      return;
    }

    isDragging = false;

    const difference = touchCurrentX - touchStartX;

    const threshold =
      viewport.clientWidth * SWIPE_THRESHOLD_RATIO;

    if (Math.abs(difference) < threshold) {
      return;
    }

    if (difference < 0) {
      goNext();
    } else {
      goPrev();
    }
  }

  viewport.addEventListener("touchend", finishSwipe);
  viewport.addEventListener("touchcancel", finishSwipe);

  // --------------------------------------------------------------------------
  // Resize
  // --------------------------------------------------------------------------

  window.addEventListener("resize", function () {
    updateSlidePosition();
  });
})();