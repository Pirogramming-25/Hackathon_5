const timeButtons = document.querySelectorAll(".time-btn");

timeButtons[0].classList.add("selected");

timeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    timeButtons.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

const confirmBtn = document.getElementById("confirmTime");

confirmBtn.addEventListener("click", () => {
  const nextUrl = confirmBtn.dataset.nextUrl;
  window.location.href = nextUrl;
});
