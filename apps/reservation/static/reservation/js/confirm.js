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