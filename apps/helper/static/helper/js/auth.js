/*
 * 로그인/회원가입 폼 -> accounts 앱의 JSON API 호출.
 * 실제 인증 로직은 서버(accounts 앱)에 있으므로 여기서는 폼을 읽어 fetch 로 던지고
 * 결과에 따라 화면을 이동/에러 표시만 한다.
 */
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(loginForm));
    const res = await fetch("/api/accounts/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      window.location.href = "/helper/";
    } else {
      const data = await res.json();
      document.getElementById("login-error").textContent = data.detail || "로그인에 실패했습니다.";
    }
  });
}

const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(signupForm));
    const res = await fetch("/api/accounts/signup/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      window.location.href = "/helper/";
    } else {
      const data = await res.json();
      document.getElementById("signup-error").textContent =
        data.username?.[0] || data.detail || "회원가입에 실패했습니다.";
    }
  });
}
