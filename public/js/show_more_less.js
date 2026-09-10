// ============================================================================
// Hero description - Show More / Show Less
// ============================================================================

(function () {
  const description = document.getElementById("heroDescription");
  const toggle = document.getElementById("descriptionToggle");

  if (!description || !toggle) return;

  // Start with the description collapsed
  description.classList.add("is-collapsed");

  toggle.addEventListener("click", function (event) {
    event.preventDefault();

    const isCollapsed = description.classList.toggle("is-collapsed");

    if (isCollapsed) {
      toggle.textContent = "Show more";
      toggle.setAttribute("aria-expanded", "false");
    } else {
      toggle.textContent = "Show less";
      toggle.setAttribute("aria-expanded", "true");
    }
  });
})();