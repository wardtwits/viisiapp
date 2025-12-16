const menuButton = document.querySelector("[data-menu-button]");
const mobileSheet = document.querySelector("[data-mobile-nav]");

if (menuButton && mobileSheet) {
  menuButton.addEventListener("click", () => {
    const isOpen = mobileSheet.getAttribute("data-open") === "true";
    mobileSheet.setAttribute("data-open", String(!isOpen));
    menuButton.setAttribute("aria-expanded", String(!isOpen));
  });
}
