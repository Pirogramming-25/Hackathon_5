const toolItems = document.querySelectorAll('.tool-item');

toolItems.forEach((item) => {
    item.addEventListener('click', () => {
        
        toolItems.forEach((el) => el.classList.remove('active'));
        
        item.classList.add('active');

        const toolType = item.dataset.tool;
        console.log('선택된 도구:', toolType);

        
    });
});

const pathParts = window.location.pathname
    .split('/')
    .filter(Boolean);

const requestId = pathParts[pathParts.length - 1];

const protocol =
    window.location.protocol === 'https:' ? 'wss' : 'ws';

const sessionSocket = new WebSocket(
    `${protocol}://${window.location.host}/ws/session/${requestId}/`
);

sessionSocket.onopen = () => {
    console.log('도움 세션 웹소켓 연결 성공');
};

sessionSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (
        data.type === 'session_message' &&
        data.payload.action === 'cancelled'
    ) {
        alert('이용자가 도움을 종료했습니다.');
        window.location.href = '/';
    }

    if (
        data.type === 'session_message' &&
        data.payload.action === 'completed'
    ) {
        alert('도움이 완료되었습니다.');
        window.location.href = '/';
    }
};

const completeBtn = document.querySelector('.btn-complete');

if (completeBtn) {
    completeBtn.addEventListener('click', () => {
        if (sessionSocket.readyState !== WebSocket.OPEN) {
            alert('서버 연결 중입니다. 잠시 후 다시 눌러주세요.');
            return;
        }

        sessionSocket.send(
            JSON.stringify({
                action: 'complete',
            })
        );
    });
}