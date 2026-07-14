// 뒤로가기 버튼
const backBtn = document.querySelector('.btn-back');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        history.back();
    });
}

// 비밀번호 숨기기
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

// 폼 하단에 에러 메시지 표시 (제출 버튼 바로 위)
function showFormError(form, message) {
    let errorEl = form.querySelector('.form-error');
    if (!errorEl) {
        errorEl = document.createElement('p');
        errorEl.className = 'form-error';
        form.querySelector('button[type="submit"]').insertAdjacentElement('beforebegin', errorEl);
    }
    errorEl.textContent = message;
}

function firstErrorMessage(data) {
    if (!data) return '';
    if (data.detail) return data.detail;
    const firstField = Object.values(data)[0];
    return Array.isArray(firstField) ? firstField[0] : String(firstField || '');
}

// 회원가입: 성공하면 로그인 화면으로 이동
const signupForm = document.querySelector('#signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const formData = new FormData(signupForm);

        submitBtn.disabled = true;
        try {
            const response = await fetch('/api/accounts/signup/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name'),
                    username: formData.get('username'),
                    password: formData.get('password'),
                }),
            });

            if (response.ok) {
                window.location.href = signupForm.dataset.loginUrl;
                return;
            }

            const data = await response.json().catch(() => null);
            showFormError(signupForm, firstErrorMessage(data) || '회원가입에 실패했어요.');
        } catch (err) {
            showFormError(signupForm, '네트워크 오류로 회원가입에 실패했어요.');
        } finally {
            submitBtn.disabled = false;
        }
    });
}

// 로그인: 성공하면 도우미 홈(대기 화면)으로 이동
const loginForm = document.querySelector('#login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const formData = new FormData(loginForm);

        submitBtn.disabled = true;
        try {
            const response = await fetch('/api/accounts/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password'),
                }),
            });

            if (response.ok) {
                window.location.href = loginForm.dataset.homeUrl;
                return;
            }

            const data = await response.json().catch(() => null);
            showFormError(loginForm, firstErrorMessage(data) || '로그인에 실패했어요.');
        } catch (err) {
            showFormError(loginForm, '네트워크 오류로 로그인에 실패했어요.');
        } finally {
            submitBtn.disabled = false;
        }
    });
}
