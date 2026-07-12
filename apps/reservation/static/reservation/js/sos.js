/*
 * 이용자 쪽 SOS 버튼 로직.
 *  1) 버튼 클릭 -> html2canvas 로 현재 화면 캡처
 *  2) /sos/request/ 로 업로드 -> HelpRequest 생성 -> matching 앱이 도우미들에게 broadcast
 *  3) 응답으로 받은 request_id 로 /ws/session/<id>/ 웹소켓 접속
 *  4) "matched"(도우미 배정), "session_message"(도우미가 보낸 안내/채팅) 이벤트 수신
 *  5) "혼자 해볼게요!" 버튼 -> {"action": "im_fine"} 전송 후 종료
 *
 * 담당자 1은 이 파일의 화면 표시 부분(appendMessage 등)을 자유롭게 꾸며도 되고,
 * 담당자 3(매칭)은 서버가 보내는 이벤트 타입/필드를 바꾸면 여기도 맞춰서 수정해야 한다.
 */
(function () {
  const sosButton = document.getElementById("sos-button");
  const sosPanel = document.getElementById("sos-panel");
  const sosStatus = document.getElementById("sos-status");
  const sosMessages = document.getElementById("sos-messages");
  const sosClose = document.getElementById("sos-close");
  const sosImFine = document.getElementById("sos-im-fine");

  let socket = null;

  function appendMessage(text) {
    const p = document.createElement("p");
    p.textContent = text;
    sosMessages.appendChild(p);
    sosMessages.scrollTop = sosMessages.scrollHeight;
  }

  function openPanel() {
    sosPanel.classList.remove("hidden");
  }

  function closePanel() {
    sosPanel.classList.add("hidden");
    if (socket) {
      socket.close();
      socket = null;
    }
  }

  function connectSession(requestId) {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    socket = new WebSocket(`${protocol}://${location.host}/ws/session/${requestId}/`);

    socket.onopen = () => {
      sosStatus.textContent = "도우미를 찾고 있어요...";
      appendMessage("화면을 전송했어요. 잠시만 기다려주세요.");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "matched") {
        sosStatus.textContent = `${data.helper_name} 도우미님이 연결되었어요`;
        appendMessage(`${data.helper_name} 도우미님과 연결되었습니다.`);
        sosImFine.classList.remove("hidden");
      } else if (data.type === "session_message") {
        const payload = data.payload || {};
        if (payload.action === "completed") {
          sosStatus.textContent = "도움이 완료되었습니다";
          appendMessage("도우미가 도움을 완료했습니다. 감사합니다!");
          sosImFine.classList.add("hidden");
        } else if (payload.action === "cancelled") {
          sosStatus.textContent = "도움이 종료되었습니다";
        } else if (payload.message) {
          appendMessage(`도우미: ${payload.message}`);
        } else {
          // TODO(담당자 1/3): 캔버스 draw 이벤트를 화면 위에 실제로 그려주는 로직 추가
          appendMessage("도우미가 화면에 안내를 표시했어요.");
        }
      }
    };

    socket.onclose = () => {
      appendMessage("연결이 종료되었습니다.");
    };
  }

  async function requestHelp() {
    sosStatus.textContent = "화면을 캡처하는 중...";
    sosMessages.innerHTML = "";
    sosImFine.classList.add("hidden");
    openPanel();

    const canvas = await html2canvas(document.body);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

    const formData = new FormData();
    formData.append("screenshot", blob, "screenshot.png");
    formData.append("step", document.body.dataset.step || "");

    const res = await fetch("/sos/request/", { method: "POST", body: formData });
    const data = await res.json();
    connectSession(data.request_id);
  }

  sosButton.addEventListener("click", requestHelp);
  sosClose.addEventListener("click", closePanel);
  sosImFine.addEventListener("click", () => {
    if (socket) socket.send(JSON.stringify({ action: "im_fine" }));
    sosStatus.textContent = "괜찮아요! 도움을 종료했어요.";
    sosImFine.classList.add("hidden");
  });
})();
