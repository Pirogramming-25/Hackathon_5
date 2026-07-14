const acceptBtn = document.querySelector('.btn-accept');
if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
        // 지금은 임시로 1
        window.location.href = '/session/1/';
    });
}

const rejectBtn = document.querySelector('.btn-reject');
if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
}