const signupBtn = document.querySelector('.btn-signup');
if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        window.location.href = '/signup/';
    });
}

const loginBtn = document.querySelector('.btn-login');
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        window.location.href = '/login/';
    });
}

const storeLink = document.querySelector('.main-storelink');
if (storeLink) {
    storeLink.addEventListener('click', () => {
        window.location.href = '/reservation/';
    });
}

const storesToggle = document.getElementById('storesToggle');
const storesList = document.getElementById('storesList');

if (storesToggle && storesList) {
    storesToggle.addEventListener('click', () => {
        const isOpen = storesList.hidden === false;
        storesList.hidden = isOpen;
        storesToggle.setAttribute('aria-expanded', String(!isOpen));
        storesToggle.classList.toggle('is-open', !isOpen);
    });
}