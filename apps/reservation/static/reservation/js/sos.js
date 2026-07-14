/*
  apps/matching/consumers.py (SessionConsumer) 실제 스펙에 맞춘 계약.
  1) POST /sos/request/ 요청 바디: { screenshot: "data:image/png;base64,...", reservation_step: "step2_date" }
  2) POST /sos/request/ 응답: { request_id: 1 }
  3) 웹소켓(/ws/session/<id>/) 메시지 형식:
     - { type: "connected", request_id, message }               접속 확인
     - { type: "matched", request_id, helper_id, helper_name }   도우미 매칭됨
     - { type: "session_message", payload: { action: "completed" | "cancelled" | "draw", ... } }
*/
const sosWidget = document.getElementById("sosWidget");
const SOS_REQUEST_URL = sosWidget.dataset.sosUrl;
const SOS_WS_URL_PREFIX = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws/session/";
const SCREENSHOT_FIELD_NAME = "screenshot";
const STEP_FIELD_NAME = "reservation_step";

const sosTrigger = document.getElementById("sosTrigger");
const sosPanel = document.getElementById("sosPanel");
const sosClose = document.getElementById("sosClose");
const sosStatusTitle = document.getElementById("sosStatusTitle");
const sosStatusDesc = document.getElementById("sosStatusDesc");

let sosSocket = null;

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}

function setStatus(title, desc) {
  sosStatusTitle.textContent = title;
  sosStatusDesc.textContent = desc;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function captureScreen() {
  // html2canvas는 DOM을 그려서 캡처하므로 getDisplayMedia와 달리 브라우저의
  // "화면 공유" 권한 팝업이 뜨지 않는다 (디지털 취약계층 사용자를 배려한 선택).
  const canvas = await withTimeout(
    html2canvas(document.body, {
      ignoreElements: (el) => el.id === "sosWidget",
    }),
    15000
  );

  return canvas.toDataURL("image/png");
}

async function sendSosRequest(screenshotDataUrl) {
  const response = await fetch(SOS_REQUEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: JSON.stringify({
      [SCREENSHOT_FIELD_NAME]: screenshotDataUrl,
      [STEP_FIELD_NAME]: document.body.dataset.reservationStep || "",
    }),
  });

  if (!response.ok) {
    throw new Error("SOS 요청 실패: " + response.status);
  }

  return response.json();
}

function connectSession(requestId) {
  sosSocket = new WebSocket(SOS_WS_URL_PREFIX + requestId + "/");

  sosSocket.addEventListener("open", () => {
    setStatus("도우미를 찾고 있어요", "곧 연결해드릴게요.");
  });

  sosSocket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "connected") {
      // open 이벤트에서 이미 "도우미를 찾고 있어요"로 안내했으므로 별도 표시 없음.
      return;
    }

    if (data.type === "matched") {
      setStatus(
        "도우미가 연결됐어요",
        `${data.helper_name || "도우미"}님이 화면을 함께 보며 안내해드릴게요.`
      );
      return;
    }

    if (data.type === "session_message") {
      const action = data.payload && data.payload.action;

      if (action === "completed") {
        setStatus("도움이 완료됐어요", "이용해주셔서 감사합니다.");
      } else if (action === "cancelled") {
        setStatus("요청이 취소됐어요", "");
      }
      // action === "draw"(캔버스 주석)는 이 상태 위젯에서는 표시하지 않는다.
      return;
    }

    setStatus("상태 업데이트", data.message || "");
  });

  sosSocket.addEventListener("close", () => {
    sosSocket = null;
  });

  sosSocket.addEventListener("error", () => {
    setStatus("연결에 문제가 생겼어요", "잠시 후 다시 시도해주세요.");
  });
}

async function startSosFlow() {
  sosPanel.hidden = false;
  setStatus("화면을 캡처하고 있어요", "잠시만 기다려주세요.");

  let screenshotDataUrl;
  try {
    screenshotDataUrl = await captureScreen();
  } catch (err) {
    setStatus("요청을 보내지 못했어요", "화면 캡처에 실패했어요. 다시 시도해주세요.");
    return;
  }

  setStatus("도움 요청을 보내고 있어요", "잠시만 기다려주세요.");

  try {
    const { request_id } = await sendSosRequest(screenshotDataUrl);
    setStatus("요청이 전달됐어요!", "곧 도우미가 연결될 거예요.");
    connectSession(request_id);
  } catch (err) {
    setStatus("요청을 보내지 못했어요", "잠시 후 다시 시도해주세요.");
  }
}

function closeSosPanel() {
  sosPanel.hidden = true;
  if (sosSocket) {
    sosSocket.close();
    sosSocket = null;
  }
}

if (sosTrigger) {
  sosTrigger.addEventListener("click", startSosFlow);
}

if (sosClose) {
  sosClose.addEventListener("click", closeSosPanel);
}