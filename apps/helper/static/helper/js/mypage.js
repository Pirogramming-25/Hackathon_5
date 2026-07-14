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