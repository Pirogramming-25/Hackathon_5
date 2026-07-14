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

const protocol = window.location.protocol === "https:" ? "wss" : "ws";

const helperSocket = new WebSocket(
    `${protocol}://${window.location.host}/ws/helpers/`
);

helperSocket.onopen = () => {
    console.log("도우미 대기방 연결 성공");
};

helperSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "new_request") {
        sessionStorage.setItem(
            "currentHelpRequest",
            JSON.stringify(data)
        );

        window.location.href = "/accept/";
    }
};

helperSocket.onerror = (error) => {
    console.error("도우미 웹소켓 오류:", error);
};
//badge_count, 랭킹 top3 API 연동