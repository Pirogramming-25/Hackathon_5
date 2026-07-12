/*
 * 도우미 대기 화면: ws/helpers/ 에 접속해서 새 요청을 실시간으로 받는다.
 * "수락" 버튼 -> {"action": "accept", "request_id": N} 전송
 * 서버가 accept_result(success=true) 를 주면 캔버스 화면으로 이동.
 */
const list = document.getElementById("request-list");
const emptyState = document.getElementById("empty-state");
const pending = {};

const protocol = location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${protocol}://${location.host}/ws/helpers/`);

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "new_request") {
    pending[data.request_id] = data;
    render();
  } else if (data.type === "request_taken") {
    delete pending[data.request_id];
    render();
  } else if (data.type === "accept_result") {
    if (data.success) {
      window.location.href = `/helper/session/${data.request_id}/`;
    } else {
      alert("이미 다른 도우미가 수락했어요. 다른 요청을 확인해보세요.");
    }
  }
};

function render() {
  list.innerHTML = "";
  const items = Object.values(pending);
  emptyState.classList.toggle("hidden", items.length > 0);

  items.forEach((req) => {
    const li = document.createElement("li");
    li.className = "request-item";
    li.innerHTML = `<span>예약 단계: ${req.reservation_step || "-"}</span>`;

    const btn = document.createElement("button");
    btn.textContent = "수락";
    btn.addEventListener("click", () => {
      socket.send(JSON.stringify({ action: "accept", request_id: req.request_id }));
    });

    li.appendChild(btn);
    list.appendChild(li);
  });
}

// TODO(담당자 2/3): 온라인/오프라인 토글 스위치를 추가하고,
// 오프라인 상태에서는 이 소켓 연결을 끊도록 확장 가능.
