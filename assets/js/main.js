const menuButton = document.querySelector("[data-menu-button]");
const mobileSheet = document.querySelector("[data-mobile-nav]");

if (menuButton && mobileSheet) {
  const setMenuOpen = (isOpen) => {
    mobileSheet.setAttribute("data-open", String(isOpen));
    menuButton.setAttribute("aria-expanded", String(isOpen));
  };

  menuButton.addEventListener("click", () => {
    const isOpen = mobileSheet.getAttribute("data-open") === "true";
    setMenuOpen(!isOpen);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileSheet.getAttribute("data-open") === "true") {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  mobileSheet.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  window.matchMedia("(max-width: 900px)").addEventListener("change", () => {
    const focusedLink = mobileSheet.contains(document.activeElement) ? document.activeElement : null;
    setMenuOpen(false);
    if (focusedLink) {
      const desktopLink = Array.from(document.querySelectorAll(".nav-links a")).find(
        (link) => link.href === focusedLink.href
      );
      (desktopLink || menuButton).focus();
    } else if (document.activeElement.closest(".nav-links")) {
      menuButton.focus();
    }
  });
}
