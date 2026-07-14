const requestData = JSON.parse(
    sessionStorage.getItem("currentHelpRequest")
);

const currentRequestId = requestData?.request_id;

const protocol = window.location.protocol === "https:" ? "wss" : "ws";

const helperSocket = new WebSocket(
    `${protocol}://${window.location.host}/ws/helpers/`
);

const acceptBtn = document.querySelector(".btn-accept");
const rejectBtn = document.querySelector(".btn-reject");

if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
        if (!currentRequestId) {
            alert("요청 정보를 찾을 수 없습니다.");
            return;
        }

        if (helperSocket.readyState !== WebSocket.OPEN) {
            alert("서버 연결 중입니다. 잠시 후 다시 눌러주세요.");
            return;
        }

        helperSocket.send(
            JSON.stringify({
                action: "accept",
                request_id: currentRequestId,
            })
        );
    });
}

let acceptedByMe = false;

helperSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (
        data.type === "accept_result" &&
        data.request_id === currentRequestId
    ) {
        if (data.success) {
            acceptedByMe = true;
            sessionStorage.removeItem("currentHelpRequest");

            window.location.href =
                `/session/${currentRequestId}/`;
        } else {
            alert("이미 다른 도우미가 수락한 요청입니다.");
            sessionStorage.removeItem("currentHelpRequest");
            window.location.href = "/waiting/";
        }
        return;
    }

    if (
        data.type === "request_taken" &&
        data.request_id === currentRequestId
    ) {
        // 내가 방금 수락에 성공한 요청도 대기방 전체에 request_taken이 브로드캐스트되므로,
        // 내가 수락한 경우에는 무시한다 (그렇지 않으면 "다른 도우미가 먼저 수락했다"는
        // 잘못된 알림이 뜬다).
        if (acceptedByMe) return;

        alert("다른 도우미가 먼저 수락했습니다.");
        sessionStorage.removeItem("currentHelpRequest");
        window.location.href = "/waiting/";
        return;
    }

    if (
        data.type === "request_cancelled" &&
        data.request_id === currentRequestId
    ) {
        alert("이용자가 도움 요청을 취소했습니다.");
        sessionStorage.removeItem("currentHelpRequest");
        window.location.href = "/waiting/";
    }
};

if (rejectBtn) {
    rejectBtn.addEventListener("click", () => {
        sessionStorage.removeItem("currentHelpRequest");
        window.location.href = "/waiting/";
    });
}