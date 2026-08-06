// Scroll Reveal Observer & Magnetic Hover Module
document.addEventListener('DOMContentLoaded', () => {
    // Magnetic Hover Elements
    const magneticElements = document.querySelectorAll('.btn, .social-icon, .project-card, .cert-card');
    magneticElements.forEach(el => {
        el.classList.add('magnetic-item');
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0px, 0px)';
        });
    });

    // Scroll Reveal Observer
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .skill-card, .project-card, .cert-card, .timeline-item, .info-card, .stat-card, .contact-item').forEach(el => revealObs.observe(el));

    const skillsSec = document.getElementById('skills');
    if (skillsSec) {
        new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                document.querySelectorAll('.skill-bar-fill').forEach(bar => {
                    bar.style.width = (bar.dataset.width || '0') + '%';
                });
            }
        }, { threshold: 0.15 }).observe(skillsSec);
    }
});
