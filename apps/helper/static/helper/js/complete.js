const confirmBtn = document.querySelector('.btn-confirm');
if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
}