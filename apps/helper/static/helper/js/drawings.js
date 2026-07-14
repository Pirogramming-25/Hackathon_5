const pathParts = window.location.pathname
    .split('/')
    .filter(Boolean);

const requestId = pathParts[pathParts.length - 1];

const protocol =
    window.location.protocol === 'https:' ? 'wss' : 'ws';

const sessionSocket = new WebSocket(
    `${protocol}://${window.location.host}/ws/session/${requestId}/`
);

const canvasArea = document.querySelector('.canvas-area');
const canvas = document.getElementById('drawCanvas');
const screenshotImg = document.getElementById('screenshotImg');
const ctx = canvas ? canvas.getContext('2d') : null;
const toolItems = document.querySelectorAll('.tool-item');

let shapes = [];
const initialShapesEl = document.getElementById('initial-shapes-data');
if (initialShapesEl) {
    try {
        shapes = JSON.parse(initialShapesEl.textContent) || [];
    } catch (e) {
        shapes = [];
    }
}

let currentTool = null;
let drawing = false;
let startX = 0;
let startY = 0;

function resizeCanvas() {
    if (!canvas || !canvasArea) return;
    const rect = canvasArea.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    redraw();
}

function drawShape(shape) {
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.strokeStyle = '#7C3AED';
    ctx.fillStyle = '#7C3AED';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (shape.tool === 'arrow') {
        const x1 = shape.x1 * w, y1 = shape.y1 * h;
        const x2 = shape.x2 * w, y2 = shape.y2 * h;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 14;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
            x2 - headLen * Math.cos(angle - Math.PI / 6),
            y2 - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            x2 - headLen * Math.cos(angle + Math.PI / 6),
            y2 - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    } else if (shape.tool === 'circle') {
        const x1 = shape.x1 * w, y1 = shape.y1 * h;
        const x2 = shape.x2 * w, y2 = shape.y2 * h;
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else if (shape.tool === 'square') {
        const x1 = shape.x1 * w, y1 = shape.y1 * h;
        const x2 = shape.x2 * w, y2 = shape.y2 * h;

        ctx.strokeRect(
            Math.min(x1, x2),
            Math.min(y1, y2),
            Math.abs(x2 - x1),
            Math.abs(y2 - y1)
        );
    } else if (shape.tool === 'memo') {
        const x = shape.x1 * w, y = shape.y1 * h;
        const text = shape.text || '';

        ctx.font = 'bold 16px sans-serif';
        const paddingX = 8, paddingY = 6;
        const textWidth = ctx.measureText(text).width;

        ctx.fillStyle = 'rgba(124, 58, 237, 0.9)';
        ctx.fillRect(x, y - 24, textWidth + paddingX * 2, 24 + paddingY);
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x + paddingX, y - 6);
    }
}

function redraw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(drawShape);
}

function sendShapes() {
    if (sessionSocket.readyState === WebSocket.OPEN) {
        sessionSocket.send(
            JSON.stringify({
                action: 'draw',
                shapes,
            })
        );
    }
}

function getNormalizedPos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / rect.width,
        y: (evt.clientY - rect.top) / rect.height,
    };
}

function distanceToShape(shape, x, y) {
    if (shape.tool === 'memo') {
        return Math.hypot(shape.x1 - x, shape.y1 - y);
    }
    const mx = (shape.x1 + shape.x2) / 2;
    const my = (shape.y1 + shape.y2) / 2;
    return Math.hypot(mx - x, my - y);
}

function eraseNear(x, y) {
    if (shapes.length === 0) return;

    let nearestIdx = -1;
    let nearestDist = Infinity;

    shapes.forEach((shape, idx) => {
        const d = distanceToShape(shape, x, y);
        if (d < nearestDist) {
            nearestDist = d;
            nearestIdx = idx;
        }
    });

    if (nearestIdx !== -1 && nearestDist < 0.08) {
        shapes.splice(nearestIdx, 1);
        redraw();
        sendShapes();
    }
}

if (canvas) {
    canvas.addEventListener('mousedown', (evt) => {
        if (!currentTool) return;
        const { x, y } = getNormalizedPos(evt);

        if (currentTool === 'eraser') {
            eraseNear(x, y);
            return;
        }

        if (currentTool === 'memo') {
            const text = window.prompt('메모 내용을 입력하세요');
            if (text) {
                shapes.push({ tool: 'memo', x1: x, y1: y, text });
                redraw();
                sendShapes();
            }
            return;
        }

        drawing = true;
        startX = x;
        startY = y;
    });

    canvas.addEventListener('mousemove', (evt) => {
        if (!drawing) return;
        const { x, y } = getNormalizedPos(evt);
        redraw();
        drawShape({ tool: currentTool, x1: startX, y1: startY, x2: x, y2: y });
    });

    canvas.addEventListener('mouseup', (evt) => {
        if (!drawing) return;
        drawing = false;
        const { x, y } = getNormalizedPos(evt);

        if (Math.hypot(x - startX, y - startY) < 0.01) {
            redraw();
            return;
        }

        shapes.push({ tool: currentTool, x1: startX, y1: startY, x2: x, y2: y });
        redraw();
        sendShapes();
    });

    canvas.addEventListener('mouseleave', () => {
        if (drawing) {
            drawing = false;
            redraw();
        }
    });
}

toolItems.forEach((item) => {
    item.addEventListener('click', () => {
        const toolType = item.dataset.tool;

        if (toolType === 'reset') {
            shapes = [];
            redraw();
            sendShapes();
            return;
        }

        toolItems.forEach((el) => el.classList.remove('active'));
        item.classList.add('active');
        currentTool = toolType;
    });
});

if (screenshotImg) {
    if (screenshotImg.complete && screenshotImg.naturalWidth > 0) {
        resizeCanvas();
    } else {
        screenshotImg.addEventListener('load', resizeCanvas);
    }
} else {
    resizeCanvas();
}

// 스크린샷 로딩/폰트/반응형 레이아웃 등 어떤 이유로든 .canvas-area 크기가
// 바뀌면 캔버스 해상도도 즉시 다시 맞춰서, 좌표가 실제 이미지와 어긋나지 않게 한다.
if (canvasArea && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => resizeCanvas()).observe(canvasArea);
} else {
    window.addEventListener('resize', resizeCanvas);
}

sessionSocket.onopen = () => {
    console.log('도움 세션 웹소켓 연결 성공');
};

sessionSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type !== 'session_message') return;

    const action = data.payload.action;

    if (action === 'cancelled') {
        alert('이용자가 도움을 종료했습니다.');
        window.location.href = '/waiting/';
    }

    if (action === 'completed') {
        alert('도움이 완료되었습니다.');
        window.location.href = '/waiting/';
    }

    if (action === 'draw') {
        shapes = data.payload.shapes || [];
        redraw();
    }
};

const completeBtn = document.querySelector('.btn-complete');

if (completeBtn) {
    completeBtn.addEventListener('click', () => {
        // 도우미의 완료는 도우미 화면만 닫고 홈으로 돌아간다.
        // 이용자 화면의 도구는 이용자가 직접 완료를 눌러야 사라지므로
        // 여기서는 세션 전체를 끝내는 'complete' 액션을 보내지 않는다.
        window.location.href = '/waiting/';
    });
}
