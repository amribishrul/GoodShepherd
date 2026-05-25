document.addEventListener("DOMContentLoaded", () => {

    /* =================================================================
       1. Custom Robotics Cursor & Canvas Tracking Setup
    ================================================================= */
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const mouse = { x: -1000, y: -1000 };

    // Custom Cursor Elements
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
        // Track for the canvas particles and 3D Robot
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        // Update custom targeting reticle positions
        if (cursorDot && cursorRing) {
            cursorDot.style.left = `${e.clientX}px`;
            cursorDot.style.top = `${e.clientY}px`;

            // The ring uses CSS transitions to smoothly trail slightly behind
            cursorRing.style.left = `${e.clientX}px`;
            cursorRing.style.top = `${e.clientY}px`;
        }
    });

    // Add "Target Locked" effect when hovering over interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .magnetic-btn, .tilt-card, .gallery-block');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            if(cursorRing) cursorRing.classList.add('hover-locked');
        });
        el.addEventListener('mouseleave', () => {
            if(cursorRing) cursorRing.classList.remove('hover-locked');
        });
    });

    /* =================================================================
       2. Canvas Background (Purple/Blue/Silver Circuit Nodes)
    ================================================================= */
    // Theme Colors based on Logo (Purple, Royal Blue, Silver)
    const particleColors = [
        'rgba(142, 45, 226, 0.5)',  // Violet
        'rgba(67, 97, 238, 0.4)',   // Blue
        'rgba(224, 228, 236, 0.3)'  // Silver
    ];

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            // Snappy, rigid movement for a "circuit" feel
            this.vx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.3 + 0.1);
            this.vy = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.3 + 0.1);
            this.radius = Math.random() * 1.5 + 0.5;
            this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            // Square particles to look like micro-components
            ctx.rect(this.x, this.y, this.radius * 2, this.radius * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    const particleCount = window.innerWidth > 768 ? 120 : 40;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Draw structural connecting lines (like traces on a PCB)
        particles.forEach((p1, i) => {
            const dxMouse = mouse.x - p1.x;
            const dyMouse = mouse.y - p1.y;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

            if(distMouse < 200) {
                particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        // Draw angled lines for circuit board aesthetics
                        ctx.lineTo(p1.x, p2.y);
                        ctx.lineTo(p2.x, p2.y);
                        // Deep purple/blue tinted lines
                        ctx.strokeStyle = `rgba(142, 45, 226, ${0.4 - dist/250})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            }
        });

        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    /* =================================================================
       3. Three.js GLTF Robot Head (Cinematic Studio Setup)
    ================================================================= */
    const container = document.getElementById('3d-container');
    if (container && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();

        // Safely get dimensions to prevent NaN errors before CSS paints
        let initWidth = container.clientWidth || (window.innerWidth > 768 ? window.innerWidth / 2 : window.innerWidth);
        let initHeight = container.clientHeight || window.innerHeight * 0.8;

        const camera = new THREE.PerspectiveCamera(45, initWidth / initHeight, 0.1, 1000);
        camera.position.z = 40;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(initWidth, initHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // --- Cinematic Studio Lighting ---
        // 1. Low Ambient Light for deep, high-contrast shadows
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
        scene.add(ambientLight);

        // 2. Key Rim Light (Vibrant Violet from the top-back-right)
        const rimLight = new THREE.DirectionalLight(0x8e2de2, 3.5);
        rimLight.position.set(15, 20, -10);
        scene.add(rimLight);

        // 3. Fill Light (Royal Blue from the front-left)
        const fillLight = new THREE.DirectionalLight(0x113886, 2.5);
        fillLight.position.set(-15, 0, 15);
        scene.add(fillLight);

        // 4. Subtle Front Light (Soft tech blue to illuminate the visor/face)
        const frontLight = new THREE.PointLight(0x4C84D9, 1.2, 50);
        frontLight.position.set(0, 5, 20);
        scene.add(frontLight);

        // Main grouping mechanism
        const robotGroup = new THREE.Group();
        scene.add(robotGroup);

        // --- Load External GLB Model ---
        const loader = new THREE.GLTFLoader();

        loader.load(
            'robot_head.glb',
            function (gltf) {
                const model = gltf.scene;

                // Made smaller and moved downwards based on the previous adjustments
                model.scale.set(55, 55, 55);
                model.position.set(0, -10, 0);

                // Premium Editorial Finish: High metalness, moderate roughness for matte highlights
                model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.metalness = 0.75;
                        child.material.roughness = 0.55;
                    }
                });

                robotGroup.add(model);
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('An error happened while loading the 3D model:', error);
            }
        );

        // Interactive Mouse Tracking Logic for Robot Head
        const mouse3D = new THREE.Vector2(0, 0);
        const targetVector = new THREE.Vector3(0, 0, 40);

        container.addEventListener('mousemove', (event) => {
            const rect = container.getBoundingClientRect();
            mouse3D.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse3D.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            targetVector.set(mouse3D.x * 20, mouse3D.y * 20, 40);
        });

        container.addEventListener('mouseleave', () => {
            targetVector.set(0, 0, 40);
        });

        window.addEventListener('resize', () => {
            if(container) {
                let newWidth = container.clientWidth || (window.innerWidth > 768 ? window.innerWidth / 2 : window.innerWidth);
                let newHeight = container.clientHeight || window.innerHeight * 0.8;
                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
            }
        });

        setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 100);

        const clock = new THREE.Clock();
        const dummyObject = new THREE.Object3D();

        function animateRobot() {
            requestAnimationFrame(animateRobot);
            const time = clock.getElapsedTime();

            // Smoothly rotate to look at cursor
            dummyObject.position.copy(robotGroup.position);
            dummyObject.lookAt(targetVector);
            robotGroup.quaternion.slerp(dummyObject.quaternion, 0.05);

            // Idle floating animation
            robotGroup.position.y = Math.sin(time * 1.5) * 1.5;

            renderer.render(scene, camera);
        }
        animateRobot();
    }

    /* =================================================================
       4. UI Interactions (Scroll Reveal, Magnetic Buttons, 3D Tilt)
    ================================================================= */

    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -100px 0px", threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));

    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            const span = btn.querySelector('span');
            if(span) span.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = `translate(0px, 0px)`;
            const span = btn.querySelector('span');
            if(span) span.style.transform = `translate(0px, 0px)`;
        });
    });

    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });
});