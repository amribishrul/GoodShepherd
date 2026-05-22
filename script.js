document.addEventListener("DOMContentLoaded", () => {

    /* =================================================================
       1. Canvas Galaxy Background (Magnetic Cursor Particles)
    ================================================================= */
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    const mouse = { x: -1000, y: -1000 };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.baseRadius = Math.random() * 1.5 + 0.5;
            this.radius = this.baseRadius;
            this.color = `rgba(117, 165, 233, ${Math.random() * 0.5 + 0.1})`;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (150 - distance) / 150;

                this.x -= forceDirectionX * force * 2;
                this.y -= forceDirectionY * force * 2;
                this.radius = this.baseRadius * 2;
            } else {
                this.radius = this.baseRadius;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    const particleCount = window.innerWidth > 768 ? 150 : 50;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        particles.forEach((p1, i) => {
            const dxMouse = mouse.x - p1.x;
            const dyMouse = mouse.y - p1.y;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

            if(distMouse < 150) {
                particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 80) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(76, 132, 217, ${1 - dist/80})`;
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
       2. Three.js Holographic Wavy Globe (NOW WITH MOUSE INTERACTION)
    ================================================================= */
    const globeContainer = document.getElementById('globe-container');
    if (globeContainer && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(45, globeContainer.clientWidth / globeContainer.clientHeight, 0.1, 1000);
        camera.position.z = 50;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(globeContainer.clientWidth, globeContainer.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        globeContainer.appendChild(renderer.domElement);

        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // Core Sphere
        const geometry = new THREE.SphereGeometry(15, 64, 64);
        const particlesMat = new THREE.PointsMaterial({
            color: 0x75A5E9,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const spherePoints = new THREE.Points(geometry, particlesMat);
        globeGroup.add(spherePoints);

        // Wireframe Mesh
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x3267C9,
            wireframe: true,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });
        const sphereWire = new THREE.Mesh(geometry, wireMat);
        globeGroup.add(sphereWire);

        // Orbit Rings
        const ringGeo = new THREE.RingGeometry(20, 20.2, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x4C84D9, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 2;
        globeGroup.add(ring1);

        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.rotation.y = Math.PI / 3;
        globeGroup.add(ring2);

        // Store original vertices for animation
        const positionAttribute = geometry.attributes.position;
        const originalPositions = [];
        for (let i = 0; i < positionAttribute.count; i++) {
            originalPositions.push(new THREE.Vector3().fromBufferAttribute(positionAttribute, i));
        }

        // --- NEW: Raycaster & Mouse Tracking ---
        const raycaster = new THREE.Raycaster();
        const threeMouse = new THREE.Vector2(-100, -100);
        let targetDisplacement = 0.3; // Base wave height
        let currentDisplacement = 0.3;
        let targetRotationSpeed = 0.002; // Base spin speed
        let currentRotationSpeed = 0.002;
        let targetTilt = 0.1; // Base tilt
        let currentTilt = 0.1;

        globeContainer.addEventListener('mousemove', (event) => {
            const rect = globeContainer.getBoundingClientRect();
            // Convert mouse position to normalized device coordinates (-1 to +1)
            threeMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            threeMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        });

        globeContainer.addEventListener('mouseleave', () => {
            threeMouse.x = -100; // Move laser off-screen
            threeMouse.y = -100;
        });

        // Handle Resizing
        window.addEventListener('resize', () => {
            if(globeContainer) {
                camera.aspect = globeContainer.clientWidth / globeContainer.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(globeContainer.clientWidth, globeContainer.clientHeight);
            }
        });

        const clock = new THREE.Clock();

        function animateGlobe() {
            requestAnimationFrame(animateGlobe);
            const elapsedTime = clock.getElapsedTime();

            // --- NEW: Check for Mouse Intersections ---
            raycaster.setFromCamera(threeMouse, camera);
            // Check if laser hits the wireframe sphere
            const intersects = raycaster.intersectObject(sphereWire);

            if (intersects.length > 0) {
                // Mouse is hovering over the globe
                targetDisplacement = 1.2; // Intense wave distortion
                targetRotationSpeed = 0.008; // Spin faster
                targetTilt = threeMouse.y * 0.5; // Tilt towards mouse
                globeContainer.style.cursor = 'crosshair'; // Change cursor to look techy
            } else {
                // Mouse is off the globe
                targetDisplacement = 0.3; // Return to calm wave
                targetRotationSpeed = 0.002; // Return to slow spin
                targetTilt = Math.sin(elapsedTime * 0.2) * 0.1; // Return to slow bobbing
                globeContainer.style.cursor = 'default';
            }

            // Smooth easing for transitions
            currentDisplacement += (targetDisplacement - currentDisplacement) * 0.05;
            currentRotationSpeed += (targetRotationSpeed - currentRotationSpeed) * 0.05;
            currentTilt += (targetTilt - currentTilt) * 0.05;

            // Apply Rotations
            globeGroup.rotation.y += currentRotationSpeed;
            globeGroup.rotation.x = currentTilt;

            // Add subtle parallax based on mouse position
            if (intersects.length > 0) {
                globeGroup.rotation.y += threeMouse.x * 0.01;
            }

            // Apply Wavy Vertex Animation
            for (let i = 0; i < positionAttribute.count; i++) {
                const vertex = originalPositions[i];

                const wave1 = Math.sin(vertex.x * 0.2 + elapsedTime * 1.5);
                const wave2 = Math.cos(vertex.y * 0.2 + elapsedTime * 1.5);

                // Use the interactive currentDisplacement variable
                const displacement = (wave1 + wave2) * currentDisplacement;

                const normal = vertex.clone().normalize();
                const newPos = vertex.clone().add(normal.multiplyScalar(displacement));

                positionAttribute.setXYZ(i, newPos.x, newPos.y, newPos.z);
            }
            positionAttribute.needsUpdate = true;

            // Animate rings
            ring1.rotation.z -= 0.005;
            ring2.rotation.z += 0.003;

            renderer.render(scene, camera);
        }

        animateGlobe();
    }

    /* =================================================================
       3. UI Interactions (Scroll Reveal, Magnetic Buttons, 3D Tilt)
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
            if(span) {
                span.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
            }
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