// Typing Animation Module
document.addEventListener('DOMContentLoaded', () => {
    const typedEl = document.getElementById('typedText');
    if (typedEl) {
        const words = ['Web Developer', 'Embedded Systems Enthusiast', 'Full Stack Developer', 'ECE Student', 'Problem Solver'];
        let wIdx = 0, cIdx = 0, deleting = false;
        (function typeLoop() {
            const word = words[wIdx];
            typedEl.textContent = deleting ? word.substring(0, --cIdx) : word.substring(0, ++cIdx);
            let delay = deleting ? 45 : 85;
            if (!deleting && cIdx === word.length) { delay = 1800; deleting = true; }
            else if (deleting && cIdx === 0) { deleting = false; wIdx = (wIdx + 1) % words.length; delay = 350; }
            setTimeout(typeLoop, delay);
        })();
    }
});
