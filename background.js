// 背景动画和音乐模块

// ==================== 3D游戏风格背景动画 ====================
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
        this.floatingWeapons = []; // 浮动武器模型
        this.explosions = [];
        this.bullets = []; // 子弹轨迹
        
        // Three.js 3D场景（用于人物展示）
        this.scene3d = null;
        this.camera3d = null;
        this.renderer3d = null;
        this.ctModel = null;
        this.tModel = null;
        
        // 颜色主题
        this.colors = {
            neon: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff6600', '#ff0066'],
            ct: ['#4a9eff', '#00ccff', '#0088ff', '#1e3a5f'],
            t: ['#ff6600', '#ff9900', '#ffcc00', '#5c4033'],
            explosion: ['#ff0000', '#ff6600', '#ffff00', '#ffffff'],
            metal: ['#3a3a3a', '#5a5a5a', '#7a7a7a'],
            wood: ['#5c4033', '#7a5a43', '#8b6914']
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.init();
        this.init3DScene();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // 更新3D渲染器尺寸
        if (this.renderer3d && this.camera3d) {
            this.renderer3d.setSize(window.innerWidth, window.innerHeight);
            this.camera3d.aspect = window.innerWidth / window.innerHeight;
            this.camera3d.updateProjectionMatrix();
        }
    }
    
    init() {
        // 创建3D星空（减少数量）
        for (let i = 0; i < 150; i++) {
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
        
        // 创建浮动武器模型
        this.createFloatingWeapon('ak47');
        this.createFloatingWeapon('m4a1');
        this.createFloatingWeapon('awp');
        this.createFloatingWeapon('pistol');
    }
    
    // 初始化Three.js 3D场景
    init3DScene() {
        if (typeof THREE === 'undefined' || typeof PlayerModel === 'undefined') {
            console.warn('Three.js or PlayerModel not loaded, skipping 3D scene');
            return;
        }
        
        // 创建场景
        this.scene3d = new THREE.Scene();
        
        // 创建相机
        this.camera3d = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera3d.position.set(0, 12, 50);
        this.camera3d.lookAt(0, 8, 0);
        
        // 创建渲染器（透明背景）
        this.renderer3d = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer3d.setSize(window.innerWidth, window.innerHeight);
        this.renderer3d.setClearColor(0x000000, 0);
        this.renderer3d.domElement.style.position = 'fixed';
        this.renderer3d.domElement.style.top = '0';
        this.renderer3d.domElement.style.left = '0';
        this.renderer3d.domElement.style.pointerEvents = 'none';
        this.renderer3d.domElement.style.zIndex = '0';
        // 插入到pixel-canvas后面，确保在背景层
        const pixelCanvas = document.getElementById('pixel-canvas');
        if (pixelCanvas && pixelCanvas.parentNode) {
            pixelCanvas.parentNode.insertBefore(this.renderer3d.domElement, pixelCanvas.nextSibling);
        } else {
            document.body.appendChild(this.renderer3d.domElement);
        }
        
        // 添加灯光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene3d.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        this.scene3d.add(directionalLight);
        
        // CT蓝色点光源
        const ctLight = new THREE.PointLight(0x4a9eff, 1, 50);
        ctLight.position.set(-25, 15, 0);
        this.scene3d.add(ctLight);
        
        // T橙色点光源
        const tLight = new THREE.PointLight(0xff6600, 1, 50);
        tLight.position.set(25, 15, 0);
        this.scene3d.add(tLight);
        
        // 创建CT人物模型（左侧）
        this.ctModel = PlayerModel.create('ct', false, 'm4a1');
        this.ctModel.position.set(-25, 0, 0);
        this.ctModel.rotation.y = Math.PI / 4;
        this.scene3d.add(this.ctModel);
        
        // 创建T人物模型（右侧）
        this.tModel = PlayerModel.create('t', false, 'ak47');
        this.tModel.position.set(25, 0, 0);
        this.tModel.rotation.y = -Math.PI / 4;
        this.scene3d.add(this.tModel);
        
        // 添加地面光环效果
        this.addGroundGlow(-25, 0x4a9eff);
        this.addGroundGlow(25, 0xff6600);
    }
    
    // 添加地面光环
    addGroundGlow(x, color) {
        const ringGeom = new THREE.RingGeometry(8, 10, 32);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, 0.1, 0);
        this.scene3d.add(ring);
    }
    
    createFloatingWeapon(type) {
        this.floatingWeapons.push({
            x: (Math.random() - 0.5) * 600,
            y: (Math.random() - 0.5) * 300,
            z: 200 + Math.random() * 400,
            rotX: Math.random() * Math.PI * 2,
            rotY: Math.random() * Math.PI * 2,
            rotZ: Math.random() * Math.PI * 2,
            rotSpeedX: (Math.random() - 0.5) * 0.015,
            rotSpeedY: (Math.random() - 0.5) * 0.02,
            rotSpeedZ: (Math.random() - 0.5) * 0.01,
            type: type,
            glowPhase: Math.random() * Math.PI * 2
        });
    }
    
    createBullet() {
        const fromLeft = Math.random() > 0.5;
        this.bullets.push({
            x: fromLeft ? 0 : this.canvas.width,
            y: this.canvas.height * 0.3 + Math.random() * this.canvas.height * 0.4,
            vx: fromLeft ? 15 + Math.random() * 10 : -(15 + Math.random() * 10),
            vy: (Math.random() - 0.5) * 2,
            life: 1,
            color: fromLeft ? this.colors.ct[0] : this.colors.t[0]
        });
    }
    
    createExplosion(x, y) {
        const particles = [];
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            particles.push({
                x: 0, y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                life: 1
            });
        }
        this.explosions.push({ x, y, particles, time: 0 });
    }
    
    project(x, y, z) {
        const scale = this.fov / (this.fov + z);
        return { x: this.centerX + x * scale, y: this.centerY + y * scale, scale };
    }
    
    // 绘制3D武器模型
    drawWeapon(weapon) {
        const p = this.project(weapon.x, weapon.y, weapon.z);
        if (p.x < -100 || p.x > this.canvas.width + 100) return;
        
        const scale = p.scale * 2;
        const glow = Math.sin(weapon.glowPhase) * 0.3 + 0.7;
        
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(weapon.rotY);
        this.ctx.scale(scale, scale);
        
        // 根据武器类型绘制
        switch(weapon.type) {
            case 'ak47':
                this.drawAK47(glow);
                break;
            case 'm4a1':
                this.drawM4A1(glow);
                break;
            case 'awp':
                this.drawAWP(glow);
                break;
            case 'pistol':
                this.drawPistol(glow);
                break;
        }
        
        this.ctx.restore();
    }
    
    drawAK47(glow) {
        this.ctx.shadowColor = '#ff6600';
        this.ctx.shadowBlur = 15 * glow;
        // 枪身（木质）
        this.ctx.fillStyle = '#5c4033';
        this.ctx.fillRect(-40, -5, 80, 12);
        // 枪管
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.fillRect(40, -3, 35, 6);
        // 弹匣
        this.ctx.fillStyle = '#4a3a2a';
        this.ctx.fillRect(-5, 7, 8, 20);
        // 枪托
        this.ctx.fillStyle = '#5c4033';
        this.ctx.fillRect(-60, -3, 20, 8);
        // 高光
        this.ctx.fillStyle = `rgba(255, 102, 0, ${glow * 0.3})`;
        this.ctx.fillRect(-40, -5, 80, 3);
        this.ctx.shadowBlur = 0;
    }
    
    drawM4A1(glow) {
        this.ctx.shadowColor = '#4a9eff';
        this.ctx.shadowBlur = 15 * glow;
        // 枪身（黑色）
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(-35, -5, 70, 10);
        // 枪管
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(35, -3, 30, 6);
        // 消音器
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(65, -4, 20, 8);
        // 弹匣
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(-5, 5, 6, 18);
        // 枪托
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(-55, -3, 20, 6);
        // 高光
        this.ctx.fillStyle = `rgba(74, 158, 255, ${glow * 0.3})`;
        this.ctx.fillRect(-35, -5, 70, 2);
        this.ctx.shadowBlur = 0;
    }
    
    drawAWP(glow) {
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 15 * glow;
        // 枪身（绿色）
        this.ctx.fillStyle = '#2d4a2d';
        this.ctx.fillRect(-45, -6, 90, 12);
        // 枪管
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(45, -3, 45, 6);
        // 瞄准镜
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.fillRect(-10, -15, 30, 8);
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.beginPath();
        this.ctx.arc(5, -11, 4, 0, Math.PI * 2);
        this.ctx.fill();
        // 弹匣
        this.ctx.fillStyle = '#2d4a2d';
        this.ctx.fillRect(-5, 6, 8, 15);
        // 枪托
        this.ctx.fillStyle = '#2d4a2d';
        this.ctx.fillRect(-65, -4, 20, 8);
        // 高光
        this.ctx.fillStyle = `rgba(0, 255, 0, ${glow * 0.3})`;
        this.ctx.fillRect(-45, -6, 90, 2);
        this.ctx.shadowBlur = 0;
    }
    
    drawPistol(glow) {
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 12 * glow;
        // 枪身
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(-15, -4, 30, 10);
        // 枪管
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(15, -2, 15, 5);
        // 握把
        this.ctx.fillStyle = '#3d2817';
        this.ctx.fillRect(-10, 6, 12, 15);
        // 高光
        this.ctx.fillStyle = `rgba(255, 255, 0, ${glow * 0.3})`;
        this.ctx.fillRect(-15, -4, 30, 2);
        this.ctx.shadowBlur = 0;
    }
    
    update(deltaTime) {
        this.time += deltaTime * 0.01;
        
        // 更新星空
        this.stars.forEach(star => {
            star.z -= star.speed * 2;
            if (star.z < 1) {
                star.z = 2000;
                star.x = (Math.random() - 0.5) * 2000;
                star.y = (Math.random() - 0.5) * 2000;
            }
        });
        
        // 更新网格线
        this.gridLines.forEach(line => {
            line.z -= 3;
            if (line.z < 0) line.z = 3000;
        });
        
        // 更新浮动武器
        this.floatingWeapons.forEach((weapon, index) => {
            weapon.rotX += weapon.rotSpeedX;
            weapon.rotY += weapon.rotSpeedY;
            weapon.rotZ += weapon.rotSpeedZ;
            weapon.glowPhase += 0.05;
            weapon.z -= 0.8;
            weapon.y += Math.sin(this.time + index) * 0.3;
            if (weapon.z < 50) {
                weapon.z = 600;
                weapon.x = (Math.random() - 0.5) * 600;
                weapon.y = (Math.random() - 0.5) * 300;
            }
        });
        
        // 更新3D人物模型旋转（Y轴原地旋转）
        if (this.ctModel) {
            this.ctModel.rotation.y += 0.01;
        }
        if (this.tModel) {
            this.tModel.rotation.y += 0.01;
        }
        
        // 随机创建子弹
        if (Math.random() < 0.03) this.createBullet();
        
        // 更新子弹
        this.bullets.forEach((bullet, index) => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life -= 0.01;
            if (bullet.life <= 0 || bullet.x < -50 || bullet.x > this.canvas.width + 50) {
                this.bullets.splice(index, 1);
            }
        });
        
        // 随机爆炸
        if (Math.random() < 0.003) {
            this.createExplosion(
                this.canvas.width * 0.3 + Math.random() * this.canvas.width * 0.4,
                this.canvas.height * 0.3 + Math.random() * this.canvas.height * 0.4
            );
        }
        
        // 更新爆炸
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
        
        // 绘制浮动武器
        const sortedWeapons = [...this.floatingWeapons].sort((a, b) => b.z - a.z);
        sortedWeapons.forEach(weapon => this.drawWeapon(weapon));
        
        // 绘制子弹轨迹
        this.bullets.forEach(bullet => {
            this.ctx.strokeStyle = bullet.color;
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 10;
            this.ctx.globalAlpha = bullet.life;
            this.ctx.beginPath();
            this.ctx.moveTo(bullet.x, bullet.y);
            this.ctx.lineTo(bullet.x - bullet.vx * 3, bullet.y - bullet.vy * 3);
            this.ctx.stroke();
        });
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        
        // 渲染3D人物模型
        if (this.renderer3d && this.scene3d && this.camera3d) {
            this.renderer3d.render(this.scene3d, this.camera3d);
        }
        
        // 绘制爆炸效果
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
    
    stop() { 
        this.running = false;
        // 清理3D渲染器
        if (this.renderer3d) {
            if (this.renderer3d.domElement && this.renderer3d.domElement.parentNode) {
                this.renderer3d.domElement.parentNode.removeChild(this.renderer3d.domElement);
            }
            this.renderer3d.dispose();
            this.renderer3d = null;
        }
        // 清理3D场景
        if (this.scene3d) {
            this.scene3d.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
            this.scene3d = null;
        }
        this.ctModel = null;
        this.tModel = null;
        this.camera3d = null;
    }
    
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
        
        // 确保AudioContext处于运行状态
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().then(() => {
                this.startPlayback();
            }).catch(() => {
                console.log('音频播放需要用户交互');
            });
        } else {
            this.startPlayback();
        }
    }
    
    startPlayback() {
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
    
    // 用户交互后才能播放音乐（浏览器自动播放策略）
    const startMusicOnInteraction = () => {
        if (pixelMusic && !pixelMusic.isPlaying && !pixelMusic.isMuted) {
            pixelMusic.play();
        }
        // 移除所有监听器
        document.removeEventListener('click', startMusicOnInteraction);
        document.removeEventListener('keydown', startMusicOnInteraction);
        document.removeEventListener('touchstart', startMusicOnInteraction);
        document.removeEventListener('mousedown', startMusicOnInteraction);
    };
    
    // 监听多种用户交互事件
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);
    document.addEventListener('touchstart', startMusicOnInteraction);
    document.addEventListener('mousedown', startMusicOnInteraction);
    
    // 初始化地图选择
    if (typeof initMapSelect === 'function') {
        initMapSelect();
    }
});
