const mypageBtn = document.querySelector('.btn-mypage');
if (mypageBtn) {
    mypageBtn.addEventListener('click', () => {
        window.location.href = '/helper/mypage/';
    });
}

const viewRankingBtn = document.querySelector('.btn-view-ranking');
if (viewRankingBtn) {
    viewRankingBtn.addEventListener('click', () => {
        window.location.href = '/helper/ranking/';
    });
}

