// Scroll Reveal Observer Module
document.addEventListener('DOMContentLoaded', () => {

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
