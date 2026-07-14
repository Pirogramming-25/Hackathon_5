const editBtn = document.querySelector('.btn-editprofile');
if (editBtn) {
    editBtn.addEventListener('click', () => {
        window.location.href = '/helper/myinfo/';
    });
}

const logoutBtn = document.querySelector('.btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        window.location.href = '/helper/logout/';
    });
}

// 배지 목록 좌우 스크롤
const badgeList = document.querySelector('.badge-list');
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');

if (prevBtn && badgeList) {
    prevBtn.addEventListener('click', () => {
        badgeList.scrollBy({ left: -170, behavior: 'smooth' });
    });
}

if (nextBtn && badgeList) {
    nextBtn.addEventListener('click', () => {
        badgeList.scrollBy({ left: 170, behavior: 'smooth' });
    });
}

// TODO: 배지 목록 API 연동