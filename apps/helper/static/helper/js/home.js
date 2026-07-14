const mypageBtn = document.querySelector('.btn-mypage');
if (mypageBtn) {
    mypageBtn.addEventListener('click', () => {
        window.location.href = '/mypage/';
    });
}

const viewRankingBtn = document.querySelector('.btn-view-ranking');
if (viewRankingBtn) {
    viewRankingBtn.addEventListener('click', () => {
        window.location.href = '/ranking/';
    });
}

//badge_count, 랭킹 top3 API 연동