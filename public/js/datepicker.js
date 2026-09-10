// ============================================================================
// Date range picker + live price + guest modal
// ----------------------------------------------------------------------------
// • ONE Hotel Datepicker attached to #check-in
// • onSelect populates both #check-in and #check-out
// • Total = NIGHTLY_RATE × nights (guests do NOT affect price)
// • Requires at least 1 guest + valid date range to enable submit
// • Guest modal opens from #guestsTrigger
// ============================================================================

(function () {
  "use strict";

  const NIGHTLY_RATE = 2026; // USD

  // --------------------------------------------------------------------------
  // DOM refs
  // --------------------------------------------------------------------------

  const checkInInput   = document.getElementById("check-in");
  const checkOutInput  = document.getElementById("check-out");

  const guestsTrigger  = document.getElementById("guestsTrigger");
  const guestsSummary  = document.getElementById("guestsSummary");

  const guestModal     = document.getElementById("guestModal");
  const guestCloseEls  = document.querySelectorAll("[data-guest-close]");

  const adultsValueEl  = document.getElementById("adultsValue");
  const infantsValueEl = document.getElementById("infantsValue");
  const petsValueEl    = document.getElementById("petsValue");

  const pricePerNightEl = document.getElementById("pricePerNight");
  const nightsCountEl   = document.getElementById("nightsCount");
  const totalPriceEl    = document.getElementById("totalPrice");

  const statusEl        = document.getElementById("bookingStatus");
  const statusTextEl    = document.getElementById("bookingStatusText");

  const bookingForm     = document.getElementById("bookingForm");

  if (!checkInInput || !checkOutInput || !guestsTrigger || !guestModal) return;

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const guests = { adults: 0, infants: 0, pets: 0 };
  let checkInDate  = null;
  let checkOutDate = null;

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  function formatMoney(value) {
    return "USD $" + Math.round(value).toLocaleString("en-US");
  }

  function nightsBetween(start, end) {
    if (!start || !end) return 0;
    const s = start instanceof Date ? start : new Date(start);
    const e = end   instanceof Date ? end   : new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const ms = e.getTime() - s.getTime();
    return Math.max(0, Math.round(ms / 86400000));
  }

  const displayFmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  function formatDisplay(date) {
    return date ? displayFmt.format(date) : "";
  }

  // --------------------------------------------------------------------------
  // Guest summary
  // --------------------------------------------------------------------------

  function buildGuestSummary() {
    const parts = [];
    if (guests.adults > 0)
      parts.push(`${guests.adults} guest${guests.adults === 1 ? "" : "s"}`);
    if (guests.infants > 0)
      parts.push(`${guests.infants} infant${guests.infants === 1 ? "" : "s"}`);
    if (guests.pets > 0)
      parts.push(`${guests.pets} pet${guests.pets === 1 ? "" : "s"}`);
    return parts.length ? parts.join(", ") : "Select guests";
  }

  function paintGuestCounters() {
    if (adultsValueEl)  adultsValueEl.textContent  = String(guests.adults);
    if (infantsValueEl) infantsValueEl.textContent = String(guests.infants);
    if (petsValueEl)    petsValueEl.textContent    = String(guests.pets);
    if (guestsSummary)  guestsSummary.textContent  = buildGuestSummary();
  }

  // --------------------------------------------------------------------------
  // Recalculate
  // --------------------------------------------------------------------------

function recalculate() {
  if (pricePerNightEl) {
    pricePerNightEl.textContent = formatMoney(NIGHTLY_RATE);
  }

  const nights = nightsBetween(checkInDate, checkOutDate);

  if (nightsCountEl) {
    nightsCountEl.textContent = String(nights);
  }

  let ready = false;
  let message = "Select check-in and check-out dates.";

  // ----------------------------------------------------------
  // Don't calculate total until dates AND guests are valid
  // ----------------------------------------------------------

  if (!checkInDate || !checkOutDate) {
    // Dates not selected
    if (totalPriceEl) {
      totalPriceEl.textContent = "USD $0";
    }

    message = "Select check-in and check-out dates.";

  } else if (nights <= 0) {
    // Invalid date range
    if (totalPriceEl) {
      totalPriceEl.textContent = "USD $0";
    }

    message = "Check-out must be after check-in.";

  } else if (guests.adults < 1) {
    // Valid dates, but no guest selected
    if (totalPriceEl) {
      totalPriceEl.textContent = "USD $0";
    }

    message = "Please select at least 1 guest.";

  } else {
    // --------------------------------------------------------
    // Everything is valid → calculate total price
    // --------------------------------------------------------

    const total = NIGHTLY_RATE * nights;

    if (totalPriceEl) {
      totalPriceEl.textContent = formatMoney(total);
    }

    ready = true;
    message = "Your dates are available";
  }

  // Update status
  if (statusTextEl) {
    statusTextEl.textContent = message;
  }

  if (statusEl) {
    statusEl.classList.toggle("is-ready", ready);
  }

  // Enable/disable booking button
  const submitBtn =
    bookingForm && bookingForm.querySelector(".booking__submit");

  if (submitBtn) {
    submitBtn.disabled = !ready;
  }

  // Update guest numbers
  paintGuestCounters();
}
  // --------------------------------------------------------------------------
  // Guest modal
  // --------------------------------------------------------------------------

  function openGuestModal() {
    guestModal.hidden = false;
    guestsTrigger.setAttribute("aria-expanded", "true");
    document.body.classList.add("has-modal-open");
    const closeBtn = guestModal.querySelector(".guest-modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function closeGuestModal() {
    guestModal.hidden = true;
    guestsTrigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("has-modal-open");
    guestsTrigger.focus();
  }

  guestsTrigger.addEventListener("click", openGuestModal);
  guestCloseEls.forEach(function (el) {
    el.addEventListener("click", closeGuestModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !guestModal.hidden) closeGuestModal();
  });

  // --------------------------------------------------------------------------
  // Guest counters
  // --------------------------------------------------------------------------

  document.querySelectorAll("[data-counter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const key  = btn.dataset.counter;
      const step = parseInt(btn.dataset.step, 10);
      if (!(key in guests)) return;

      guests[key] = Math.max(0, guests[key] + step);
      recalculate();
    });
  });

  // --------------------------------------------------------------------------
  // Hotel Datepicker — SINGLE instance
  // --------------------------------------------------------------------------

function initDatepicker() {
  if (typeof HotelDatepicker === "undefined") {
    console.warn("[datepicker] Hotel Datepicker not loaded — native fallback");

    const today = new Date().toISOString().split("T")[0];

    checkInInput.type = "date";
    checkOutInput.type = "date";

    checkInInput.min = today;
    checkOutInput.min = today;

    checkInInput.readOnly = false;
    checkOutInput.readOnly = false;

    checkInInput.addEventListener("change", function () {
      checkInDate = checkInInput.valueAsDate;

      if (checkInDate) {
        checkOutInput.min = checkInInput.value;
      }

      recalculate();
    });

    checkOutInput.addEventListener("change", function () {
      checkOutDate = checkOutInput.valueAsDate;
      recalculate();
    });

    return;
  }

  // ONE Hotel Datepicker attached to check-in
  const datepicker = new HotelDatepicker(checkInInput, {
    format: "DD MMM YYYY",
    separator: " - ",
    autoClose: true,
    clearButton: false,
    submitButton: false,
    minNights: 1,
    startDate: new Date(),

    // IMPORTANT:
    // Hotel Datepicker uses onSelectRange
    onSelectRange: function () {
      const value = datepicker.getValue();

      console.log("Selected range:", value);

      if (!value) {
        checkInDate = null;
        checkOutDate = null;

        checkInInput.value = "";
        checkOutInput.value = "";

        recalculate();
        return;
      }

      // Example value:
      // "10 Sep 2026 - 13 Sep 2026"

      const dates = value.split(" - ");

      if (dates.length !== 2) {
        console.warn("Invalid date range:", value);
        return;
      }

      const startText = dates[0].trim();
      const endText = dates[1].trim();

      // Convert the selected dates into Date objects
      checkInDate = fecha.parse(startText, "DD MMM YYYY");
      checkOutDate = fecha.parse(endText, "DD MMM YYYY");

      // Put ONLY the individual dates into the two inputs
      checkInInput.value = startText;
      checkOutInput.value = endText;

      console.log("Check-in:", checkInDate);
      console.log("Check-out:", checkOutDate);
      console.log("Nights:", datepicker.getNights());

      recalculate();
    }
  });

  // Clicking check-out opens the SAME datepicker
  checkOutInput.addEventListener("click", function (event) {
    event.preventDefault();

    datepicker.open();
  });
}
  // --------------------------------------------------------------------------
  // Init
  // --------------------------------------------------------------------------

  initDatepicker();
  recalculate();
})();