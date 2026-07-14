// 뒤로가기 버튼
const backBtn = document.querySelector('.btn-back');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        history.back();
    });
}


const toggleBtn = document.querySelector('.btn-toggle-password');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const passwordInput = document.querySelector('#password');
        if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        } else {
        passwordInput.type = 'password';
        }
    });
}

