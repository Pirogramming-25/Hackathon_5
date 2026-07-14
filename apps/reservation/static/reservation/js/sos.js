/*
  apps/matching/consumers.py (SessionConsumer) 실제 스펙에 맞춘 계약.
  1) POST /sos/request/ 요청 바디: { screenshot: "data:image/png;base64,...", reservation_step: "step2_date" }
  2) POST /sos/request/ 응답: { request_id: 1 }
  3) 웹소켓(/ws/session/<id>/) 메시지 형식:
     - { type: "connected", request_id, message }               접속 확인
     - { type: "matched", request_id, helper_id, helper_name }   도우미 매칭됨 (먼저 수락한 도우미 한 명)
     - { type: "session_message", payload: { action: "completed" | "cancelled" | "draw", ... } }

  도우미가 그린 도형은 별도 모달/사진이 아니라, 이용자의 실제 화면 위에 그대로
  겹쳐서 보여준다 (document 전체 크기의 투명 캔버스, pointer-events: none).
*/
const sosWidget = document.getElementById("sosWidget");
const SOS_REQUEST_URL = sosWidget.dataset.sosUrl;
const SOS_WS_URL_PREFIX = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws/session/";
const SCREENSHOT_FIELD_NAME = "screenshot";
const STEP_FIELD_NAME = "reservation_step";

const sosTrigger = document.getElementById("sosTrigger");
const sosComplete = document.getElementById("sosComplete");
const sosStatus = document.getElementById("sosStatus");

const annotationCanvas = document.getElementById("sosAnnotationCanvas");
const annotationCtx = annotationCanvas ? annotationCanvas.getContext("2d") : null;

let sosSocket = null;
let lastShapes = [];
let isMatched = false;

function resizeAnnotationCanvas() {
  if (!annotationCanvas) return;
  annotationCanvas.width = document.documentElement.scrollWidth;
  annotationCanvas.height = document.documentElement.scrollHeight;
}

function drawShape(shape) {
  if (!annotationCtx) return;
  const w = annotationCanvas.width;
  const h = annotationCanvas.height;

  annotationCtx.strokeStyle = "#7C3AED";
  annotationCtx.fillStyle = "#7C3AED";
  annotationCtx.lineWidth = 3;
  annotationCtx.lineJoin = "round";
  annotationCtx.lineCap = "round";

  if (shape.tool === "arrow") {
    const x1 = shape.x1 * w, y1 = shape.y1 * h;
    const x2 = shape.x2 * w, y2 = shape.y2 * h;

    annotationCtx.beginPath();
    annotationCtx.moveTo(x1, y1);
    annotationCtx.lineTo(x2, y2);
    annotationCtx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 14;
    annotationCtx.beginPath();
    annotationCtx.moveTo(x2, y2);
    annotationCtx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    annotationCtx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    annotationCtx.closePath();
    annotationCtx.fill();
  } else if (shape.tool === "circle") {
    const x1 = shape.x1 * w, y1 = shape.y1 * h;
    const x2 = shape.x2 * w, y2 = shape.y2 * h;
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;

    annotationCtx.beginPath();
    annotationCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    annotationCtx.stroke();
  } else if (shape.tool === "square") {
    const x1 = shape.x1 * w, y1 = shape.y1 * h;
    const x2 = shape.x2 * w, y2 = shape.y2 * h;

    annotationCtx.strokeRect(
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.abs(x2 - x1),
      Math.abs(y2 - y1)
    );
  } else if (shape.tool === "memo") {
    const x = shape.x1 * w, y = shape.y1 * h;
    const text = shape.text || "";

    annotationCtx.font = "bold 16px sans-serif";
    const paddingX = 8, paddingY = 6;
    const textWidth = annotationCtx.measureText(text).width;

    annotationCtx.fillStyle = "rgba(124, 58, 237, 0.9)";
    annotationCtx.fillRect(x, y - 24, textWidth + paddingX * 2, 24 + paddingY);
    annotationCtx.fillStyle = "#fff";
    annotationCtx.fillText(text, x + paddingX, y - 6);
  }
}

function redrawAnnotations() {
  if (!annotationCtx) return;
  annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
  lastShapes.forEach(drawShape);
}

function renderShapes(shapes) {
  lastShapes = shapes || [];
  resizeAnnotationCanvas();
  redrawAnnotations();
}

function clearShapes() {
  lastShapes = [];
  if (annotationCtx) {
    annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
  }
}

window.addEventListener("resize", () => {
  resizeAnnotationCanvas();
  redrawAnnotations();
});

// 콘텐츠 로딩 등으로 문서 크기가 바뀌어도 캔버스 해상도를 즉시 다시 맞춰서
// 도우미가 그린 좌표가 실제 화면과 어긋나지 않게 한다.
if (annotationCanvas && typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => {
    resizeAnnotationCanvas();
    redrawAnnotations();
  }).observe(document.body);
}

resizeAnnotationCanvas();

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}

function setStatus(text) {
  if (!sosStatus) return;

  if (!text) {
    sosStatus.hidden = true;
    sosStatus.textContent = "";
    return;
  }

  sosStatus.hidden = false;
  sosStatus.textContent = text;
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
      ignoreElements: (el) => el.id === "sosWidget" || el.id === "sosAnnotationCanvas",
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
    setStatus("도우미를 찾고 있어요");
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "connected") {
      return;
    }

    if (data.type === "matched") {
      isMatched = true;
      setStatus(`${data.helper_name || "도우미"}님이 연결됐어요`);
      return;
    }

    if (data.type === "session_message") {
      const action = data.payload && data.payload.action;

      if (action === "completed") {
        setStatus("도움이 완료됐어요");
        endSession();
      } else if (action === "cancelled") {
        setStatus("요청이 취소됐어요");
        endSession();
      } else if (action === "draw") {
        renderShapes(data.payload.shapes);
      }
      return;
    }

    setStatus(data.message || "");
  });

  socket.addEventListener("close", () => {
    if (sosSocket === socket) {
      sosSocket = null;
    }
  });

  socket.addEventListener("error", () => {
    setStatus("연결에 문제가 생겼어요. 다시 시도해주세요.");
  });
}

async function startSosFlow() {
  // 이미 진행 중인 요청이 있으면 종료하고 새로 요청한다 (아직도 잘 모르겠을 때 재요청).
  if (sosSocket && sosSocket.readyState === WebSocket.OPEN) {
    sosSocket.send(JSON.stringify({ action: "im_fine" }));
    sosSocket.close();
    sosSocket = null;
  }

  clearShapes();
  isMatched = false;
  sosComplete.hidden = false;
  setStatus("화면을 캡처하고 있어요");

  let screenshotDataUrl;
  try {
    screenshotDataUrl = await captureScreen();
  } catch (err) {
    setStatus("화면 캡처에 실패했어요. 다시 시도해주세요.");
    return;
  }

  setStatus("도움 요청을 보내고 있어요");

  try {
    const { request_id } = await sendSosRequest(screenshotDataUrl);
    setStatus("요청이 전달됐어요! 곧 도우미가 연결돼요.");
    connectSession(request_id);
  } catch (err) {
    setStatus("요청을 보내지 못했어요. 잠시 후 다시 시도해주세요.");
  }
}

function endSession() {
  if (sosSocket) {
    sosSocket.close();
    sosSocket = null;
  }
  clearShapes();
  isMatched = false;
  sosComplete.hidden = true;
}

if (sosTrigger) {
  sosTrigger.addEventListener("click", startSosFlow);
}

// "완료": 도우미가 아직 수락하기 전이면 요청 자체를 취소(im_fine)해서 대기 중인
// 도우미들의 수락/거절 화면도 사라지게 하고, 이미 매칭된 뒤라면 도움을 완료
// 처리(complete, 효자 배지 지급)한다. 어느 쪽이든 화면 위 도구는 즉시 지운다.
if (sosComplete) {
  sosComplete.addEventListener("click", () => {
    if (sosSocket && sosSocket.readyState === WebSocket.OPEN) {
      sosSocket.send(
        JSON.stringify({ action: isMatched ? "complete" : "im_fine" })
      );
    }
    setStatus(null);
    endSession();
  });
}
