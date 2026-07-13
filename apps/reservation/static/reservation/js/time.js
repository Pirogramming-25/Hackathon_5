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

const reviewChip = document.getElementById("reviewChip");

function handleReviewChipActivate() {
  console.log("후기 작성/사진 업로드 플로우로 이동해야 합니다.");
}

if (reviewChip) {
  reviewChip.addEventListener("click", handleReviewChipActivate);
  reviewChip.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleReviewChipActivate();
    }
  });
}