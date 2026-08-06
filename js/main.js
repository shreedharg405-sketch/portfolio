// Master Public JS Bundle & Loader Controller
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const fill = document.querySelector('.loader-bar-fill');

    if (fill) {
        fill.style.width = '100%';
    }

    const hideLoader = () => {
        if (!loader || loader.classList.contains('loader-fade-out')) return;
        loader.classList.add('loader-fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 700);
    };

    // Hide loader when window completes loading or fallback timer expires
    if (document.readyState === 'complete') {
        setTimeout(hideLoader, 200);
    } else {
        window.addEventListener('load', () => setTimeout(hideLoader, 200));
        // Fallback safety timeout (1.2 seconds max)
        setTimeout(hideLoader, 1200);
    }
});
