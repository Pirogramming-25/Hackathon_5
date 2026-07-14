const editBtn = document.querySelector('.btn-editprofile');
if (editBtn) {
    editBtn.addEventListener('click', () => {
        window.location.href = '/myinfo/';
    });
}

const logoutBtn = document.querySelector('.btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        window.location.href = '/logout/';
    });
}

// 배지 목록 좌우 스크롤
const badgeList = document.querySelector('.badge-list');
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');
const badgeCountTag = document.querySelector('#badgeCountTag');
const badgeEmpty = document.querySelector('#badgeEmpty');

function formatBadgeDate(isoString) {
    const d = new Date(isoString);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}`;
}

async function loadBadges() {
    const response = await fetch('/api/accounts/badges/me/');
    if (!response.ok) return;

    const badges = await response.json();
    const iconUrl = badgeList.dataset.badgeIconUrl;

    badgeCountTag.textContent = `${badges.length}개 배지 보유중`;
    badgeEmpty.hidden = badges.length > 0;

    badgeList.innerHTML = badges
        .map(
            (badge) => `
        <div class="badge-item">
            <img src="${iconUrl}" alt="효자 배지" class="badge-thumb">
            <p class="badge-date">${formatBadgeDate(badge.awarded_at)}</p>
            <p class="badge-desc">이용자님을 도와주었어요!</p>
        </div>`
        )
        .join('');
}

if (badgeList) {
    loadBadges();
}

function getScrollAmount() {
    const item = document.querySelector('.badge-item');
    if (!item) return 170;
    const gap = 14; 
    return item.offsetWidth + gap;
}

if (prevBtn && badgeList) {
    prevBtn.addEventListener('click', () => {
        badgeList.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });
}

if (nextBtn && badgeList) {
    nextBtn.addEventListener('click', () => {
        badgeList.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });
}