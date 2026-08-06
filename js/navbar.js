// Navbar & Scroll Progress Module
document.addEventListener('DOMContentLoaded', () => {
    const progressBar = document.getElementById('scrollProgress');
    const header      = document.getElementById('header');
    const navLinks    = document.querySelectorAll('.nav-link');
    const allSecs     = document.querySelectorAll('section[id]');
    const backToTop   = document.getElementById('backToTop');
    const hamburger   = document.getElementById('hamburger');
    const mobileOverlay = document.getElementById('mobileNavOverlay');

    window.addEventListener('scroll', () => {
        const top   = document.documentElement.scrollTop;
        const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (progressBar) progressBar.style.width = (top / total * 100) + '%';
        if (header) header.classList.toggle('scrolled', window.scrollY > 50);

        let active = '';
        allSecs.forEach(sec => { if (window.scrollY >= sec.offsetTop - 150) active = sec.id; });
        navLinks.forEach(lnk => lnk.classList.toggle('active', lnk.getAttribute('href').includes('#' + active)));
        if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    if (hamburger && mobileOverlay) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileOverlay.classList.toggle('open');
            document.body.classList.toggle('no-scroll');
        });
        document.querySelectorAll('.mobile-nav-link').forEach(lnk => lnk.addEventListener('click', () => {
            hamburger.classList.remove('open');
            mobileOverlay.classList.remove('open');
            document.body.classList.remove('no-scroll');
        }));
    }

    if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
});
