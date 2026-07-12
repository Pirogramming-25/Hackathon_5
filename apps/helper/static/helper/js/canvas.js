/*
 * 도우미 캔버스 도구.
 *  - 이용자가 보낸 스크린샷을 배경으로 깔고, 그 위에 펜/화살표/동그라미/사각형/메모를 그린다.
 *  - "지우개"는 마지막으로 그린 도형을 지우는 방식(undo)으로 구현했다.
 *    실제 좌표 기반 정밀 지우개가 필요하면 hitTest 함수를 보강하면 된다.
 *  - "완료 전송"을 누르면 지금까지 그린 내용(shapes)과 completed 신호를
 *    ws/session/<id>/ 로 보낸다.
 */
const board = document.getElementById("board");
const ctx = board.getContext("2d");
const requestId = board.dataset.requestId;
const screenshotUrl = board.dataset.screenshotUrl;
const statusEl = document.getElementById("session-status");

let bgImage = null;
if (screenshotUrl) {
  bgImage = new Image();
  bgImage.src = screenshotUrl;
  bgImage.onload = redraw;
}

let currentTool = "pen";
let shapes = []; // {type, points|start/end, text}
let drawing = false;
let currentShape = null;

document.querySelectorAll(".tool").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tool").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentTool = btn.dataset.tool;
  });
});

document.getElementById("reset-btn").addEventListener("click", () => {
  shapes = [];
  redraw();
});

function getPos(e) {
  const rect = board.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  return { x: point.clientX - rect.left, y: point.clientY - rect.top };
}

board.addEventListener("mousedown", (e) => onStart(getPos(e)));
board.addEventListener("mousemove", (e) => onMove(getPos(e)));
window.addEventListener("mouseup", onEnd);

function onStart(pos) {
  if (currentTool === "eraser") {
    shapes.pop(); // 마지막 도형 지우기 (간단한 undo 방식)
    redraw();
    return;
  }
  if (currentTool === "text") {
    const text = prompt("메모 내용을 입력하세요");
    if (text) {
      shapes.push({ type: "text", x: pos.x, y: pos.y, text });
      redraw();
    }
    return;
  }

  drawing = true;
  if (currentTool === "pen") {
    currentShape = { type: "pen", points: [pos] };
  } else {
    currentShape = { type: currentTool, start: pos, end: pos };
  }
}

function onMove(pos) {
  if (!drawing || !currentShape) return;
  if (currentShape.type === "pen") {
    currentShape.points.push(pos);
  } else {
    currentShape.end = pos;
  }
  redraw(currentShape);
}

function onEnd() {
  if (drawing && currentShape) {
    shapes.push(currentShape);
  }
  drawing = false;
  currentShape = null;
  redraw();
}

function redraw(preview) {
  ctx.clearRect(0, 0, board.width, board.height);
  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, board.width, board.height);
  }
  ctx.strokeStyle = "#e63946";
  ctx.fillStyle = "#e63946";
  ctx.lineWidth = 3;

  [...shapes, preview].filter(Boolean).forEach(drawShape);
}

function drawShape(shape) {
  ctx.beginPath();
  if (shape.type === "pen") {
    shape.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  } else if (shape.type === "circle") {
    const r = Math.hypot(shape.end.x - shape.start.x, shape.end.y - shape.start.y);
    ctx.arc(shape.start.x, shape.start.y, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape.type === "rect") {
    ctx.strokeRect(
      shape.start.x,
      shape.start.y,
      shape.end.x - shape.start.x,
      shape.end.y - shape.start.y
    );
  } else if (shape.type === "arrow") {
    drawArrow(shape.start, shape.end);
  } else if (shape.type === "text") {
    ctx.font = "16px sans-serif";
    ctx.fillText(shape.text, shape.x, shape.y);
  }
}

function drawArrow(start, end) {
  const headLength = 12;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

// ---------------------------------------------------------------------
// 실시간 통신: 매칭된 세션에 접속해서 이용자와 상태를 주고받는다.
// ---------------------------------------------------------------------
const protocol = location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${protocol}://${location.host}/ws/session/${requestId}/`);

socket.onopen = () => {
  statusEl.textContent = "이용자와 연결되었습니다";
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "session_message" && data.payload?.action === "cancelled") {
    statusEl.textContent = "이용자가 '괜찮아요!'로 도움을 종료했습니다";
  }
};

document.getElementById("complete-btn").addEventListener("click", () => {
  // TODO(담당자 3): shapes 를 canvas_data 로 서버에 저장하고 싶다면
  // consumers.py 의 receive_json 에서 action === "draw" 케이스를 추가로 처리
  socket.send(JSON.stringify({ action: "draw", shapes }));
  socket.send(JSON.stringify({ action: "complete" }));
  statusEl.textContent = "완료로 전송했습니다. 효자뱃지를 획득했어요!";
});
