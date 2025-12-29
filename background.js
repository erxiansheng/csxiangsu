// 背景动画和音乐模块

// ==================== 3D风格绚丽背景动画 ====================
class PixelBackground {
    constructor() {
        this.canvas = document.getElementById('pixel-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.time = 0;
        this.lastTime = 0;
        this.running = true;
        
        // 3D透视参数
        this.fov = 500;
        this.centerX = 0;
        this.centerY = 0;
        
        // 粒子系统
        this.stars = [];
        this.gridLines = [];
        this.floatingCubes = [];
        this.lasers = [];
        this.explosions = [];
        this.energyRings = [];
        this.crosshairs = [];
        
        // 颜色主题
        this.colors = {
            neon: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff6600', '#ff0066'],
            ct: ['#4a9eff', '#00ccff', '#0088ff'],
            t: ['#ff6600', '#ff9900', '#ffcc00'],
            explosion: ['#ff0000', '#ff6600', '#ffff00', '#ffffff']
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.init();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    init() {
        // 创建3D星空
        for (let i = 0; i < 300; i++) {
            this.stars.push({
                x: (Math.random() - 0.5) * 2000,
                y: (Math.random() - 0.5) * 2000,
                z: Math.random() * 2000,
                size: Math.random() * 2 + 0.5,
                color: this.colors.neon[Math.floor(Math.random() * this.colors.neon.length)],
                speed: Math.random() * 2 + 1
            });
        }
        
        // 创建网格线（地面效果）
        for (let i = 0; i < 30; i++) {
            this.gridLines.push({ z: i * 100, alpha: 1 });
        }
        
        // 创建浮动3D立方体
        for (let i = 0; i < 8; i++) {
            this.createFloatingCube();
        }
        
        // 创建能量环
        for (let i = 0; i < 3; i++) {
            this.createEnergyRing();
        }
        
        // 创建准星装饰
        for (let i = 0; i < 5; i++) {
            this.crosshairs.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 20 + Math.random() * 30,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.02,
                alpha: 0.3 + Math.random() * 0.3,
                color: this.colors.neon[Math.floor(Math.random() * this.colors.neon.length)]
            });
        }
    }
    
    createFloatingCube() {
        this.floatingCubes.push({
            x: (Math.random() - 0.5) * 800,
            y: (Math.random() - 0.5) * 400,
            z: 200 + Math.random() * 600,
            size: 20 + Math.random() * 40,
            rotX: Math.random() * Math.PI * 2,
            rotY: Math.random() * Math.PI * 2,
            rotZ: Math.random() * Math.PI * 2,
            rotSpeedX: (Math.random() - 0.5) * 0.02,
            rotSpeedY: (Math.random() - 0.5) * 0.02,
            rotSpeedZ: (Math.random() - 0.5) * 0.02,
            color: Math.random() > 0.5 ? this.colors.ct[0] : this.colors.t[0],
            wireframe: Math.random() > 0.3
        });
    }
    
    createEnergyRing() {
        this.energyRings.push({
            x: this.centerX + (Math.random() - 0.5) * 400,
            y: this.centerY + (Math.random() - 0.5) * 200,
            radius: 50 + Math.random() * 100,
            maxRadius: 150 + Math.random() * 100,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.03,
            color: this.colors.neon[Math.floor(Math.random() * this.colors.neon.length)],
            pulsePhase: Math.random() * Math.PI * 2
        });
    }
    
    createLaser() {
        const isHorizontal = Math.random() > 0.5;
        this.lasers.push({
            x: isHorizontal ? -100 : Math.random() * this.canvas.width,
            y: isHorizontal ? Math.random() * this.canvas.height : -100,
            length: 100 + Math.random() * 200,
            speed: 8 + Math.random() * 8,
            horizontal: isHorizontal,
            color: this.colors.neon[Math.floor(Math.random() * this.colors.neon.length)],
            width: 2 + Math.random() * 3
        });
    }
    
    createExplosion(x, y) {
        const particles = [];
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            particles.push({
                x: 0, y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                life: 1
            });
        }
        this.explosions.push({ x, y, particles, time: 0 });
    }
    
    project(x, y, z) {
        const scale = this.fov / (this.fov + z);
        return { x: this.centerX + x * scale, y: this.centerY + y * scale, scale };
    }
    
    drawCube(cube) {
        const s = cube.size / 2;
        const vertices = [
            [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
            [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
        ];
        
        const rotated = vertices.map(v => {
            let [x, y, z] = v;
            let y1 = y * Math.cos(cube.rotX) - z * Math.sin(cube.rotX);
            let z1 = y * Math.sin(cube.rotX) + z * Math.cos(cube.rotX);
            let x2 = x * Math.cos(cube.rotY) + z1 * Math.sin(cube.rotY);
            let z2 = -x * Math.sin(cube.rotY) + z1 * Math.cos(cube.rotY);
            let x3 = x2 * Math.cos(cube.rotZ) - y1 * Math.sin(cube.rotZ);
            let y3 = x2 * Math.sin(cube.rotZ) + y1 * Math.cos(cube.rotZ);
            return [x3 + cube.x, y3 + cube.y, z2 + cube.z];
        });
        
        const projected = rotated.map(v => this.project(v[0], v[1], v[2]));
        const edges = [[0,1], [1,2], [2,3], [3,0], [4,5], [5,6], [6,7], [7,4], [0,4], [1,5], [2,6], [3,7]];
        
        this.ctx.strokeStyle = cube.color;
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = cube.color;
        this.ctx.shadowBlur = 10;
        
        edges.forEach(([i, j]) => {
            this.ctx.beginPath();
            this.ctx.moveTo(projected[i].x, projected[i].y);
            this.ctx.lineTo(projected[j].x, projected[j].y);
            this.ctx.stroke();
        });
        
        if (!cube.wireframe) {
            const faces = [[0,1,2,3], [4,5,6,7], [0,1,5,4], [2,3,7,6], [0,3,7,4], [1,2,6,5]];
            this.ctx.fillStyle = cube.color + '20';
            faces.forEach(face => {
                this.ctx.beginPath();
                this.ctx.moveTo(projected[face[0]].x, projected[face[0]].y);
                for (let i = 1; i < face.length; i++) {
                    this.ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
                }
                this.ctx.closePath();
                this.ctx.fill();
            });
        }
        this.ctx.shadowBlur = 0;
    }
    
    drawEnergyRing(ring) {
        const pulse = Math.sin(ring.pulsePhase) * 0.3 + 0.7;
        this.ctx.save();
        this.ctx.translate(ring.x, ring.y);
        this.ctx.rotate(ring.rotation);
        this.ctx.strokeStyle = ring.color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = ring.color;
        this.ctx.shadowBlur = 20;
        this.ctx.globalAlpha = pulse * 0.8;
        
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, ring.radius, ring.radius * 0.3, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, ring.radius * 0.7, ring.radius * 0.2, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.time * 0.02;
            const px = Math.cos(angle) * ring.radius;
            const py = Math.sin(angle) * ring.radius * 0.3;
            this.ctx.fillStyle = ring.color;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    drawCrosshair(ch) {
        this.ctx.save();
        this.ctx.translate(ch.x, ch.y);
        this.ctx.rotate(ch.rotation);
        this.ctx.strokeStyle = ch.color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = ch.alpha;
        this.ctx.shadowColor = ch.color;
        this.ctx.shadowBlur = 10;
        
        const s = ch.size;
        this.ctx.beginPath();
        this.ctx.moveTo(-s, 0); this.ctx.lineTo(-s/3, 0);
        this.ctx.moveTo(s/3, 0); this.ctx.lineTo(s, 0);
        this.ctx.moveTo(0, -s); this.ctx.lineTo(0, -s/3);
        this.ctx.moveTo(0, s/3); this.ctx.lineTo(0, s);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-s*0.7, -s*0.7); this.ctx.lineTo(-s*0.5, -s*0.7); this.ctx.lineTo(-s*0.5, -s*0.5);
        this.ctx.moveTo(s*0.7, -s*0.7); this.ctx.lineTo(s*0.5, -s*0.7); this.ctx.lineTo(s*0.5, -s*0.5);
        this.ctx.moveTo(-s*0.7, s*0.7); this.ctx.lineTo(-s*0.5, s*0.7); this.ctx.lineTo(-s*0.5, s*0.5);
        this.ctx.moveTo(s*0.7, s*0.7); this.ctx.lineTo(s*0.5, s*0.7); this.ctx.lineTo(s*0.5, s*0.5);
        this.ctx.stroke();
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    update(deltaTime) {
        this.time += deltaTime * 0.01;
        
        this.stars.forEach(star => {
            star.z -= star.speed * 2;
            if (star.z < 1) {
                star.z = 2000;
                star.x = (Math.random() - 0.5) * 2000;
                star.y = (Math.random() - 0.5) * 2000;
            }
        });
        
        this.gridLines.forEach(line => {
            line.z -= 3;
            if (line.z < 0) line.z = 3000;
        });
        
        this.floatingCubes.forEach((cube, index) => {
            cube.rotX += cube.rotSpeedX;
            cube.rotY += cube.rotSpeedY;
            cube.rotZ += cube.rotSpeedZ;
            cube.z -= 1;
            cube.y += Math.sin(this.time + index) * 0.5;
            if (cube.z < 50) {
                cube.z = 800;
                cube.x = (Math.random() - 0.5) * 800;
                cube.y = (Math.random() - 0.5) * 400;
            }
        });
        
        this.energyRings.forEach(ring => {
            ring.rotation += ring.rotSpeed;
            ring.pulsePhase += 0.05;
            ring.radius = ring.maxRadius * 0.5 + Math.sin(ring.pulsePhase) * ring.maxRadius * 0.2;
        });
        
        this.crosshairs.forEach(ch => {
            ch.rotation += ch.rotSpeed;
            ch.alpha = 0.3 + Math.sin(this.time * 2 + ch.rotation) * 0.2;
        });
        
        if (Math.random() < 0.02) this.createLaser();
        
        this.lasers.forEach((laser, index) => {
            if (laser.horizontal) {
                laser.x += laser.speed;
                if (laser.x > this.canvas.width + laser.length) this.lasers.splice(index, 1);
            } else {
                laser.y += laser.speed;
                if (laser.y > this.canvas.height + laser.length) this.lasers.splice(index, 1);
            }
        });
        
        if (Math.random() < 0.005) {
            this.createExplosion(Math.random() * this.canvas.width, Math.random() * this.canvas.height);
        }
        
        this.explosions.forEach((exp, index) => {
            exp.time += 0.02;
            exp.particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                p.vx *= 0.98; p.vy *= 0.98;
                p.life -= 0.02;
            });
            if (exp.time > 1) this.explosions.splice(index, 1);
        });
    }

    
    draw() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, Math.max(this.canvas.width, this.canvas.height)
        );
        gradient.addColorStop(0, '#1a0a2e');
        gradient.addColorStop(0.5, '#0d0d1a');
        gradient.addColorStop(1, '#000008');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#00ffff20';
        this.ctx.lineWidth = 1;
        this.gridLines.forEach(line => {
            if (line.z > 0) {
                const p1 = this.project(-1500, 300, line.z);
                const p2 = this.project(1500, 300, line.z);
                const alpha = Math.max(0, 1 - line.z / 3000);
                this.ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
            }
        });
        
        for (let i = -10; i <= 10; i++) {
            const x = i * 150;
            const p1 = this.project(x, 300, 100);
            const p2 = this.project(x, 300, 3000);
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }
        
        this.stars.forEach(star => {
            const p = this.project(star.x, star.y, star.z);
            if (p.x > 0 && p.x < this.canvas.width && p.y > 0 && p.y < this.canvas.height) {
                const size = star.size * p.scale * 3;
                const alpha = Math.min(1, (2000 - star.z) / 1000);
                this.ctx.fillStyle = star.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.shadowColor = star.color;
                this.ctx.shadowBlur = size * 2;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                if (star.speed > 2) {
                    this.ctx.globalAlpha = alpha * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    const tailP = this.project(star.x, star.y, star.z + 50);
                    this.ctx.lineTo(tailP.x, tailP.y);
                    this.ctx.strokeStyle = star.color;
                    this.ctx.lineWidth = size * 0.5;
                    this.ctx.stroke();
                }
            }
        });
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        
        this.energyRings.forEach(ring => this.drawEnergyRing(ring));
        
        const sortedCubes = [...this.floatingCubes].sort((a, b) => b.z - a.z);
        sortedCubes.forEach(cube => this.drawCube(cube));
        
        this.lasers.forEach(laser => {
            this.ctx.strokeStyle = laser.color;
            this.ctx.lineWidth = laser.width;
            this.ctx.shadowColor = laser.color;
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            if (laser.horizontal) {
                this.ctx.moveTo(laser.x, laser.y);
                this.ctx.lineTo(laser.x - laser.length, laser.y);
            } else {
                this.ctx.moveTo(laser.x, laser.y);
                this.ctx.lineTo(laser.x, laser.y - laser.length);
            }
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        });
        
        this.crosshairs.forEach(ch => this.drawCrosshair(ch));
        
        this.explosions.forEach(exp => {
            exp.particles.forEach(p => {
                if (p.life > 0) {
                    const colorIndex = Math.floor((1 - p.life) * this.colors.explosion.length);
                    this.ctx.fillStyle = this.colors.explosion[Math.min(colorIndex, this.colors.explosion.length - 1)];
                    this.ctx.globalAlpha = p.life;
                    this.ctx.shadowColor = this.ctx.fillStyle;
                    this.ctx.shadowBlur = 10;
                    this.ctx.beginPath();
                    this.ctx.arc(exp.x + p.x, exp.y + p.y, p.size * p.life, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });
        });
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        
        const glowGradient = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, 300);
        glowGradient.addColorStop(0, 'rgba(233, 69, 96, 0.1)');
        glowGradient.addColorStop(0.5, 'rgba(83, 52, 131, 0.05)');
        glowGradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        for (let y = 0; y < this.canvas.height; y += 3) {
            this.ctx.fillRect(0, y, this.canvas.width, 1);
        }
        
        const vignetteGradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, Math.min(this.canvas.width, this.canvas.height) * 0.3,
            this.centerX, this.centerY, Math.max(this.canvas.width, this.canvas.height) * 0.7
        );
        vignetteGradient.addColorStop(0, 'transparent');
        vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        this.ctx.fillStyle = vignetteGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    animate() {
        if (!this.running) return;
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;
        this.update(deltaTime);
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
    
    stop() { this.running = false; }
    
    start() {
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.animate();
        }
    }
}

// ==================== 多重奏背景音乐系统 ====================
class PixelMusic {
    constructor() {
        this.audioCtx = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.masterGain = null;
        this.tempo = 128;
        this.nextNoteTime = 0;
        this.schedulerTimer = null;
        this.currentBeat = 0;
        this.melodyIndex = 0;
        this.bassIndex = 0;
        this.arpIndex = 0;
        
        this.melodies = [
            [{ note: 'E4', duration: 0.5 }, { note: 'G4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'E4', duration: 0.5 }, { note: 'D4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'G4', duration: 0.75 }, { note: null, duration: 0.25 }],
            [{ note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'A4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.75 }, { note: null, duration: 0.25 }]
        ];
        this.bassLines = [
            [{ note: 'E2', duration: 0.5 }, { note: 'E2', duration: 0.25 }, { note: 'E3', duration: 0.25 }, { note: 'E2', duration: 0.5 }, { note: 'G2', duration: 0.5 }],
            [{ note: 'A2', duration: 0.5 }, { note: 'A2', duration: 0.25 }, { note: 'A3', duration: 0.25 }, { note: 'G2', duration: 0.5 }, { note: 'E2', duration: 0.5 }]
        ];
        this.arpeggios = [
            [{ note: 'E3', duration: 0.125 }, { note: 'G3', duration: 0.125 }, { note: 'B3', duration: 0.125 }, { note: 'E4', duration: 0.125 }, { note: 'B3', duration: 0.125 }, { note: 'G3', duration: 0.125 }, { note: 'E3', duration: 0.125 }, { note: 'G3', duration: 0.125 }],
            [{ note: 'A3', duration: 0.125 }, { note: 'C4', duration: 0.125 }, { note: 'E4', duration: 0.125 }, { note: 'A4', duration: 0.125 }, { note: 'E4', duration: 0.125 }, { note: 'C4', duration: 0.125 }, { note: 'A3', duration: 0.125 }, { note: 'C4', duration: 0.125 }],
            [{ note: 'G3', duration: 0.125 }, { note: 'B3', duration: 0.125 }, { note: 'D4', duration: 0.125 }, { note: 'G4', duration: 0.125 }, { note: 'D4', duration: 0.125 }, { note: 'B3', duration: 0.125 }, { note: 'G3', duration: 0.125 }, { note: 'B3', duration: 0.125 }]
        ];
        this.padChords = [['E3', 'G3', 'B3'], ['A3', 'C4', 'E4'], ['G3', 'B3', 'D4'], ['D3', 'F#3', 'A3']];
        this.setupControls();
    }
    
    setupControls() {
        const btn = document.getElementById('music-toggle');
        if (btn) btn.addEventListener('click', () => this.toggle());
    }
    
    init() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.25;
        this.compressor = this.audioCtx.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.ratio.value = 12;
        this.reverb = this.createReverb();
        this.reverbGain = this.audioCtx.createGain();
        this.reverbGain.gain.value = 0.2;
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.audioCtx.destination);
        this.masterGain.connect(this.reverb);
        this.reverb.connect(this.reverbGain);
        this.reverbGain.connect(this.audioCtx.destination);
    }
    
    createReverb() {
        const convolver = this.audioCtx.createConvolver();
        const rate = this.audioCtx.sampleRate, length = rate * 1.5;
        const impulse = this.audioCtx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
        convolver.buffer = impulse;
        return convolver;
    }
    
    noteToFreq(note) {
        if (!note) return 0;
        const notes = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
        const match = note.match(/([A-G]#?)(\d)/);
        return match ? 440 * Math.pow(2, (notes[match[1]] - 9) / 12 + (parseInt(match[2]) - 4)) : 0;
    }
    
    createMelodyOsc(freq, startTime, duration) {
        const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain(), filter = this.audioCtx.createBiquadFilter();
        osc.type = 'square'; osc.frequency.value = freq;
        filter.type = 'lowpass'; filter.frequency.value = 2000; filter.Q.value = 2;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
        osc.start(startTime); osc.stop(startTime + duration + 0.1);
    }
    
    createBassOsc(freq, startTime, duration) {
        const osc = this.audioCtx.createOscillator(), osc2 = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
        osc.type = 'triangle'; osc.frequency.value = freq;
        osc2.type = 'sine'; osc2.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(gain); osc2.connect(gain); gain.connect(this.masterGain);
        osc.start(startTime); osc.stop(startTime + duration + 0.1);
        osc2.start(startTime); osc2.stop(startTime + duration + 0.1);
    }
    
    createArpOsc(freq, startTime, duration) {
        const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain(), filter = this.audioCtx.createBiquadFilter();
        osc.type = 'sawtooth'; osc.frequency.value = freq;
        filter.type = 'lowpass'; filter.frequency.value = 3000;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.005);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
        osc.start(startTime); osc.stop(startTime + duration + 0.1);
    }
    
    createPadOsc(notes, startTime, duration) {
        notes.forEach(note => {
            const freq = this.noteToFreq(note);
            if (freq === 0) return;
            const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
            osc.type = 'sine'; osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.06, startTime + 0.3);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);
            osc.connect(gain); gain.connect(this.masterGain);
            osc.start(startTime); osc.stop(startTime + duration + 0.2);
        });
    }
    
    createKick(startTime) {
        const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
        osc.frequency.setValueAtTime(150, startTime);
        osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.15);
        gain.gain.setValueAtTime(0.6, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.connect(gain); gain.connect(this.masterGain);
        osc.start(startTime); osc.stop(startTime + 0.3);
    }
    
    createSnare(startTime) {
        const osc = this.audioCtx.createOscillator(), oscGain = this.audioCtx.createGain();
        osc.frequency.value = 200;
        oscGain.gain.setValueAtTime(0.3, startTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        osc.connect(oscGain); oscGain.connect(this.masterGain);
        osc.start(startTime); osc.stop(startTime + 0.1);
        
        const bufferSize = this.audioCtx.sampleRate * 0.15;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass'; noiseFilter.frequency.value = 1000;
        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.35, startTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(this.masterGain);
        noise.start(startTime);
    }
    
    createHihat(startTime, open = false) {
        const duration = open ? 0.15 : 0.05;
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass'; filter.frequency.value = 7000;
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(open ? 0.12 : 0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
        noise.start(startTime);
    }
    
    scheduleNote() {
        const secondsPerBeat = 60.0 / this.tempo, sixteenth = secondsPerBeat / 4;
        while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
            const beat = this.currentBeat % 16, bar = Math.floor(this.currentBeat / 16) % 4, section = Math.floor(this.currentBeat / 64) % 2;
            const melody = this.melodies[section], bassLine = this.bassLines[section % this.bassLines.length], arpPattern = this.arpeggios[bar % this.arpeggios.length];
            
            if (beat % 2 === 0 && this.melodyIndex < melody.length) {
                const melodyNote = melody[this.melodyIndex % melody.length];
                if (melodyNote.note) this.createMelodyOsc(this.noteToFreq(melodyNote.note), this.nextNoteTime, melodyNote.duration * secondsPerBeat);
                this.melodyIndex++;
            }
            if (beat % 4 === 0) {
                const bassNote = bassLine[this.bassIndex % bassLine.length];
                if (bassNote.note) this.createBassOsc(this.noteToFreq(bassNote.note), this.nextNoteTime, bassNote.duration * secondsPerBeat);
                this.bassIndex++;
            }
            const arpNote = arpPattern[this.arpIndex % arpPattern.length];
            if (arpNote.note) this.createArpOsc(this.noteToFreq(arpNote.note), this.nextNoteTime, sixteenth * 0.9);
            this.arpIndex++;
            if (beat === 0) this.createPadOsc(this.padChords[bar % this.padChords.length], this.nextNoteTime, secondsPerBeat * 4);
            if (beat === 0 || beat === 4 || beat === 8 || beat === 12) this.createKick(this.nextNoteTime);
            if (beat === 6 || beat === 14) this.createKick(this.nextNoteTime);
            if (beat === 4 || beat === 12) this.createSnare(this.nextNoteTime);
            if (beat % 2 === 0) this.createHihat(this.nextNoteTime, beat % 8 === 6);
            this.nextNoteTime += sixteenth;
            this.currentBeat++;
        }
    }
    
    play() {
        if (this.isPlaying) return;
        this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        this.isPlaying = true;
        this.isMuted = false;
        this.nextNoteTime = this.audioCtx.currentTime;
        this.currentBeat = 0;
        this.melodyIndex = 0;
        this.bassIndex = 0;
        this.arpIndex = 0;
        this.schedulerTimer = setInterval(() => { if (this.isPlaying && !this.isMuted) this.scheduleNote(); }, 25);
        this.updateButton();
    }
    
    stop() {
        this.isPlaying = false;
        if (this.schedulerTimer) {
            clearInterval(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        this.updateButton();
    }
    
    toggle() {
        if (!this.audioCtx) this.init();
        if (this.isPlaying) {
            this.isMuted = true;
            this.stop();
        } else {
            this.play();
        }
    }
    
    updateButton() {
        const btn = document.getElementById('music-toggle');
        if (btn) {
            btn.textContent = this.isMuted || !this.isPlaying ? '🔇' : '🔊';
            btn.classList.toggle('muted', this.isMuted || !this.isPlaying);
        }
    }
    
    setVolume(volume) {
        if (this.masterGain) this.masterGain.gain.value = volume * 0.25;
    }
}

// 全局实例
let pixelBg = null;
let pixelMusic = null;

document.addEventListener('DOMContentLoaded', () => {
    pixelBg = new PixelBackground();
    pixelMusic = new PixelMusic();
    const tryAutoPlay = () => { if (pixelMusic && !pixelMusic.isPlaying) pixelMusic.play(); };
    tryAutoPlay();
    const startMusicOnInteraction = () => {
        tryAutoPlay();
        document.removeEventListener('click', startMusicOnInteraction);
        document.removeEventListener('keydown', startMusicOnInteraction);
        document.removeEventListener('touchstart', startMusicOnInteraction);
    };
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);
    document.addEventListener('touchstart', startMusicOnInteraction);
});
