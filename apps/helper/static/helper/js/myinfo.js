function showFormError(form, message) {
    let errorEl = form.querySelector('.form-error');
    if (!errorEl) {
        errorEl = document.createElement('p');
        errorEl.className = 'form-error';
        form.querySelector('button[type="submit"]').insertAdjacentElement('beforebegin', errorEl);
    }
    errorEl.textContent = message;
}

const myinfoForm = document.querySelector('#myinfo-form');
if (myinfoForm) {
    myinfoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = myinfoForm.querySelector('button[type="submit"]');
        const formData = new FormData(myinfoForm);

        // 파일을 선택 안 했으면 빈 파일 필드를 보내지 않는다 (서버에서 "빈 파일" 오류 방지)
        const imageInput = myinfoForm.querySelector('#profile_image');
        if (imageInput && imageInput.files.length === 0) {
            formData.delete('profile_image');
        }

        submitBtn.disabled = true;
        try {
            const response = await fetch('/api/accounts/profile/', {
                method: 'PATCH',
                body: formData,
            });

            if (response.ok) {
                window.location.href = myinfoForm.dataset.mypageUrl;
                return;
            }

            const data = await response.json().catch(() => null);
            const message =
                (data && (data.detail || Object.values(data)[0])) || '프로필 수정에 실패했어요.';
            showFormError(myinfoForm, Array.isArray(message) ? message[0] : String(message));
        } catch (err) {
            showFormError(myinfoForm, '네트워크 오류로 프로필 수정에 실패했어요.');
        } finally {
            submitBtn.disabled = false;
        }
    });
}
