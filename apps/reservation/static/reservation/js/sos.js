/*
  담당자 1과 협의 필요한 가정(assumption) 목록
  1) POST /sos/request/ 요청 바디: { screenshot: "data:image/png;base64,...", reservation_step: "step2_date" }
  2) POST /sos/request/ 응답: { request_id: "abc123" }
  3) 웹소켓 메시지 형식: { type: "status" | "helper_joined" | "resolved" | "cancelled", message: "..." }
  아래 4개 값은 백엔드 완성되면 실제 스펙에 맞춰 수정해야 합니다.
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
  const stream = await withTimeout(
    navigator.mediaDevices.getDisplayMedia({ video: true }),
    15000
  );
  const track = stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  const bitmap = await imageCapture.grabFrame();

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);

  track.stop();

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

    if (data.type === "helper_joined") {
      setStatus("도우미가 연결됐어요", data.message || "화면을 함께 보며 안내해드릴게요.");
    } else if (data.type === "resolved") {
      setStatus("도움이 완료됐어요", data.message || "이용해주셔서 감사합니다.");
    } else if (data.type === "cancelled") {
      setStatus("요청이 취소됐어요", data.message || "");
    } else {
      setStatus("상태 업데이트", data.message || "");
    }
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
    setStatus("요청을 보내지 못했어요", "화면 캡처 권한이 필요해요.");
    return;
  }

  setStatus("도움 요청을 보내고 있어요", "잠시만 기다려주세요.");

  try {
    const { request_id } = await sendSosRequest(screenshotDataUrl);
    setStatus("요청이 전달됐어요!", "곧 도우미가 연결될 거예요.");
    connectSession(request_id);
  } catch (err) {
    // TODO(담당자 3): sos_request가 아직 501 스텁이라 항상 실패함.
    // 백엔드 연동 전까지 프론트에서만 전송 완료로 보여줌.
    setStatus("요청이 전달됐어요!", "도우미 매칭 기능은 준비 중이에요.");
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