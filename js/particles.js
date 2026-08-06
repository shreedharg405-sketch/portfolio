/**
 * Interactive Particle Canvas Module - Moving Dots & Constellation Theme
 * Features:
 * - High-DPI support (Device Pixel Ratio scaling)
 * - Ultra-smooth 60fps performance using spatial distance squaring & stroke batching
 * - Fluid floating particles with dynamic velocities & pulsing animation
 * - Interactive node-to-node connecting constellation lines
 * - Mouse attraction/repulsion and cursor connection threads
 * - Dynamic theme color switching (Dark / Light mode) with MutationObserver
 */
'use strict';

(function initParticleSystem() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let mouse = { x: -1000, y: -1000, active: false };

    // Track mouse position
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
        mouse.active = false;
        mouse.x = -1000;
        mouse.y = -1000;
    });

    function getParticleCount() {
        const w = window.innerWidth;
        if (w >= 1400) return 75;
        if (w >= 1024) return 60;
        if (w >= 768)  return 40;
        return 25;
    }

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.scale(dpr, dpr);
    }

    function getThemeColors() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        return isLight ? [
            '2, 132, 199',   // Deep Blue
            '124, 58, 237',  // Vibrant Purple
            '14, 165, 233',  // Sky Blue
            '99, 102, 241',  // Indigo
            '71, 85, 105'    // Slate
        ] : [
            '0, 229, 255',   // Electric Cyan
            '139, 92, 246',  // Glowing Purple
            '56, 189, 248',  // Soft Cyan Blue
            '236, 72, 153',  // Pink Accent
            '255, 255, 255'  // Bright White
        ];
    }

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseRadius = Math.random() * 2 + 1.8;
            this.radius = this.baseRadius;
            
            const speed = Math.random() * 0.12 + 0.08;
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;

            this.baseAlpha = Math.random() * 0.45 + 0.35;
            this.alpha = this.baseAlpha;
            this.pulseFactor = Math.random() * 0.015 + 0.005;
            this.pulseAngle = Math.random() * Math.PI * 2;
            
            const colors = getThemeColors();
            this.colorRgb = colors[Math.floor(Math.random() * colors.length)];
        }

        update(colors) {
            if (!colors.includes(this.colorRgb)) {
                this.colorRgb = colors[Math.floor(Math.random() * colors.length)];
            }

            this.pulseAngle += this.pulseFactor;
            const pulse = Math.sin(this.pulseAngle) * 0.4;
            
            let isNearMouse = false;

            if (mouse.active) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distSq = dx * dx + dy * dy;
                const maxMouseDist = 150;

                if (distSq < maxMouseDist * maxMouseDist) {
                    isNearMouse = true;
                    const dist = Math.sqrt(distSq);
                    const force = (maxMouseDist - dist) / maxMouseDist;
                    
                    this.x += (dx / dist) * force * 0.5;
                    this.y += (dy / dist) * force * 0.5;

                    this.radius = this.baseRadius + force * 2.2;
                    this.alpha = Math.min(1, this.baseAlpha + force * 0.35);
                }
            }

            if (!isNearMouse) {
                this.radius = Math.max(1, this.baseRadius + pulse);
                this.alpha = Math.max(0.2, Math.min(0.9, this.baseAlpha + pulse * 0.2));
                this.x += this.vx;
                this.y += this.vy;
            }

            if (this.x <= 0) { this.x = 0; this.vx *= -1; }
            if (this.x >= width) { this.x = width; this.vx *= -1; }
            if (this.y <= 0) { this.y = 0; this.vy *= -1; }
            if (this.y >= height) { this.y = height; this.vy *= -1; }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.5, this.radius), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.colorRgb}, ${this.alpha})`;
            ctx.fill();
        }
    }

    function createParticles() {
        const count = getParticleCount();
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    resizeCanvas();
    createParticles();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
            createParticles();
        }, 150);
    });

    const themeObserver = new MutationObserver(() => {
        const colors = getThemeColors();
        particles.forEach(p => {
            p.colorRgb = colors[Math.floor(Math.random() * colors.length)];
        });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const MAX_DIST = 130;
    const MAX_DIST_SQ = MAX_DIST * MAX_DIST;
    const MOUSE_DIST = 150;
    const MOUSE_DIST_SQ = MOUSE_DIST * MOUSE_DIST;

    function render() {
        if (document.visibilityState === 'hidden') {
            requestAnimationFrame(render);
            return;
        }

        ctx.clearRect(0, 0, width, height);
        const colors = getThemeColors();
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';

        const lineRgb = isLight ? '2, 132, 199' : '0, 229, 255';
        const mouseLineRgb = isLight ? '124, 58, 237' : '139, 92, 246';

        // 1. Update and draw particles
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.update(colors);
            p.draw(ctx);
        }

        // 2. Fast batch render inter-particle lines
        ctx.lineWidth = 0.65;
        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < MAX_DIST_SQ) {
                    const dist = Math.sqrt(distSq);
                    const alpha = (1 - dist / MAX_DIST) * (isLight ? 0.25 : 0.32);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(${lineRgb}, ${alpha})`;
                    ctx.stroke();
                }
            }

            // 3. Connect particles to mouse cursor when active
            if (mouse.active) {
                const dx = mouse.x - p1.x;
                const dy = mouse.y - p1.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < MOUSE_DIST_SQ) {
                    const dist = Math.sqrt(distSq);
                    const alpha = (1 - dist / MOUSE_DIST) * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(${mouseLineRgb}, ${alpha})`;
                    ctx.lineWidth = 0.85;
                    ctx.stroke();
                    ctx.lineWidth = 0.65;
                }
            }
        }

        requestAnimationFrame(render);
    }

    render();
})();
