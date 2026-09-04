// Theme Switcher Module
(function initTheme() {
    // Ensure initial/default behavior opens in Light Mode even if stale dark theme was stored in localStorage
    if (!sessionStorage.getItem('theme_toggled_session')) {
        localStorage.setItem('portfolio_theme', 'light');
    }
    const savedTheme = localStorage.getItem('portfolio_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitchBtn = document.getElementById('themeSwitchBtn');
    const themeIcon      = document.getElementById('themeIcon');

    function updateIcon(theme) {
        if (themeIcon) {
            themeIcon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateIcon(currentTheme);

    if (themeSwitchBtn) {
        themeSwitchBtn.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', activeTheme);
            localStorage.setItem('portfolio_theme', activeTheme);
            sessionStorage.setItem('theme_toggled_session', 'true');
            updateIcon(activeTheme);
        });
    }
});
