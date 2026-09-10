(function () {
  "use strict";

  const track = document.getElementById("mobileGalleryTrack");
  const viewport = document.getElementById("mobileGalleryViewport");

  const prevButton = document.getElementById("mobileGalleryPrev");
  const nextButton = document.getElementById("mobileGalleryNext");
  const counter = document.getElementById(
  "mobileGalleryCounter"
);

  const dots = document.querySelectorAll(
    "#mobileGalleryDots li"
  );

  // Stop if mobile gallery does not exist
  if (
    !track ||
    !viewport ||
    !prevButton ||
    !nextButton ||
    !dots.length
  ) {
    return;
  }

  let currentIndex = 0;

  const totalImages = 10;


  /* ==========================================================================
     UPDATE GALLERY
     ========================================================================== */
function updateGallery() {

  // Move to the current image
  track.style.transform =
    `translateX(-${currentIndex * 100}%)`;

      // Update counter
  counter.textContent =
    `${currentIndex + 1} / ${totalImages}`;

  /*
    5 dots for 8 images.

    Image 1 → dot 1
    Image 2 → dot 2
    Image 3 → dot 3
    Image 4 → dot 3
    Image 5 → dot 3
    Image 6 → dot 3
    Image 7 → dot 3
    Image 8 → dot 5
  */

  let activeDot;

  if (currentIndex === 0) {
    // Image 1
    activeDot = 0;

  } else if (currentIndex === 1) {
    // Image 2
    activeDot = 1;

  } else if (currentIndex >= 2 && currentIndex <= 7) {
    // Images 3–8
    activeDot = 2;

  } else if (currentIndex === 8) {
    // Image 9
    activeDot = 3;

  } else {
    // Image 10
    activeDot = 4;
  }


  // Update active dot
  dots.forEach(function (dot, index) {

    dot.classList.toggle(
      "is-active",
      index === activeDot
    );

  });


  // Disable previous button on first image
  prevButton.disabled = currentIndex === 0;


  // Disable next button on last image
  nextButton.disabled =
    currentIndex === totalImages - 1;
}


  /* ==========================================================================
     GO TO IMAGE
     ========================================================================== */

  function goTo(index) {

    currentIndex = Math.max(
      0,
      Math.min(index, totalImages - 1)
    );

    updateGallery();
  }


  /* ==========================================================================
     PREVIOUS BUTTON
     ========================================================================== */

  prevButton.addEventListener("click", function () {

    if (currentIndex > 0) {
      goTo(currentIndex - 1);
    }

  });


  /* ==========================================================================
     NEXT BUTTON
     ========================================================================== */

  nextButton.addEventListener("click", function () {

    if (currentIndex < totalImages - 1) {
      goTo(currentIndex + 1);
    }

  });


  /* ==========================================================================
     DOT CLICK
     ========================================================================== */

  dots.forEach(function (dot, index) {

    dot.addEventListener("click", function () {
      goTo(index);
    });

  });


  /* ==========================================================================
     SWIPE SUPPORT
     ========================================================================== */

  let touchStartX = 0;
  let touchEndX = 0;

  viewport.addEventListener(
    "touchstart",
    function (event) {

      if (!event.touches.length) {
        return;
      }

      touchStartX =
        event.touches[0].clientX;

    },
    {
      passive: true
    }
  );


  viewport.addEventListener(
    "touchend",
    function (event) {

      if (!event.changedTouches.length) {
        return;
      }

      touchEndX =
        event.changedTouches[0].clientX;

      const difference =
        touchEndX - touchStartX;

      const threshold = 50;


      // Swipe left → next image
      if (difference < -threshold) {

        if (currentIndex < totalImages - 1) {
          goTo(currentIndex + 1);
        }

      }


      // Swipe right → previous image
      if (difference > threshold) {

        if (currentIndex > 0) {
          goTo(currentIndex - 1);
        }

      }

    },
    {
      passive: true
    }
  );


  /* ==========================================================================
     INITIAL STATE
     ========================================================================== */

  updateGallery();

})();