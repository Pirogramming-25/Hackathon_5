/* accounts API에서 내 뱃지 개수와 이달의 랭킹을 받아와 표시한다. */
async function loadMyPage() {
  const [badgesRes, rankingRes] = await Promise.all([
    fetch("/api/accounts/badges/me/"),
    fetch("/api/accounts/ranking/"),
  ]);

  if (badgesRes.ok) {
    const badges = await badgesRes.json();
    document.getElementById("badge-count").textContent = `${badges.length}개`;
  }

  if (rankingRes.ok) {
    const ranking = await rankingRes.json();
    const list = document.getElementById("ranking-list");
    list.innerHTML = "";
    ranking.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = `${entry.username} - 효자뱃지 ${entry.badge_count}개`;
      list.appendChild(li);
    });
  }
}

loadMyPage();
