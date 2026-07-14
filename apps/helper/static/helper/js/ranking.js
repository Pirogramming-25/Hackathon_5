const RANK_TIERS = ["rank-gold", "rank-silver", "rank-bronze"];

function renderTop3(entries) {
    const container = document.querySelector("#rankingTop3");
    container.innerHTML = entries
        .map(
            (entry, i) => `
        <div class="rank-card ${RANK_TIERS[i]}">
            <span class="rank-num">${i + 1}</span>
            <p class="rank-name">${entry.name}</p>
            <p class="rank-count">${entry.badge_count}개</p>
        </div>`
        )
        .join("");
}

function renderRest(entries) {
    const container = document.querySelector("#rankingList");
    container.innerHTML = entries
        .map(
            (entry, i) => `
        <div class="rank-row">
            <span class="rank-num">${i + 4}</span>
            <span class="rank-name">${entry.name}</span>
            <span class="rank-count">${entry.badge_count}개</span>
        </div>`
        )
        .join("");
}

async function loadRanking() {
    const response = await fetch("/api/accounts/ranking/");
    if (!response.ok) return;

    const entries = await response.json();
    document.querySelector("#rankingEmpty").hidden = entries.length > 0;

    renderTop3(entries.slice(0, 3));
    renderRest(entries.slice(3));
}

loadRanking();
