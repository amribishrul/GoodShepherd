// --- 1. Interactive Digital Network Canvas ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let mouse = { x: null, y: null, radius: 120 };

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initParticles(); // Re-initialize on resize for even distribution
}
window.addEventListener('resize', resizeCanvas);

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});
window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseX = this.x;
        this.baseY = this.y;
        this.size = Math.random() * 2 + 1; // Small squares
        this.density = (Math.random() * 20) + 5;
    }

    draw() {
        ctx.fillStyle = 'rgba(76, 132, 217, 0.6)'; // Soft tech blue
        // Draw squares instead of circles to match the digital data vibe
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    update() {
        // Calculate distance from mouse
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Elastic return forces
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {
            // Scatter effect: push particles away
            this.x -= directionX;
            this.y -= directionY;
        } else {
            // Spring effect: return to base position smoothly
            if (this.x !== this.baseX) {
                let dxBase = this.x - this.baseX;
                this.x -= dxBase / 20;
            }
            if (this.y !== this.baseY) {
                let dyBase = this.y - this.baseY;
                this.y -= dyBase / 20;
            }
        }
    }
}

function initParticles() {
    particles = [];
    // Higher density for the "data cloud" look
    let numberOfParticles = (width * height) / 4000;
    for (let i = 0; i < numberOfParticles; i++) {
        let x = Math.random() * width;
        let y = Math.random() * height;
        particles.push(new Particle(x, y));
    }
}

function connectParticles() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
            let dx = particles[a].x - particles[b].x;
            let dy = particles[a].y - particles[b].y;
            let distance = dx * dx + dy * dy;

            // Only draw lines if particles are close to each other
            if (distance < 3500) {
                // AND only draw them if they are relatively close to the mouse (creates a "flashlight" focus effect)
                let mouseDx = mouse.x - particles[a].x;
                let mouseDy = mouse.y - particles[a].y;
                let mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

                if (mouseDistance < mouse.radius * 1.5) {
                    let opacityValue = 1 - (distance / 3500);
                    ctx.strokeStyle = `rgba(117, 165, 233, ${opacityValue * 0.4})`; // Light accent blue
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    connectParticles();
    requestAnimationFrame(animateParticles);
}

resizeCanvas();
animateParticles();


// --- 2. Three.js Orbital Galaxy (Hero Right Side) ---
const threeContainer = document.getElementById('hero-3d-container');

if (threeContainer && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
    camera.position.z = 50;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    threeContainer.appendChild(renderer.domElement);

    // Create Particle Galaxy System
    const particleCount = 4000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for(let i = 0; i < particleCount; i++) {
        // Create an orbital torus/sphere shape
        const r = 25 + Math.random() * 15;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);

        // Slightly squash the sphere into a galaxy shape
        positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i*3+1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.3; // flattened Y
        positions[i*3+2] = r * Math.cos(phi);

        sizes[i] = Math.random() * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        color: 0x4C84D9,
        size: 0.3,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const starSphere = new THREE.Points(geometry, material);
    scene.add(starSphere);

    // Resize handler for Three.js
    window.addEventListener('resize', () => {
        if(threeContainer) {
            camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
        }
    });

    // Animation Loop for Three.js
    let clock = new THREE.Clock();
    function animateThree() {
        requestAnimationFrame(animateThree);
        const elapsedTime = clock.getElapsedTime();

        // Gentle rotation
        starSphere.rotation.y = elapsedTime * 0.05;
        starSphere.rotation.x = Math.sin(elapsedTime * 0.2) * 0.1;
        starSphere.rotation.z = Math.cos(elapsedTime * 0.1) * 0.1;

        renderer.render(scene, camera);
    }
    animateThree();
}

// --- 3. Magnetic UI Elements ---
const magneticEls = document.querySelectorAll('.magnetic');

magneticEls.forEach((el) => {
    el.addEventListener('mousemove', function(e) {
        const position = el.getBoundingClientRect();
        const x = e.clientX - position.left - position.width / 2;
        const y = e.clientY - position.top - position.height / 2;

        // Move slightly towards cursor
        el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    el.addEventListener('mouseleave', function() {
        el.style.transform = 'translate(0px, 0px)';
        el.style.transition = 'transform 0.5s ease';
    });

    el.addEventListener('mouseenter', function() {
        el.style.transition = 'none'; // Remove transition for instant magnetic snap
    });
});

// --- 4. 3D Tilt Effect on Cards ---
const tiltCards = document.querySelectorAll('.tilt-card');

tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5; // Max 5 deg rotation
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = 'none';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.transition = 'transform 0.5s ease';
    });
});

// --- 5. Scroll Reveal Animations (Intersection Observer) ---
const revealElements = document.querySelectorAll('.reveal');

const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        } else {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, revealOptions);

revealElements.forEach(el => {
    revealOnScroll.observe(el);
});