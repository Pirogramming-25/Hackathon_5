const menuToggle = document.getElementById("menuToggle");
const navDrawer = document.getElementById("navDrawer");

if (menuToggle && navDrawer) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navDrawer.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
  });

  navDrawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navDrawer.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "메뉴 열기");
    });
  });
}
