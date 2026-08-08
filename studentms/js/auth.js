/* ==========================================================================
   STUDENT MANAGEMENT SYSTEM - PORTAL AUTHENTICATION HANDLERS (js/auth.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    const toggleLoginPass = document.getElementById('toggle-login-pass');
    const toggleSignupPass = document.getElementById('toggle-signup-pass');
    const loginPassInput = document.getElementById('login-password');
    const signupPassInput = document.getElementById('signup-password');

    // Tab buttons (redirects instead of toggling style displays)
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const linkToSignup = document.getElementById('link-to-signup');
    const linkToLogin = document.getElementById('link-to-login');

    if (tabLogin) {
        tabLogin.addEventListener('click', () => window.location.href = 'login.html');
    }
    if (tabSignup) {
        tabSignup.addEventListener('click', () => window.location.href = 'signup.html');
    }
    if (linkToSignup) {
        linkToSignup.addEventListener('click', () => window.location.href = 'signup.html');
    }
    if (linkToLogin) {
        linkToLogin.addEventListener('click', () => window.location.href = 'login.html');
    }

    // Toggle password string visibility
    if (toggleLoginPass && loginPassInput) {
        toggleLoginPass.addEventListener('click', () => {
            const type = loginPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassInput.setAttribute('type', type);
            toggleLoginPass.querySelector('i').className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        });
    }

    if (toggleSignupPass && signupPassInput) {
        toggleSignupPass.addEventListener('click', () => {
            const type = signupPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            signupPassInput.setAttribute('type', type);
            toggleSignupPass.querySelector('i').className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        });
    }

    // Errors decoration helpers
    function setError(fieldGroup, errorEl, msg) {
        if (fieldGroup) fieldGroup.classList.add('has-error');
        if (errorEl) errorEl.textContent = msg;
        return false;
    }

    function clearError(fieldGroup, errorEl) {
        if (fieldGroup) fieldGroup.classList.remove('has-error');
        if (errorEl) errorEl.textContent = '';
    }

    // Submit Log In Form
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailVal = document.getElementById('login-email').value.trim();
            const passVal = loginPassInput.value;
            const emailGroup = document.getElementById('login-email-group');
            const passGroup = document.getElementById('login-password-group');
            const emailError = document.getElementById('login-email-error');
            const passError = document.getElementById('login-password-error');

            let isValid = true;
            if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
                isValid = setError(emailGroup, emailError, "Enter a valid email address.");
            } else {
                clearError(emailGroup, emailError);
            }

            if (!passVal || passVal.length < 4) {
                isValid = setError(passGroup, passError, "Password must be at least 4 characters.");
            } else {
                clearError(passGroup, passError);
            }

            if (!isValid) return;

            showLoading("Signing in...");
            fetch('../php/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailVal, password: passVal })
            })
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.status === 'success') {
                    showToast('Successfully signed in.');
                    window.location.href = 'dashboard.html';
                } else {
                    showToast(data.message, 'error');
                    setError(passGroup, passError, data.message);
                }
            })
            .catch(err => {
                hideLoading();
                showToast("Connection to login server failed.", "error");
                console.error(err);
            });
        });
    }

    // Submit Sign Up Form
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameVal = document.getElementById('signup-name').value.trim();
            const emailVal = document.getElementById('signup-email').value.trim();
            const passVal = signupPassInput.value;

            const nameGroup = document.getElementById('signup-name-group');
            const emailGroup = document.getElementById('signup-email-group');
            const passGroup = document.getElementById('signup-password-group');

            const nameError = document.getElementById('signup-name-error');
            const emailError = document.getElementById('signup-email-error');
            const passError = document.getElementById('signup-password-error');

            let isValid = true;
            if (nameVal.length < 2) {
                isValid = setError(nameGroup, nameError, "Name must be at least 2 characters.");
            } else {
                clearError(nameGroup, nameError);
            }

            if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
                isValid = setError(emailGroup, emailError, "Enter a valid email address.");
            } else {
                clearError(emailGroup, emailError);
            }

            if (passVal.length < 4) {
                isValid = setError(passGroup, passError, "Password must be at least 4 characters.");
            } else {
                clearError(passGroup, passError);
            }

            if (!isValid) return;

            showLoading("Registering account...");
            fetch('../php/signup.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameVal, email: emailVal, password: passVal })
            })
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.status === 'success') {
                    showToast('Admin registration successful! Log in to continue.');
                    signupForm.reset();
                    window.location.href = 'login.html';
                } else {
                    showToast(data.message, 'error');
                    setError(emailGroup, emailError, data.message);
                }
            })
            .catch(err => {
                hideLoading();
                showToast("Connection to signup server failed.", "error");
                console.error(err);
            });
        });
    }
});
