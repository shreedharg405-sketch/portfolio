// Theme Switcher Module
(function initTheme() {
    const savedTheme = localStorage.getItem('portfolio_theme') || 'dark';
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

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateIcon(currentTheme);

    if (themeSwitchBtn) {
        themeSwitchBtn.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', activeTheme);
            localStorage.setItem('portfolio_theme', activeTheme);
            updateIcon(activeTheme);
        });
    }
});
