/*
  apps/matching/consumers.py (SessionConsumer) 실제 스펙에 맞춘 계약.
  1) POST /sos/request/ 요청 바디: { screenshot: "data:image/png;base64,...", reservation_step: "step2_date" }
  2) POST /sos/request/ 응답: { request_id: 1 }
  3) 웹소켓(/ws/session/<id>/) 메시지 형식:
     - { type: "connected", request_id, message }               접속 확인
     - { type: "matched", request_id, helper_id, helper_name }   도우미 매칭됨 (먼저 수락한 도우미 한 명)
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
const sosSpinner = document.getElementById("sosSpinner");
const sosPhotoBox = document.getElementById("sosPhotoBox");
const sosPhotoImg = document.getElementById("sosPhotoImg");
const sosPhotoCanvas = document.getElementById("sosPhotoCanvas");
const sosActions = document.getElementById("sosActions");
const sosStillConfused = document.getElementById("sosStillConfused");
const sosThanks = document.getElementById("sosThanks");

const photoCtx = sosPhotoCanvas ? sosPhotoCanvas.getContext("2d") : null;

let sosSocket = null;
let lastScreenshotDataUrl = null;
let lastShapes = [];

function resizePhotoCanvas() {
  if (!sosPhotoCanvas || !sosPhotoImg) return;
  sosPhotoCanvas.width = sosPhotoImg.clientWidth;
  sosPhotoCanvas.height = sosPhotoImg.clientHeight;
  redrawPhotoCanvas();
}

function drawShape(shape) {
  if (!photoCtx) return;
  const w = sosPhotoCanvas.width;
  const h = sosPhotoCanvas.height;

  photoCtx.strokeStyle = "#7C3AED";
  photoCtx.fillStyle = "#7C3AED";
  photoCtx.lineWidth = 3;
  photoCtx.lineJoin = "round";
  photoCtx.lineCap = "round";

  if (shape.tool === "arrow") {
    const x1 = shape.x1 * w, y1 = shape.y1 * h;
    const x2 = shape.x2 * w, y2 = shape.y2 * h;

    photoCtx.beginPath();
    photoCtx.moveTo(x1, y1);
    photoCtx.lineTo(x2, y2);
    photoCtx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 14;
    photoCtx.beginPath();
    photoCtx.moveTo(x2, y2);
    photoCtx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    photoCtx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    photoCtx.closePath();
    photoCtx.fill();
  } else if (shape.tool === "circle") {
    const x1 = shape.x1 * w, y1 = shape.y1 * h;
    const x2 = shape.x2 * w, y2 = shape.y2 * h;
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;

    photoCtx.beginPath();
    photoCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    photoCtx.stroke();
  } else if (shape.tool === "square") {
    const x1 = shape.x1 * w, y1 = shape.y1 * h;
    const x2 = shape.x2 * w, y2 = shape.y2 * h;

    photoCtx.strokeRect(
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.abs(x2 - x1),
      Math.abs(y2 - y1)
    );
  } else if (shape.tool === "memo") {
    const x = shape.x1 * w, y = shape.y1 * h;
    const text = shape.text || "";

    photoCtx.font = "bold 16px sans-serif";
    const paddingX = 8, paddingY = 6;
    const textWidth = photoCtx.measureText(text).width;

    photoCtx.fillStyle = "rgba(124, 58, 237, 0.9)";
    photoCtx.fillRect(x, y - 24, textWidth + paddingX * 2, 24 + paddingY);
    photoCtx.fillStyle = "#fff";
    photoCtx.fillText(text, x + paddingX, y - 6);
  }
}

function redrawPhotoCanvas() {
  if (!photoCtx) return;
  photoCtx.clearRect(0, 0, sosPhotoCanvas.width, sosPhotoCanvas.height);
  lastShapes.forEach(drawShape);
}

function renderShapes(shapes) {
  lastShapes = shapes || [];
  redrawPhotoCanvas();
}

window.addEventListener("resize", resizePhotoCanvas);

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}

function setStatus(title, desc) {
  sosStatusTitle.textContent = title;
  sosStatusDesc.textContent = desc;
}

function showPhotoAndActions() {
  if (!lastScreenshotDataUrl) return;

  sosSpinner.hidden = true;
  sosPhotoBox.hidden = false;
  sosActions.hidden = false;

  sosPhotoImg.onload = resizePhotoCanvas;
  sosPhotoImg.src = lastScreenshotDataUrl;
  if (sosPhotoImg.complete) {
    resizePhotoCanvas();
  }
}

function hidePhotoAndActions() {
  sosPhotoBox.hidden = true;
  sosActions.hidden = true;
  sosSpinner.hidden = false;
  lastShapes = [];
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
  const socket = new WebSocket(SOS_WS_URL_PREFIX + requestId + "/");
  sosSocket = socket;

  socket.addEventListener("open", () => {
    setStatus("도우미를 찾고 있어요", "먼저 응답하는 도우미가 연결돼요.");
  });

  socket.addEventListener("message", (event) => {
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
      showPhotoAndActions();
      return;
    }

    if (data.type === "session_message") {
      const action = data.payload && data.payload.action;

      if (action === "completed") {
        setStatus("도움이 완료됐어요", "이용해주셔서 감사합니다.");
        closeSosPanel();
      } else if (action === "cancelled") {
        setStatus("요청이 취소됐어요", "");
        hidePhotoAndActions();
      } else if (action === "draw") {
        renderShapes(data.payload.shapes);
      }
      return;
    }

    setStatus("상태 업데이트", data.message || "");
  });

  socket.addEventListener("close", () => {
    if (sosSocket === socket) {
      sosSocket = null;
    }
  });

  socket.addEventListener("error", () => {
    setStatus("연결에 문제가 생겼어요", "잠시 후 다시 시도해주세요.");
  });
}

async function startSosFlow() {
  sosPanel.hidden = false;
  hidePhotoAndActions();
  setStatus("화면을 캡처하고 있어요", "잠시만 기다려주세요.");

  let screenshotDataUrl;
  try {
    screenshotDataUrl = await captureScreen();
  } catch (err) {
    setStatus("요청을 보내지 못했어요", "화면 캡처에 실패했어요. 다시 시도해주세요.");
    return;
  }

  lastScreenshotDataUrl = screenshotDataUrl;
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
  hidePhotoAndActions();
  lastScreenshotDataUrl = null;
}

if (sosTrigger) {
  sosTrigger.addEventListener("click", startSosFlow);
}

if (sosClose) {
  sosClose.addEventListener("click", closeSosPanel);
}

// "잘 모르겠어요": 현재 요청은 종료 처리하고, 화면을 다시 캡처해서 새 도움 요청을 보낸다.
if (sosStillConfused) {
  sosStillConfused.addEventListener("click", () => {
    if (sosSocket && sosSocket.readyState === WebSocket.OPEN) {
      sosSocket.send(JSON.stringify({ action: "im_fine" }));
      sosSocket.close();
      sosSocket = null;
    }
    startSosFlow();
  });
}

// "감사합니다": 도움을 완료 처리(효자 배지 지급)하고 패널을 닫아 예약 화면으로 돌아간다.
if (sosThanks) {
  sosThanks.addEventListener("click", () => {
    if (sosSocket && sosSocket.readyState === WebSocket.OPEN) {
      sosSocket.send(JSON.stringify({ action: "complete" }));
    }
    closeSosPanel();
  });
}
