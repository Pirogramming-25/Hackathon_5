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