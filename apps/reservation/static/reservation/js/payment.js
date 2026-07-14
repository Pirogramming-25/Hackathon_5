const methodItems = document.querySelectorAll(".method-item");
const confirmBtn = document.getElementById("confirmPayment");

methodItems.forEach((item) => {
  item.addEventListener("click", () => {
    methodItems.forEach((el) => el.classList.remove("checked"));
    item.classList.add("checked");
    item.querySelector("input").checked = true;
    confirmBtn.disabled = false;
  });
});

confirmBtn.addEventListener("click", () => {
  if (confirmBtn.disabled) return;
  const nextUrl = confirmBtn.dataset.nextUrl;
  window.location.href = nextUrl;
});
