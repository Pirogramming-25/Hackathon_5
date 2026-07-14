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

helperSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (
        data.type === "accept_result" &&
        data.request_id === currentRequestId
    ) {
        if (data.success) {
            sessionStorage.removeItem("currentHelpRequest");

            window.location.href =
                `/session/${currentRequestId}/`;
        } else {
            alert("이미 다른 도우미가 수락한 요청입니다.");
            sessionStorage.removeItem("currentHelpRequest");
            window.location.href = "/";
        }
    }

    if (
        data.type === "request_taken" &&
        data.request_id === currentRequestId
    ) {
        alert("다른 도우미가 먼저 수락했습니다.");
        sessionStorage.removeItem("currentHelpRequest");
        window.location.href = "/";
    }
};

if (rejectBtn) {
    rejectBtn.addEventListener("click", () => {
        sessionStorage.removeItem("currentHelpRequest");
        window.location.href = "/";
    });
}