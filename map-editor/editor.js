// CS 地图编辑器

class MapEditor {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.objects = [];
        this.selectedObject = null;
        this.gridHelper = null;
        this.placementPreview = null;
        this.currentTool = null;
        
        // 相机控制
        this.cameraDistance = 200;
        this.cameraAngleX = -0.5;
        this.cameraAngleY = 0.5;
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.isRightMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // 连续放置模式
        this.isLeftMouseDown = false;
        this.lastPlacedPosition = null;
        
        // 橡皮擦模式
        this.isEraserMode = false;
        
        // 撤回历史
        this.undoHistory = [];
        this.maxUndoSteps = 50;
        
        // 第一人称测试模式
        this.isTestMode = false;
        this.testYaw = 0;
        this.testPitch = 0;
        this.savedCameraState = null;
        
        // 键盘状态
        this.keys = {};
        
        // 射线检测
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        
        // 纹理缓存
        this.textures = {};
        
        // 物件类型配置 - textureType 与游戏内 maps.js 保持一致
        this.objectTypes = {
            floor: { w: 40, h: 1, d: 40, color: 0xc4a574, collision: false, textureType: 'floor' },
            wall: { w: 40, h: 20, d: 2, color: 0x95a5a6, collision: true, textureType: 'brick' },
            roof: { w: 40, h: 1, d: 40, color: 0x8b4513, collision: false, textureType: 'concrete', isRoof: true },
            box: { w: 8, h: 8, d: 8, color: 0x5a5a5a, collision: true, textureType: 'metal' },
            crate: { w: 10, h: 10, d: 10, color: 0xa0522d, collision: true, textureType: 'wood' },
            door: { w: 8, h: 16, d: 2, color: 0x5d4e37, collision: true, textureType: 'wood' },
            bombsite_a: { w: 40, h: 0.5, d: 40, color: 0xe74c3c, collision: false, transparent: true },
            bombsite_b: { w: 40, h: 0.5, d: 40, color: 0x3498db, collision: false, transparent: true },
            spawn_ct: { w: 3, h: 15, d: 3, color: 0x2980b9, collision: false },
            spawn_t: { w: 3, h: 15, d: 3, color: 0xc0392b, collision: false }
        };
        
        this.initTextures();
        this.init();
    }
    
    // 初始化程序化纹理 - 与游戏内 maps.js 保持一致
    initTextures() {
        this.textures = {
            wood: this.createWoodTexture(),
            brick: this.createBrickTexture(),
            concrete: this.createConcreteTexture(),
            metal: this.createMetalTexture(),
            floor: this.createFloorTexture()
        };
    }
    
    // 创建地板纹理 - 沙黄色棋盘格纹理
    createFloorTexture(color1 = '#c4a574', color2 = '#a68b5b') {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 基础颜色
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加棋盘格纹理
        ctx.fillStyle = color2;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.fillRect(i * 16, j * 16, 16, 16);
                }
            }
        }
        
        // 添加细微的噪点纹理模拟磨损
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const alpha = Math.random() * 0.08;
            ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            ctx.fillRect(x, y, 1, 1);
        }
        
        // 添加浅色噪点
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const alpha = Math.random() * 0.06;
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fillRect(x, y, 1, 1);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);
        return texture;
    }
    
    // 创建木纹纹理 - 与项目maps.js保持一致
    createWoodTexture(baseColor = 0xa0522d) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const r = (baseColor >> 16) & 0xff;
        const g = (baseColor >> 8) & 0xff;
        const b = baseColor & 0xff;
        
        // 基础木色
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, 64, 64);
        
        // 木纹
        ctx.strokeStyle = `rgba(${Math.floor(r * 0.7)},${Math.floor(g * 0.7)},${Math.floor(b * 0.7)}, 0.4)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const y = i * 3 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x < 64; x += 5) {
                ctx.lineTo(x, y + (Math.random() - 0.5) * 2);
            }
            ctx.stroke();
        }
        
        // 木板边框
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 60, 60);
        
        // 钉子
        ctx.fillStyle = 'rgba(80,80,80,0.8)';
        ctx.beginPath(); ctx.arc(8, 8, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(56, 8, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, 56, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(56, 56, 2, 0, Math.PI * 2); ctx.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        return texture;
    }
    
    // 创建砖墙纹理 - 与项目maps.js保持一致
    createBrickTexture(baseColor = 0x95a5a6) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        const r = (baseColor >> 16) & 0xff;
        const g = (baseColor >> 8) & 0xff;
        const b = baseColor & 0xff;
        
        // 灰泥/水泥底色
        ctx.fillStyle = `rgb(${Math.floor(r * 0.7)},${Math.floor(g * 0.7)},${Math.floor(b * 0.7)})`;
        ctx.fillRect(0, 0, 128, 128);
        
        // 砖块尺寸
        const brickW = 32;
        const brickH = 16;
        const mortarSize = 2;
        
        // 绘制砖块
        for (let row = 0; row < 8; row++) {
            const offset = (row % 2) * (brickW / 2);
            for (let col = -1; col < 5; col++) {
                const x = col * brickW + offset;
                const y = row * brickH;
                
                // 砖块颜色变化
                const variation = (Math.random() - 0.5) * 30;
                const br = Math.min(255, Math.max(0, r + variation));
                const bg = Math.min(255, Math.max(0, g + variation * 0.8));
                const bb = Math.min(255, Math.max(0, b + variation * 0.6));
                
                ctx.fillStyle = `rgb(${Math.floor(br)},${Math.floor(bg)},${Math.floor(bb)})`;
                ctx.fillRect(x + mortarSize, y + mortarSize, brickW - mortarSize * 2, brickH - mortarSize * 2);
                
                // 砖块高光
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(x + mortarSize, y + mortarSize, brickW - mortarSize * 2, 2);
                
                // 砖块阴影
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.fillRect(x + mortarSize, y + brickH - mortarSize - 2, brickW - mortarSize * 2, 2);
            }
        }
        
        // 添加污渍效果
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for (let i = 0; i < 20; i++) {
            const px = Math.random() * 128;
            const py = Math.random() * 128;
            const size = Math.random() * 8 + 2;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        return texture;
    }
    
    // 创建混凝土纹理 - 与项目maps.js保持一致
    createConcreteTexture(baseColor = 0x808080) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const r = (baseColor >> 16) & 0xff;
        const g = (baseColor >> 8) & 0xff;
        const b = baseColor & 0xff;
        
        // 基础颜色
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加噪点纹理模拟混凝土表面
        for (let i = 0; i < 500; i++) {
            const px = Math.random() * 64;
            const py = Math.random() * 64;
            const brightness = Math.random() * 40 - 20;
            const nr = Math.min(255, Math.max(0, r + brightness));
            const ng = Math.min(255, Math.max(0, g + brightness));
            const nb = Math.min(255, Math.max(0, b + brightness));
            ctx.fillStyle = `rgb(${Math.floor(nr)},${Math.floor(ng)},${Math.floor(nb)})`;
            ctx.fillRect(px, py, 1, 1);
        }
        
        // 添加裂缝效果
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            let cx = Math.random() * 64;
            let cy = Math.random() * 64;
            ctx.moveTo(cx, cy);
            for (let j = 0; j < 5; j++) {
                cx += (Math.random() - 0.5) * 15;
                cy += Math.random() * 10;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
        }
        
        // 添加水渍/污渍
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        for (let i = 0; i < 5; i++) {
            const px = Math.random() * 64;
            const py = Math.random() * 64;
            const w = Math.random() * 15 + 5;
            const h = Math.random() * 20 + 10;
            ctx.beginPath();
            ctx.ellipse(px, py, w, h, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);
        return texture;
    }
    
    // 创建金属纹理 - 与项目maps.js保持一致
    createMetalTexture(baseColor = 0x5a5a5a) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const r = (baseColor >> 16) & 0xff;
        const g = (baseColor >> 8) & 0xff;
        const b = baseColor & 0xff;
        
        // 基础金属色
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, 64, 64);
        
        // 金属条纹/波纹
        for (let i = 0; i < 8; i++) {
            const y = i * 8;
            // 高光条
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(0, y, 64, 2);
            // 阴影条
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(0, y + 4, 64, 2);
        }
        
        // 铆钉
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                ctx.beginPath();
                ctx.arc(8 + i * 16, 8 + j * 16, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 锈迹
        ctx.fillStyle = 'rgba(139, 69, 19, 0.2)';
        for (let i = 0; i < 8; i++) {
            const px = Math.random() * 64;
            const py = Math.random() * 64;
            const size = Math.random() * 6 + 2;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        return texture;
    }
    
    // 创建木门纹理
    createWoodDoorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 门板基色
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(0, 0, 64, 128);
        
        // 门框
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 56, 120);
        
        // 门板纹理
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(8, 8, 48, 50);
        ctx.fillRect(8, 70, 48, 50);
        
        // 门把手
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(52, 70, 4, 0, Math.PI * 2);
        ctx.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    // 创建油桶纹理
    createBarrelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 桶身
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(0, 0, 64, 64);
        
        // 金属环
        ctx.fillStyle = '#1a252f';
        ctx.fillRect(0, 0, 64, 6);
        ctx.fillRect(0, 28, 64, 8);
        ctx.fillRect(0, 58, 64, 6);
        
        // 警告标志
        ctx.fillStyle = '#F39C12';
        ctx.fillRect(20, 12, 24, 14);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('!', 29, 23);
        
        // 锈迹
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 64, Math.random() * 64, Math.random() * 8 + 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    // 创建沙袋纹理
    createSandbagTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 麻布基色
        ctx.fillStyle = '#C9B896';
        ctx.fillRect(0, 0, 64, 64);
        
        // 编织纹理
        ctx.strokeStyle = '#A89878';
        ctx.lineWidth = 1;
        for (let i = 0; i < 32; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 2, 0);
            ctx.lineTo(i * 2, 64);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * 2);
            ctx.lineTo(64, i * 2);
            ctx.stroke();
        }
        
        // 褶皱
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(Math.random() * 64, Math.random() * 64, 15, 5, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    // 创建涂鸦纹理
    createGraffitiTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 墙面背景
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 128, 128);
        
        // 随机涂鸦
        const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6'];
        
        // 喷漆效果
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.font = `bold ${20 + Math.random() * 20}px Arial`;
            ctx.save();
            ctx.translate(64, 64);
            ctx.rotate(Math.random() * 0.5 - 0.25);
            ctx.fillText(['CS', 'GO', '!', 'AWP', 'GG'][i], -20, Math.random() * 40 - 20);
            ctx.restore();
        }
        
        // 喷溅效果
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.beginPath();
            ctx.arc(Math.random() * 128, Math.random() * 128, Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    init() {
        this.initThree();
        this.initGrid();
        this.initLights();
        this.initEvents();
        this.animate();
    }
    
    initThree() {
        const canvas = document.getElementById('canvas');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
        this.updateCameraPosition();
        
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
        this.renderer.shadowMap.enabled = true;
        
        window.addEventListener('resize', () => {
            const container = canvas.parentElement;
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }
    
    initGrid() {
        const size = 300;
        const divisions = 30;
        this.gridHelper = new THREE.GridHelper(size * 2, divisions * 2, 0x444444, 0x333333);
        this.scene.add(this.gridHelper);
        
        // 地面 - 使用沙黄色棋盘格纹理
        const groundGeom = new THREE.PlaneGeometry(size * 2, size * 2);
        const groundTexture = this.createFloorTexture();
        groundTexture.repeat.set(size / 5, size / 5);
        const groundMat = new THREE.MeshLambertMaterial({ map: groundTexture });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        ground.userData.isGround = true;
        this.scene.add(ground);
        this.ground = ground;
        
        // 边界指示
        const borderMat = new THREE.LineBasicMaterial({ color: 0xe94560 });
        const borderGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-size, 0, -size),
            new THREE.Vector3(size, 0, -size),
            new THREE.Vector3(size, 0, size),
            new THREE.Vector3(-size, 0, size),
            new THREE.Vector3(-size, 0, -size)
        ]);
        const border = new THREE.Line(borderGeom, borderMat);
        this.scene.add(border);
        this.border = border;
    }
    
    initLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(100, 200, 100);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 10;
        sun.shadow.camera.far = 500;
        sun.shadow.camera.left = -200;
        sun.shadow.camera.right = 200;
        sun.shadow.camera.top = 200;
        sun.shadow.camera.bottom = -200;
        this.scene.add(sun);
    }

    initEvents() {
        const canvas = document.getElementById('canvas');
        
        // 鼠标事件
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('wheel', (e) => this.onWheel(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 第一人称测试模式鼠标移动
        document.addEventListener('mousemove', (e) => this.onTestMouseMove(e));
        document.addEventListener('pointerlockchange', () => {
            if (!document.pointerLockElement && this.isTestMode) {
                this.testView(); // 退出测试模式
            }
        });
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // 拖拽物件
        document.querySelectorAll('.object-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                // 取消橡皮擦模式
                if (this.isEraserMode) {
                    this.toggleEraserMode();
                }
                this.currentTool = e.target.dataset.type;
                this.createPlacementPreview(this.currentTool);
            });
            item.addEventListener('dragend', () => {
                this.removePlacementPreview();
                this.currentTool = null;
            });
            item.addEventListener('click', () => {
                // 取消橡皮擦模式
                if (this.isEraserMode) {
                    this.toggleEraserMode();
                }
                this.currentTool = item.dataset.type;
                this.createPlacementPreview(this.currentTool);
            });
        });
        
        // 视口拖放
        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.currentTool) {
                const pos = this.getGroundPosition(e);
                if (pos) this.placeObject(this.currentTool, pos);
            }
            this.removePlacementPreview();
            this.currentTool = null;
        });
        
        // 工具栏按钮
        document.getElementById('newMap').addEventListener('click', () => this.newMap());
        document.getElementById('saveMap').addEventListener('click', () => this.saveMapAsJson());
        document.getElementById('exportCode').addEventListener('click', () => this.exportCode());
        document.getElementById('loadMap').addEventListener('click', () => this.loadMap());
        document.getElementById('loadPreset').addEventListener('click', () => this.showPresetModal());
        document.getElementById('testMap').addEventListener('click', () => this.testView());
        document.getElementById('addWalls').addEventListener('click', () => this.addBorderWalls());
        document.getElementById('rotateMap90').addEventListener('click', () => this.rotateMapBy90());
        document.getElementById('eraserTool').addEventListener('click', () => this.toggleEraserMode());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        
        // 预设地图选择
        document.querySelectorAll('.preset-item').forEach(item => {
            item.addEventListener('click', () => {
                const mapName = item.dataset.map;
                this.loadPresetMap(mapName);
                this.closePresetModal();
            });
        });
        document.getElementById('close-preset-modal').addEventListener('click', () => this.closePresetModal());
        
        // 属性面板
        document.getElementById('prop-x').addEventListener('change', (e) => this.updateSelectedProperty('x', parseFloat(e.target.value)));
        document.getElementById('prop-y').addEventListener('change', (e) => this.updateSelectedProperty('y', parseFloat(e.target.value)));
        document.getElementById('prop-z').addEventListener('change', (e) => this.updateSelectedProperty('z', parseFloat(e.target.value)));
        document.getElementById('prop-w').addEventListener('change', (e) => this.updateSelectedProperty('w', parseFloat(e.target.value)));
        document.getElementById('prop-h').addEventListener('change', (e) => this.updateSelectedProperty('h', parseFloat(e.target.value)));
        document.getElementById('prop-d').addEventListener('change', (e) => this.updateSelectedProperty('d', parseFloat(e.target.value)));
        document.getElementById('prop-ry').addEventListener('change', (e) => this.updateSelectedProperty('ry', parseFloat(e.target.value)));
        document.getElementById('prop-color').addEventListener('change', (e) => this.updateSelectedProperty('color', e.target.value));
        document.getElementById('delete-obj').addEventListener('click', () => this.deleteSelected());
        document.getElementById('duplicate-obj').addEventListener('click', () => this.duplicateSelected());
        
        // 属性面板输入框滚轮调整
        this.setupInputWheelAdjust();
        
        // 弹窗
        document.getElementById('copy-code').addEventListener('click', () => this.copyCode());
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        
        // 云存储按钮
        document.getElementById('cloudSave').addEventListener('click', () => this.showCloudSaveModal());
        document.getElementById('cloudLoad').addEventListener('click', () => this.showCloudModal());
        
        // 云端地图弹窗
        document.getElementById('cloud-refresh').addEventListener('click', () => this.loadCloudMapList());
        document.getElementById('close-cloud-modal').addEventListener('click', () => this.closeCloudModal());
        
        // 云端保存弹窗
        document.getElementById('confirm-cloud-save').addEventListener('click', () => this.confirmCloudSave());
        document.getElementById('close-cloud-save-modal').addEventListener('click', () => this.closeCloudSaveModal());
        
        // 地图大小变化
        document.getElementById('mapSize').addEventListener('change', (e) => this.updateMapSize(parseInt(e.target.value) || 300));
    }
    
    updateMapSize(size) {
        // 更新网格
        this.scene.remove(this.gridHelper);
        const divisions = Math.floor(size / 10);
        this.gridHelper = new THREE.GridHelper(size * 2, divisions * 2, 0x444444, 0x333333);
        this.scene.add(this.gridHelper);
        
        // 更新地面
        this.scene.remove(this.ground);
        const groundGeom = new THREE.PlaneGeometry(size * 2, size * 2);
        const groundTexture = this.createFloorTexture();
        groundTexture.repeat.set(size / 5, size / 5);
        const groundMat = new THREE.MeshLambertMaterial({ map: groundTexture });
        this.ground = new THREE.Mesh(groundGeom, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.1;
        this.ground.receiveShadow = true;
        this.ground.userData.isGround = true;
        this.scene.add(this.ground);
        
        // 更新边界
        this.scene.remove(this.border);
        const borderMat = new THREE.LineBasicMaterial({ color: 0xe94560 });
        const borderGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-size, 0, -size),
            new THREE.Vector3(size, 0, -size),
            new THREE.Vector3(size, 0, size),
            new THREE.Vector3(-size, 0, size),
            new THREE.Vector3(-size, 0, -size)
        ]);
        this.border = new THREE.Line(borderGeom, borderMat);
        this.scene.add(this.border);
    }
    
    onMouseDown(e) {
        if (e.button === 2) {
            this.isRightMouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        } else if (e.button === 0) {
            this.isLeftMouseDown = true;
            if (this.isEraserMode) {
                // 橡皮擦模式：删除点击的物件
                this.eraseObjectAt(e);
            } else if (this.currentTool) {
                const pos = this.getGroundPosition(e);
                if (pos) {
                    this.placeObject(this.currentTool, pos);
                    this.lastPlacedPosition = this.snapToGrid(pos);
                }
            } else {
                this.selectObjectAt(e);
            }
        }
    }
    
    onMouseUp(e) {
        if (e.button === 2) {
            this.isRightMouseDown = false;
        }
        if (e.button === 0) {
            this.isLeftMouseDown = false;
            this.lastPlacedPosition = null;
        }
    }
    
    onMouseMove(e) {
        // 更新坐标显示
        const pos = this.getGroundPosition(e);
        if (pos) {
            document.getElementById('coords').textContent = 
                `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}, Z: ${Math.round(pos.z)}`;
            
            // 更新预览位置和颜色
            if (this.placementPreview && this.currentTool) {
                const config = this.objectTypes[this.currentTool];
                const snappedPos = this.snapToGrid(pos);
                this.placementPreview.position.copy(snappedPos);
                
                // 斜坡原点在底部，其他物件需要抬高半个高度
                const baseY = config.isRamp ? 0 : config.h / 2;
                this.placementPreview.position.y = baseY;
                
                // 允许重叠放置，预览始终显示正常颜色
                this.placementPreview.material.color.setHex(config.color);
                this.placementPreview.material.opacity = 0.5;
            }
            
            // 橡皮擦模式：按住左键拖动时连续删除物件
            if (this.isLeftMouseDown && this.isEraserMode) {
                this.eraseObjectAt(e);
            }
            // 连续放置模式：按住左键拖动时连续添加物件
            else if (this.isLeftMouseDown && this.currentTool) {
                const snappedPos = this.snapToGrid(pos);
                // 检查是否移动到了新的网格位置
                if (!this.lastPlacedPosition || 
                    snappedPos.x !== this.lastPlacedPosition.x || 
                    snappedPos.z !== this.lastPlacedPosition.z) {
                    this.placeObject(this.currentTool, pos);
                    this.lastPlacedPosition = snappedPos;
                }
            }
        }
        
        // 相机旋转
        if (this.isRightMouseDown) {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            this.cameraAngleY -= deltaX * 0.005;
            this.cameraAngleX = Math.max(-1.5, Math.min(-0.1, this.cameraAngleX - deltaY * 0.005));
            this.updateCameraPosition();
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        this.cameraDistance = Math.max(50, Math.min(500, this.cameraDistance + e.deltaY * 0.5));
        this.updateCameraPosition();
    }
    
    onKeyDown(e) {
        this.keys[e.code] = true;
        
        if (e.code === 'Delete' || e.code === 'Backspace') {
            this.deleteSelected();
        }
        if (e.code === 'KeyR') {
            // 旋转预览物件或已选中的物件，每次旋转90度
            if (this.placementPreview) {
                this.rotatePlacementPreview();
            } else if (this.selectedObject) {
                this.rotateSelected();
            }
        }
        if (e.code === 'Escape') {
            // 取消所有选中状态
            this.deselectObject();
            this.clearCurrentTool();
            // 退出橡皮擦模式
            if (this.isEraserMode) {
                this.toggleEraserMode();
            }
        }
        // Ctrl+Z 撤回
        if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.undo();
        }
        // 方向键移动选中的物件
        if (this.selectedObject && !this.isTestMode) {
            const moveStep = e.shiftKey ? 5 : 1; // 默认步长1，按住Shift快速移动
            let moved = false;
            if (e.code === 'ArrowUp') {
                this.selectedObject.position.z -= moveStep;
                moved = true;
            }
            if (e.code === 'ArrowDown') {
                this.selectedObject.position.z += moveStep;
                moved = true;
            }
            if (e.code === 'ArrowLeft') {
                this.selectedObject.position.x -= moveStep;
                moved = true;
            }
            if (e.code === 'ArrowRight') {
                this.selectedObject.position.x += moveStep;
                moved = true;
            }
            // PageUp/PageDown 调整高度
            if (e.code === 'PageUp') {
                this.selectedObject.position.y += moveStep;
                moved = true;
            }
            if (e.code === 'PageDown') {
                this.selectedObject.position.y = Math.max(0, this.selectedObject.position.y - moveStep);
                moved = true;
            }
            if (moved) {
                e.preventDefault();
                // 更新userData
                this.selectedObject.userData.x = this.selectedObject.position.x;
                this.selectedObject.userData.y = this.selectedObject.position.y;
                this.selectedObject.userData.z = this.selectedObject.position.z;
                // 更新属性面板
                this.updatePropertyPanel();
            }
        }
    }
    
    onKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    updateCameraPosition() {
        const x = this.cameraTarget.x + this.cameraDistance * Math.cos(this.cameraAngleX) * Math.sin(this.cameraAngleY);
        const y = this.cameraTarget.y + this.cameraDistance * Math.sin(-this.cameraAngleX);
        const z = this.cameraTarget.z + this.cameraDistance * Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY);
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.cameraTarget);
    }
    
    getGroundPosition(e) {
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersectPoint = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint)) {
            return intersectPoint;
        }
        return null;
    }
    
    snapToGrid(pos, gridSize = 2) {
        return new THREE.Vector3(
            Math.round(pos.x / gridSize) * gridSize,
            0,
            Math.round(pos.z / gridSize) * gridSize
        );
    }
    
    createPlacementPreview(type) {
        this.removePlacementPreview();
        const config = this.objectTypes[type];
        if (!config) return;
        
        const mesh = this.createObjectMesh(type, config, true);
        mesh.material.opacity = 0.5;
        mesh.material.transparent = true;
        this.scene.add(mesh);
        this.placementPreview = mesh;
    }
    
    removePlacementPreview() {
        if (this.placementPreview) {
            this.scene.remove(this.placementPreview);
            this.placementPreview = null;
        }
    }
    
    // 清除当前工具
    clearCurrentTool() {
        this.removePlacementPreview();
        this.currentTool = null;
    }

    createObjectMesh(type, config, isPreview = false) {
        let geometry, material, mesh;
        
        if (config.isCylinder) {
            geometry = new THREE.CylinderGeometry(config.w / 2, config.w / 2, config.h, 16);
        } else if (config.isRamp) {
            // 创建斜坡几何体
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.lineTo(config.d, 0);
            shape.lineTo(config.d, config.h);
            shape.lineTo(0, 0);
            
            const extrudeSettings = { depth: config.w, bevelEnabled: false };
            geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.rotateY(Math.PI / 2);
            geometry.translate(-config.w / 2, 0, -config.d / 2);
        } else {
            geometry = new THREE.BoxGeometry(config.w, config.h, config.d);
        }
        
        // 根据类型选择纹理
        const textureType = config.textureType;
        if (textureType && !isPreview) {
            let texture;
            
            // 地板纹理需要根据颜色动态生成
            if (textureType === 'floor') {
                const r = (config.color >> 16) & 0xff;
                const g = (config.color >> 8) & 0xff;
                const b = config.color & 0xff;
                const color1 = `rgb(${r},${g},${b})`;
                const color2 = `rgb(${Math.floor(r * 0.87)},${Math.floor(g * 0.87)},${Math.floor(b * 0.87)})`;
                texture = this.createFloorTexture(color1, color2);
                texture.repeat.set(config.w / 8, config.d / 8);
            } else if (this.textures[textureType]) {
                texture = this.textures[textureType].clone();
                texture.needsUpdate = true;
                
                // 根据物件大小调整纹理重复
                if (textureType === 'brick' || textureType === 'concrete') {
                    texture.repeat.set(config.w / 20, config.h / 10);
                } else if (textureType === 'wood') {
                    texture.repeat.set(config.w / 10, config.d / 10);
                }
            }
            
            if (texture) {
                material = new THREE.MeshLambertMaterial({ 
                    map: texture,
                    transparent: config.transparent || false,
                    opacity: config.transparent ? 0.4 : 1
                });
            }
        }
        
        if (!material) {
            material = new THREE.MeshLambertMaterial({ 
                color: config.color,
                transparent: config.transparent || false,
                opacity: config.transparent ? 0.4 : 1
            });
        }
        
        mesh = new THREE.Mesh(geometry, material);
        // 斜坡的几何体原点在底部，不需要抬高；其他物件需要抬高半个高度
        if (config.isRamp) {
            mesh.position.y = 0;
        } else {
            mesh.position.y = config.h / 2;
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // 存储物件数据
        mesh.userData = {
            type: type,
            w: config.w,
            h: config.h,
            d: config.d,
            color: config.color,
            collision: config.collision,
            isRamp: config.isRamp || false,
            isCylinder: config.isCylinder || false,
            isLight: config.isLight || false,
            textureType: textureType
        };
        
        // 灯光物件添加点光源
        if (config.isLight && !isPreview) {
            const pointLight = new THREE.PointLight(0xf1c40f, 1, 50);
            pointLight.position.set(0, 0, 0);
            mesh.add(pointLight);
        }
        
        return mesh;
    }
    
    placeObject(type, position) {
        const config = this.objectTypes[type];
        if (!config) return;
        
        // 使用统一小网格对齐，允许不同尺寸物件贴合
        let snappedPos = this.snapToGrid(position);
        // 斜坡原点在底部，其他物件需要抬高半个高度
        let placementY = config.isRamp ? 0 : config.h / 2;
        
        // 检查重叠，如果完全重叠则自动堆叠到上方
        const overlapResult = this.checkOverlapAndFindY(snappedPos, config, type);
        if (overlapResult.hasOverlap && overlapResult.canStack) {
            placementY = overlapResult.stackY + (config.isRamp ? 0 : config.h / 2);
        }
        
        const mesh = this.createObjectMesh(type, config);
        mesh.position.x = snappedPos.x;
        mesh.position.z = snappedPos.z;
        mesh.position.y = placementY;
        
        // 应用预览物件的旋转角度
        if (this.placementPreview) {
            mesh.rotation.y = this.placementPreview.rotation.y;
        }
        
        this.scene.add(mesh);
        this.objects.push(mesh);
        
        // 记录撤回历史
        this.addToHistory({ action: 'add', mesh: mesh, data: this.serializeMesh(mesh) });
        
        // 放置后不自动选中，保持当前工具可以继续放置
        // this.selectObject(mesh);
    }
    
    // 检查新物件是否与现有物件重叠，并计算可堆叠的Y位置
    checkOverlapAndFindY(position, config, newType) {
        const newMinX = position.x - config.w / 2;
        const newMaxX = position.x + config.w / 2;
        const newMinZ = position.z - config.d / 2;
        const newMaxZ = position.z + config.d / 2;
        
        // 使用一个小的容差值，允许边缘接触但不重叠
        const tolerance = 0.1;
        
        let hasOverlap = false;
        let maxTopY = 0; // 记录重叠物件的最高点
        let canStack = false;
        
        for (const obj of this.objects) {
            const data = obj.userData;
            
            // 考虑物件旋转后的实际尺寸
            let objW = data.w;
            let objD = data.d;
            
            // 如果物件旋转了90度或270度，交换宽度和深度
            const rotation = obj.rotation.y;
            const rotationDeg = Math.abs(Math.round(THREE.MathUtils.radToDeg(rotation)) % 180);
            if (rotationDeg === 90) {
                objW = data.d;
                objD = data.w;
            }
            
            const objMinX = obj.position.x - objW / 2;
            const objMaxX = obj.position.x + objW / 2;
            const objMinZ = obj.position.z - objD / 2;
            const objMaxZ = obj.position.z + objD / 2;
            
            // 检查XZ平面上的重叠（使用容差允许边缘接触）
            const overlapX = newMinX < objMaxX - tolerance && newMaxX > objMinX + tolerance;
            const overlapZ = newMinZ < objMaxZ - tolerance && newMaxZ > objMinZ + tolerance;
            
            if (overlapX && overlapZ) {
                // 地板只和地板检测重叠，不允许堆叠
                const isNewFloor = newType === 'floor';
                const isObjFloor = data.type === 'floor';
                
                if (isNewFloor && isObjFloor) {
                    // 地板和地板重叠，不允许
                    return { hasOverlap: true, canStack: false, stackY: 0 };
                }
                
                if (!isNewFloor && isObjFloor) {
                    // 在地板上放置非地板物件，这是正常的，不算重叠
                    continue;
                }
                
                if (!isNewFloor && !isObjFloor) {
                    // 非地板物件之间重叠，允许堆叠到上方
                    hasOverlap = true;
                    canStack = true;
                    const objTopY = obj.position.y + data.h / 2;
                    if (objTopY > maxTopY) {
                        maxTopY = objTopY;
                    }
                }
            }
        }
        
        return { hasOverlap, canStack, stackY: maxTopY };
    }
    
    // 检查新物件是否与现有物件重叠（用于预览显示）
    checkOverlap(position, config, newType) {
        const result = this.checkOverlapAndFindY(position, config, newType);
        // 如果有重叠但可以堆叠，则不算重叠（预览显示绿色）
        return result.hasOverlap && !result.canStack;
    }
    
    // 序列化物件数据用于撤回
    serializeMesh(mesh) {
        return {
            type: mesh.userData.type,
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
            ry: mesh.rotation.y,
            w: mesh.userData.w,
            h: mesh.userData.h,
            d: mesh.userData.d,
            color: mesh.userData.color
        };
    }
    
    // 添加到撤回历史
    addToHistory(record) {
        this.undoHistory.push(record);
        if (this.undoHistory.length > this.maxUndoSteps) {
            this.undoHistory.shift();
        }
    }
    
    // 撤回操作
    undo() {
        if (this.undoHistory.length === 0) return;
        
        const record = this.undoHistory.pop();
        
        if (record.action === 'add') {
            // 撤回添加：删除物件
            const index = this.objects.indexOf(record.mesh);
            if (index > -1) {
                this.objects.splice(index, 1);
                this.scene.remove(record.mesh);
                if (this.selectedObject === record.mesh) {
                    this.deselectObject();
                }
            }
        } else if (record.action === 'delete') {
            // 撤回删除：恢复物件
            const data = record.data;
            const config = {
                w: data.w,
                h: data.h,
                d: data.d,
                color: data.color,
                collision: this.objectTypes[data.type]?.collision,
                isRamp: this.objectTypes[data.type]?.isRamp,
                isCylinder: this.objectTypes[data.type]?.isCylinder,
                isLight: this.objectTypes[data.type]?.isLight,
                textureType: this.objectTypes[data.type]?.textureType,
                transparent: this.objectTypes[data.type]?.transparent
            };
            const mesh = this.createObjectMesh(data.type, config);
            mesh.position.set(data.x, data.y, data.z);
            mesh.rotation.y = data.ry || 0;
            this.scene.add(mesh);
            this.objects.push(mesh);
        }
    }
    
    // 切换橡皮擦模式
    toggleEraserMode() {
        this.isEraserMode = !this.isEraserMode;
        const btn = document.getElementById('eraserTool');
        
        if (this.isEraserMode) {
            btn.classList.add('active');
            btn.style.background = '#e74c3c';
            this.currentTool = null;
            this.removePlacementPreview();
            document.getElementById('canvas').style.cursor = 'crosshair';
        } else {
            btn.classList.remove('active');
            btn.style.background = '';
            document.getElementById('canvas').style.cursor = 'default';
        }
    }
    
    // 橡皮擦删除物件
    eraseObjectAt(e) {
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects);
        
        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            // 记录撤回历史
            this.addToHistory({ action: 'delete', data: this.serializeMesh(mesh) });
            
            const index = this.objects.indexOf(mesh);
            if (index > -1) {
                this.objects.splice(index, 1);
            }
            this.scene.remove(mesh);
            
            if (this.selectedObject === mesh) {
                this.deselectObject();
            }
        }
    }
    
    selectObjectAt(e) {
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects);
        
        if (intersects.length > 0) {
            this.selectObject(intersects[0].object);
        } else {
            this.deselectObject();
        }
    }
    
    selectObject(mesh) {
        this.deselectObject();
        this.selectedObject = mesh;
        
        // 高亮选中物件
        if (mesh.userData.originalColor === undefined) {
            mesh.userData.originalColor = mesh.material.color.getHex();
        }
        mesh.material.emissive = new THREE.Color(0x444444);
        
        // 更新属性面板
        document.getElementById('no-selection').style.display = 'none';
        document.getElementById('prop-panel').style.display = 'block';
        
        document.getElementById('prop-type').textContent = this.getTypeName(mesh.userData.type);
        document.getElementById('prop-x').value = Math.round(mesh.position.x);
        document.getElementById('prop-y').value = Math.round(mesh.position.y - mesh.userData.h / 2);
        document.getElementById('prop-z').value = Math.round(mesh.position.z);
        document.getElementById('prop-w').value = mesh.userData.w;
        document.getElementById('prop-h').value = mesh.userData.h;
        document.getElementById('prop-d').value = mesh.userData.d;
        document.getElementById('prop-ry').value = Math.round(THREE.MathUtils.radToDeg(mesh.rotation.y));
        document.getElementById('prop-color').value = '#' + mesh.userData.color.toString(16).padStart(6, '0');
    }
    
    deselectObject() {
        if (this.selectedObject) {
            this.selectedObject.material.emissive = new THREE.Color(0x000000);
            this.selectedObject = null;
        }
        document.getElementById('no-selection').style.display = 'block';
        document.getElementById('prop-panel').style.display = 'none';
    }
    
    // 更新属性面板显示
    updatePropertyPanel() {
        if (!this.selectedObject) return;
        const mesh = this.selectedObject;
        document.getElementById('prop-x').value = Math.round(mesh.position.x);
        document.getElementById('prop-y').value = Math.round(mesh.position.y - mesh.userData.h / 2);
        document.getElementById('prop-z').value = Math.round(mesh.position.z);
    }
    
    // 设置属性面板输入框滚轮调整
    setupInputWheelAdjust() {
        const inputs = [
            { id: 'prop-x', prop: 'x', step: 1 },
            { id: 'prop-y', prop: 'y', step: 1 },
            { id: 'prop-z', prop: 'z', step: 1 },
            { id: 'prop-w', prop: 'w', step: 1 },
            { id: 'prop-h', prop: 'h', step: 1 },
            { id: 'prop-d', prop: 'd', step: 1 },
            { id: 'prop-ry', prop: 'ry', step: 5 }
        ];
        
        inputs.forEach(({ id, prop, step }) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('wheel', (e) => {
                    if (!this.selectedObject) return;
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -step : step;
                    const currentValue = parseFloat(input.value) || 0;
                    const newValue = currentValue + delta;
                    input.value = newValue;
                    this.updateSelectedProperty(prop, newValue);
                });
            }
        });
    }
    
    updateSelectedProperty(prop, value) {
        if (!this.selectedObject) return;
        
        const mesh = this.selectedObject;
        
        switch(prop) {
            case 'x':
                mesh.position.x = value;
                break;
            case 'y':
                mesh.position.y = value + mesh.userData.h / 2;
                break;
            case 'z':
                mesh.position.z = value;
                break;
            case 'w':
            case 'h':
            case 'd':
                mesh.userData[prop] = value;
                this.rebuildMesh(mesh);
                break;
            case 'ry':
                mesh.rotation.y = THREE.MathUtils.degToRad(value);
                break;
            case 'color':
                const colorInt = parseInt(value.replace('#', ''), 16);
                mesh.material.color.setHex(colorInt);
                mesh.userData.color = colorInt;
                break;
        }
    }
    
    rebuildMesh(mesh) {
        const data = mesh.userData;
        let newGeometry;
        
        if (data.isCylinder) {
            newGeometry = new THREE.CylinderGeometry(data.w / 2, data.w / 2, data.h, 16);
        } else if (data.isRamp) {
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.lineTo(data.d, 0);
            shape.lineTo(data.d, data.h);
            shape.lineTo(0, 0);
            const extrudeSettings = { depth: data.w, bevelEnabled: false };
            newGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            newGeometry.rotateY(Math.PI / 2);
            newGeometry.translate(-data.w / 2, 0, -data.d / 2);
        } else {
            newGeometry = new THREE.BoxGeometry(data.w, data.h, data.d);
        }
        
        mesh.geometry.dispose();
        mesh.geometry = newGeometry;
        mesh.position.y = data.h / 2;
    }
    
    deleteSelected() {
        if (!this.selectedObject) return;
        
        // 记录撤回历史
        this.addToHistory({ action: 'delete', data: this.serializeMesh(this.selectedObject) });
        
        const index = this.objects.indexOf(this.selectedObject);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
        this.scene.remove(this.selectedObject);
        this.selectedObject = null;
        
        document.getElementById('no-selection').style.display = 'block';
        document.getElementById('prop-panel').style.display = 'none';
    }
    
    duplicateSelected() {
        if (!this.selectedObject) return;
        
        const original = this.selectedObject;
        const data = original.userData;
        
        const config = {
            w: data.w,
            h: data.h,
            d: data.d,
            color: data.color,
            collision: data.collision,
            isRamp: data.isRamp,
            isCylinder: data.isCylinder,
            isLight: data.isLight
        };
        
        const mesh = this.createObjectMesh(data.type, config);
        mesh.position.copy(original.position);
        mesh.position.x += 10;
        mesh.rotation.copy(original.rotation);
        
        this.scene.add(mesh);
        this.objects.push(mesh);
        this.selectObject(mesh);
    }
    
    rotateSelected() {
        if (!this.selectedObject) return;
        // 每次旋转90度
        this.selectedObject.rotation.y += Math.PI / 2;
        // 标准化角度到 0-2π
        if (this.selectedObject.rotation.y >= Math.PI * 2) {
            this.selectedObject.rotation.y -= Math.PI * 2;
        }
        document.getElementById('prop-ry').value = Math.round(THREE.MathUtils.radToDeg(this.selectedObject.rotation.y));
    }
    
    // 旋转预览物件
    rotatePlacementPreview() {
        if (!this.placementPreview) return;
        // 每次旋转90度
        this.placementPreview.rotation.y += Math.PI / 2;
        // 标准化角度到 0-2π
        if (this.placementPreview.rotation.y >= Math.PI * 2) {
            this.placementPreview.rotation.y -= Math.PI * 2;
        }
    }
    
    getTypeName(type) {
        const names = {
            floor: '地板', wall: '墙面', roof: '房顶', box: '箱子', crate: '木箱',
            door: '门', bombsite_a: 'A点', bombsite_b: 'B点',
            spawn_ct: 'CT复活点', spawn_t: 'T复活点'
        };
        return names[type] || type;
    }

    newMap() {
        if (this.objects.length > 0 && !confirm('确定要新建地图吗？当前地图将被清空。')) {
            return;
        }
        
        this.objects.forEach(obj => this.scene.remove(obj));
        this.objects = [];
        this.deselectObject();
        document.getElementById('mapName').value = 'custom_map';
    }
    
    // 一键铺满地板
    addFullFloor() {
        const mapSize = parseInt(document.getElementById('mapSize').value) || 300;
        const floorConfig = this.objectTypes.floor;
        const tileSize = floorConfig.w; // 40
        
        // 从地图边界开始铺设，确保对齐
        for (let x = -mapSize + tileSize / 2; x <= mapSize - tileSize / 2; x += tileSize) {
            for (let z = -mapSize + tileSize / 2; z <= mapSize - tileSize / 2; z += tileSize) {
                const mesh = this.createObjectMesh('floor', floorConfig);
                mesh.position.set(x, floorConfig.h / 2, z);
                this.scene.add(mesh);
                this.objects.push(mesh);
            }
        }
    }
    
    // 一键添加围墙
    addBorderWalls() {
        const mapSize = parseInt(document.getElementById('mapSize').value) || 300;
        const wallConfig = this.objectTypes.wall;
        const wallLength = wallConfig.w; // 40
        
        // 从边界开始放置墙壁
        // 上下两边（沿X轴）- 墙面朝向Z轴，不需要旋转
        for (let x = -mapSize + wallLength / 2; x <= mapSize - wallLength / 2; x += wallLength) {
            // 上边
            const meshTop = this.createObjectMesh('wall', wallConfig);
            meshTop.position.set(x, wallConfig.h / 2, -mapSize);
            meshTop.rotation.y = 0;
            meshTop.userData.ry = 0;
            this.scene.add(meshTop);
            this.objects.push(meshTop);
            
            // 下边
            const meshBottom = this.createObjectMesh('wall', wallConfig);
            meshBottom.position.set(x, wallConfig.h / 2, mapSize);
            meshBottom.rotation.y = 0;
            meshBottom.userData.ry = 0;
            this.scene.add(meshBottom);
            this.objects.push(meshBottom);
        }
        
        // 左右两边（沿Z轴）- 墙面需要旋转90度
        for (let z = -mapSize + wallLength / 2; z <= mapSize - wallLength / 2; z += wallLength) {
            // 左边
            const meshLeft = this.createObjectMesh('wall', wallConfig);
            meshLeft.position.set(-mapSize, wallConfig.h / 2, z);
            meshLeft.rotation.y = Math.PI / 2;
            meshLeft.userData.ry = Math.PI / 2;
            this.scene.add(meshLeft);
            this.objects.push(meshLeft);
            
            // 右边
            const meshRight = this.createObjectMesh('wall', wallConfig);
            meshRight.position.set(mapSize, wallConfig.h / 2, z);
            meshRight.rotation.y = Math.PI / 2;
            meshRight.userData.ry = Math.PI / 2;
            this.scene.add(meshRight);
            this.objects.push(meshRight);
        }
    }
    
    // 整体旋转地图90度（顺时针）
    rotateMapBy90() {
        if (this.objects.length === 0) {
            alert('地图中没有物件可旋转');
            return;
        }
        
        // 旋转所有物件
        this.objects.forEach(obj => {
            // 保存原始位置
            const oldX = obj.position.x;
            const oldZ = obj.position.z;
            
            // 绕Y轴顺时针旋转90度：新X = 旧Z，新Z = -旧X
            obj.position.x = oldZ;
            obj.position.z = -oldX;
            
            // 物件自身也旋转90度
            obj.rotation.y += Math.PI / 2;
        });
        
        // 如果有选中的物件，更新属性面板
        if (this.selectedObject) {
            document.getElementById('prop-x').value = Math.round(this.selectedObject.position.x);
            document.getElementById('prop-z').value = Math.round(this.selectedObject.position.z);
            document.getElementById('prop-ry').value = Math.round(THREE.MathUtils.radToDeg(this.selectedObject.rotation.y));
        }
    }
    
    // 保存为JSON文件
    saveMapAsJson() {
        const mapName = document.getElementById('mapName').value || 'custom_map';
        const mapDisplayName = document.getElementById('mapDisplayName').value || '自定义地图';
        const mapSize = parseInt(document.getElementById('mapSize').value) || 300;
        
        // 获取选中的游戏模式
        const gameModeSelect = document.getElementById('gameMode');
        const selectedModes = Array.from(gameModeSelect.selectedOptions).map(opt => opt.value);
        const gameMode = selectedModes.length > 0 ? selectedModes : ['deathmatch'];
        
        // 构建地图数据
        const mapData = {
            name: mapName,
            displayName: mapDisplayName,
            gameMode: gameMode,
            mapSize: mapSize,
            floorColor1: '#c4a574',
            floorColor2: '#a68b5b',
            wallColor1: '#95a5a6',
            wallColor2: '#7f8c8d',
            skyColor: 0x6bb3d9,
            objects: []
        };
        
        // 分类物件
        const obstacles = [];
        const spawnsCT = [];
        const spawnsT = [];
        let bombSiteA = null;
        let bombSiteB = null;
        
        this.objects.forEach(obj => {
            const data = obj.userData;
            const item = {
                type: data.type,
                x: Math.round(obj.position.x),
                y: Math.round(obj.position.y),
                z: Math.round(obj.position.z),
                w: data.w,
                h: data.h,
                d: data.d,
                color: data.color,
                textureType: data.textureType
            };
            
            if (obj.rotation.y !== 0) {
                item.rotation = parseFloat(obj.rotation.y.toFixed(3));
            }
            
            mapData.objects.push(item);
            
            // 同时分类用于导出代码
            switch(data.type) {
                case 'bombsite_a':
                    bombSiteA = { x: item.x, z: item.z, radius: Math.max(item.w, item.d) / 2 };
                    break;
                case 'bombsite_b':
                    bombSiteB = { x: item.x, z: item.z, radius: Math.max(item.w, item.d) / 2 };
                    break;
                case 'spawn_ct':
                    spawnsCT.push({ x: item.x, z: item.z });
                    break;
                case 'spawn_t':
                    spawnsT.push({ x: item.x, z: item.z });
                    break;
            }
        });
        
        // 保存分类数据用于导出
        mapData.bombSites = {};
        if (bombSiteA) mapData.bombSites.A = bombSiteA;
        if (bombSiteB) mapData.bombSites.B = bombSiteB;
        mapData.spawnPoints = { ct: spawnsCT, t: spawnsT };
        
        // 下载JSON文件
        const jsonStr = JSON.stringify(mapData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${mapName}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // 导出代码（原saveMap功能）
    exportCode() {
        const mapName = document.getElementById('mapName').value || 'custom_map';
        const mapDisplayName = document.getElementById('mapDisplayName').value || '自定义地图';
        const mapSize = parseInt(document.getElementById('mapSize').value) || 300;
        
        // 获取选中的游戏模式
        const gameModeSelect = document.getElementById('gameMode');
        const selectedModes = Array.from(gameModeSelect.selectedOptions).map(opt => opt.value);
        const gameMode = selectedModes.length > 0 ? selectedModes : ['deathmatch'];
        
        // 分类物件
        const obstacles = [];
        const spawnsCT = [];
        const spawnsT = [];
        let bombSiteA = null;
        let bombSiteB = null;
        
        this.objects.forEach(obj => {
            const data = obj.userData;
            const item = {
                x: Math.round(obj.position.x),
                z: Math.round(obj.position.z),
                w: data.w,
                h: data.h,
                d: data.d
            };
            
            // 添加y坐标（物件中心高度）
            const yPos = Math.round(obj.position.y);
            if (yPos !== Math.round(data.h / 2)) {
                item.y = yPos;
            } else {
                item.y = Math.round(data.h / 2);
            }
            
            // 添加旋转（使用弧度）
            if (obj.rotation.y !== 0) {
                item.rotation = parseFloat(obj.rotation.y.toFixed(3));
            }
            
            // 添加颜色（地板始终导出颜色）
            if (data.type === 'floor' || data.color !== this.objectTypes[data.type]?.color) {
                item.color = data.color;
            }
            
            switch(data.type) {
                case 'bombsite_a':
                    bombSiteA = { x: item.x, z: item.z, radius: Math.max(item.w, item.d) / 2 };
                    break;
                case 'bombsite_b':
                    bombSiteB = { x: item.x, z: item.z, radius: Math.max(item.w, item.d) / 2 };
                    break;
                case 'spawn_ct':
                    spawnsCT.push({ x: item.x, z: item.z });
                    break;
                case 'spawn_t':
                    spawnsT.push({ x: item.x, z: item.z });
                    break;
                case 'floor':
                    // 地板也加入obstacles，带textureType
                    item.textureType = 'floor';
                    obstacles.push(item);
                    break;
                default:
                    // 所有其他物件都加入obstacles，带textureType（如果有）
                    if (data.textureType) {
                        item.textureType = data.textureType;
                    }
                    obstacles.push(item);
            }
        });
        
        // 生成代码 - 符合项目MapConfigs格式
        let code = `    '${mapName}': {\n`;
        code += `        displayName: '${mapDisplayName}',\n`;
        code += `        gameMode: [${gameMode.map(m => `'${m}'`).join(', ')}],\n`;
        code += `        floorColor1: '#c4a574',\n`;
        code += `        floorColor2: '#a68b5b',\n`;
        code += `        wallColor1: '#95a5a6',\n`;
        code += `        wallColor2: '#7f8c8d',\n`;
        code += `        skyColor: 0x6bb3d9,\n`;
        code += `        mapSize: ${mapSize},\n`;
        
        // obstacles数组
        code += `        obstacles: ${this.formatObstacles(obstacles)},\n`;
        
        // 爆破模式相关
        if (gameMode.includes('defuse')) {
            if (bombSiteA && bombSiteB) {
                code += `        bombSites: {\n`;
                code += `            A: { x: ${bombSiteA.x}, z: ${bombSiteA.z}, radius: ${bombSiteA.radius} },\n`;
                code += `            B: { x: ${bombSiteB.x}, z: ${bombSiteB.z}, radius: ${bombSiteB.radius} }\n`;
                code += `        },\n`;
            }
            
            if (spawnsCT.length > 0 || spawnsT.length > 0) {
                code += `        spawnPoints: {\n`;
                code += `            ct: ${this.formatSpawnPoints(spawnsCT)},\n`;
                code += `            t: ${this.formatSpawnPoints(spawnsT)}\n`;
                code += `        }\n`;
            }
        }
        
        code += `    }`;
        
        // 显示代码弹窗
        document.getElementById('code-output').value = code;
        document.getElementById('code-modal').classList.add('active');
    }
    
    // 格式化obstacles数组
    formatObstacles(arr) {
        if (arr.length === 0) return '[]';
        
        const items = arr.map(item => {
            const parts = [];
            // 按固定顺序输出属性
            parts.push(`x: ${item.x}`);
            if (item.y !== undefined) parts.push(`y: ${item.y}`);
            parts.push(`z: ${item.z}`);
            parts.push(`w: ${item.w}`);
            parts.push(`h: ${item.h}`);
            parts.push(`d: ${item.d}`);
            if (item.color !== undefined) parts.push(`color: 0x${item.color.toString(16).padStart(6, '0')}`);
            if (item.rotation !== undefined) parts.push(`rotation: ${item.rotation}`);
            if (item.textureType !== undefined) parts.push(`textureType: '${item.textureType}'`);
            return `{${parts.join(', ')}}`;
        });
        
        if (items.length <= 2) {
            return `[${items.join(', ')}]`;
        }
        
        return `[\n            ${items.join(',\n            ')}\n        ]`;
    }
    
    // 格式化出生点数组
    formatSpawnPoints(arr) {
        if (arr.length === 0) return '[]';
        const items = arr.map(item => `{x: ${item.x}, z: ${item.z}}`);
        if (items.length <= 3) {
            return `[${items.join(', ')}]`;
        }
        return `[\n                ${items.join(',\n                ')}\n            ]`;
    }
    
    loadMap() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.loadMapData(data);
                } catch (err) {
                    alert('加载地图失败: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    loadMapData(data) {
        this.newMap();
        
        // 兼容新格式（saveMapAsJson保存的格式）
        if (data.name) {
            document.getElementById('mapName').value = data.name;
        } else if (data.mapName) {
            document.getElementById('mapName').value = data.mapName;
        }
        
        if (data.displayName) {
            document.getElementById('mapDisplayName').value = data.displayName;
        }
        
        if (data.mapSize) {
            document.getElementById('mapSize').value = data.mapSize;
            this.updateMapSize(data.mapSize);
        } else if (data.size) {
            document.getElementById('mapSize').value = data.size;
            this.updateMapSize(data.size);
        }
        
        // 设置游戏模式
        if (data.gameMode && Array.isArray(data.gameMode)) {
            const gameModeSelect = document.getElementById('gameMode');
            Array.from(gameModeSelect.options).forEach(opt => {
                opt.selected = data.gameMode.includes(opt.value);
            });
        }
        
        // 新格式：使用objects数组
        if (data.objects && Array.isArray(data.objects)) {
            data.objects.forEach(obj => {
                this.loadObjectNew(obj);
            });
        } else {
            // 旧格式：分开的数组
            if (data.walls) {
                data.walls.forEach(w => this.loadObject('wall', w));
            }
            if (data.floors) {
                data.floors.forEach(f => this.loadObject('floor', f));
            }
            if (data.boxes) {
                data.boxes.forEach(b => this.loadObject(b.type || 'box', b));
            }
            if (data.decorations) {
                data.decorations.forEach(d => this.loadObject(d.type, d));
            }
            if (data.spawnsCT) {
                data.spawnsCT.forEach(s => this.loadObject('spawn_ct', s));
            }
            if (data.spawnsT) {
                data.spawnsT.forEach(s => this.loadObject('spawn_t', s));
            }
            if (data.bombSiteA) {
                this.loadObject('bombsite_a', { x: data.bombSiteA.x, z: data.bombSiteA.z, w: data.bombSiteA.radius * 2, d: data.bombSiteA.radius * 2 });
            }
            if (data.bombSiteB) {
                this.loadObject('bombsite_b', { x: data.bombSiteB.x, z: data.bombSiteB.z, w: data.bombSiteB.radius * 2, d: data.bombSiteB.radius * 2 });
            }
        }
    }
    
    // 加载新格式的物件（saveMapAsJson保存的格式）
    loadObjectNew(objData) {
        const type = objData.type;
        const baseConfig = this.objectTypes[type];
        if (!baseConfig) {
            console.warn('未知物件类型:', type);
            return;
        }
        
        const config = {
            w: objData.w || baseConfig.w,
            h: objData.h || baseConfig.h,
            d: objData.d || baseConfig.d,
            color: objData.color !== undefined ? objData.color : baseConfig.color,
            collision: baseConfig.collision,
            isRamp: baseConfig.isRamp,
            isCylinder: baseConfig.isCylinder,
            isLight: baseConfig.isLight,
            transparent: baseConfig.transparent,
            textureType: baseConfig.textureType
        };
        
        const mesh = this.createObjectMesh(type, config);
        mesh.position.x = objData.x || 0;
        mesh.position.z = objData.z || 0;
        
        // Y位置：如果保存了y值则使用，否则使用默认高度
        if (objData.y !== undefined) {
            mesh.position.y = objData.y;
        } else {
            mesh.position.y = config.isRamp ? 0 : config.h / 2;
        }
        
        // 旋转：新格式使用弧度
        if (objData.rotation !== undefined) {
            mesh.rotation.y = objData.rotation;
        }
        
        this.scene.add(mesh);
        this.objects.push(mesh);
    }
    
    loadObject(type, data) {
        const baseConfig = this.objectTypes[type];
        if (!baseConfig) return;
        
        const config = {
            w: data.w || baseConfig.w,
            h: data.h || baseConfig.h,
            d: data.d || baseConfig.d,
            color: data.color ? parseInt(data.color) : baseConfig.color,
            collision: baseConfig.collision,
            isRamp: data.isRamp || baseConfig.isRamp,
            isCylinder: data.isCylinder || baseConfig.isCylinder,
            isLight: baseConfig.isLight,
            transparent: baseConfig.transparent
        };
        
        const mesh = this.createObjectMesh(type, config);
        mesh.position.x = data.x || 0;
        mesh.position.z = data.z || 0;
        mesh.position.y = config.h / 2;
        
        if (data.ry) {
            mesh.rotation.y = THREE.MathUtils.degToRad(data.ry);
        }
        
        this.scene.add(mesh);
        this.objects.push(mesh);
    }
    
    testView() {
        // 切换到第一人称测试视角
        this.isTestMode = !this.isTestMode;
        
        if (this.isTestMode) {
            // 进入第一人称模式
            this.savedCameraState = {
                distance: this.cameraDistance,
                angleX: this.cameraAngleX,
                angleY: this.cameraAngleY,
                target: this.cameraTarget.clone()
            };
            
            this.camera.position.set(0, 10, 0);
            this.testYaw = 0;
            this.testPitch = 0;
            
            // 请求鼠标锁定
            document.getElementById('canvas').requestPointerLock();
            document.getElementById('testMap').textContent = '退出测试';
            document.getElementById('help').textContent = 'WASD: 移动 | 鼠标: 视角 | ESC: 退出测试模式';
        } else {
            // 退出第一人称模式
            document.exitPointerLock();
            if (this.savedCameraState) {
                this.cameraDistance = this.savedCameraState.distance;
                this.cameraAngleX = this.savedCameraState.angleX;
                this.cameraAngleY = this.savedCameraState.angleY;
                this.cameraTarget.copy(this.savedCameraState.target);
                this.updateCameraPosition();
            }
            document.getElementById('testMap').textContent = '测试视角';
            document.getElementById('help').textContent = 'WASD: 移动 | 鼠标右键: 旋转视角 | 滚轮: 缩放 | 左键: 选择/放置 | Delete: 删除 | R: 旋转物件';
        }
    }
    
    onTestMouseMove(e) {
        if (!this.isTestMode || !document.pointerLockElement) return;
        
        const sensitivity = 0.002;
        this.testYaw -= e.movementX * sensitivity;
        this.testPitch -= e.movementY * sensitivity;
        this.testPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.testPitch));
        
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.testYaw;
        this.camera.rotation.x = this.testPitch;
    }
    
    updateTestMovement() {
        if (!this.isTestMode) return;
        
        const moveSpeed = 2;
        const direction = new THREE.Vector3();
        
        if (this.keys['KeyW']) {
            direction.z -= 1;
        }
        if (this.keys['KeyS']) {
            direction.z += 1;
        }
        if (this.keys['KeyA']) {
            direction.x -= 1;
        }
        if (this.keys['KeyD']) {
            direction.x += 1;
        }
        
        if (direction.length() > 0) {
            direction.normalize();
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.testYaw);
            this.camera.position.add(direction.multiplyScalar(moveSpeed));
        }
    }
    
    copyCode() {
        const textarea = document.getElementById('code-output');
        textarea.select();
        document.execCommand('copy');
        alert('代码已复制到剪贴板！');
    }
    
    closeModal() {
        document.getElementById('code-modal').classList.remove('active');
    }
    
    showPresetModal() {
        document.getElementById('preset-modal').classList.add('active');
    }
    
    closePresetModal() {
        document.getElementById('preset-modal').classList.remove('active');
    }
    
    async loadPresetMap(mapName) {
        try {
            const response = await fetch(`maps/${mapName}.json`);
            if (!response.ok) {
                throw new Error('地图文件不存在');
            }
            const data = await response.json();
            this.loadMapData(data);
        } catch (error) {
            alert('加载预设地图失败: ' + error.message);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 第一人称测试模式移动
        if (this.isTestMode) {
            this.updateTestMovement();
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        // 编辑模式：键盘移动相机目标点
        const moveSpeed = 3;
        if (this.keys['KeyW']) {
            this.cameraTarget.z -= moveSpeed * Math.cos(this.cameraAngleY);
            this.cameraTarget.x -= moveSpeed * Math.sin(this.cameraAngleY);
        }
        if (this.keys['KeyS']) {
            this.cameraTarget.z += moveSpeed * Math.cos(this.cameraAngleY);
            this.cameraTarget.x += moveSpeed * Math.sin(this.cameraAngleY);
        }
        if (this.keys['KeyA']) {
            this.cameraTarget.x -= moveSpeed * Math.cos(this.cameraAngleY);
            this.cameraTarget.z += moveSpeed * Math.sin(this.cameraAngleY);
        }
        if (this.keys['KeyD']) {
            this.cameraTarget.x += moveSpeed * Math.cos(this.cameraAngleY);
            this.cameraTarget.z -= moveSpeed * Math.sin(this.cameraAngleY);
        }
        
        if (this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD']) {
            this.updateCameraPosition();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    // ========== 云存储功能 ==========
    
    // 获取当前地图数据（复用saveMapAsJson的逻辑）
    getMapData() {
        const mapName = document.getElementById('mapName').value || 'custom_map';
        const mapDisplayName = document.getElementById('mapDisplayName').value || '自定义地图';
        const mapSize = parseInt(document.getElementById('mapSize').value) || 300;
        
        const gameModeSelect = document.getElementById('gameMode');
        const selectedModes = Array.from(gameModeSelect.selectedOptions).map(opt => opt.value);
        const gameMode = selectedModes.length > 0 ? selectedModes : ['deathmatch'];
        
        const mapData = {
            name: mapName,
            displayName: mapDisplayName,
            gameMode: gameMode,
            mapSize: mapSize,
            floorColor1: '#c4a574',
            floorColor2: '#a68b5b',
            wallColor1: '#95a5a6',
            wallColor2: '#7f8c8d',
            skyColor: 0x6bb3d9,
            objects: [],
            bombSites: {},
            spawnPoints: { ct: [], t: [] }
        };
        
        const spawnsCT = [];
        const spawnsT = [];
        let bombSiteA = null;
        let bombSiteB = null;
        
        this.objects.forEach(obj => {
            const data = obj.userData;
            const item = {
                type: data.type,
                x: Math.round(obj.position.x),
                y: Math.round(obj.position.y),
                z: Math.round(obj.position.z),
                w: data.w,
                h: data.h,
                d: data.d,
                color: data.color,
                textureType: data.textureType
            };
            
            if (obj.rotation.y !== 0) {
                item.rotation = parseFloat(obj.rotation.y.toFixed(3));
            }
            
            mapData.objects.push(item);
            
            switch(data.type) {
                case 'bombsite_a':
                    bombSiteA = { x: item.x, z: item.z, radius: Math.max(item.w, item.d) / 2 };
                    break;
                case 'bombsite_b':
                    bombSiteB = { x: item.x, z: item.z, radius: Math.max(item.w, item.d) / 2 };
                    break;
                case 'spawn_ct':
                    spawnsCT.push({ x: item.x, z: item.z });
                    break;
                case 'spawn_t':
                    spawnsT.push({ x: item.x, z: item.z });
                    break;
            }
        });
        
        if (bombSiteA) mapData.bombSites.A = bombSiteA;
        if (bombSiteB) mapData.bombSites.B = bombSiteB;
        mapData.spawnPoints = { ct: spawnsCT, t: spawnsT };
        
        return mapData;
    }
    
    // 显示云端保存确认弹窗
    showCloudSaveModal() {
        const mapData = this.getMapData();
        document.getElementById('cloud-save-id').textContent = mapData.name;
        document.getElementById('cloud-save-name').textContent = mapData.displayName;
        document.getElementById('cloud-save-count').textContent = this.objects.length + ' 个';
        document.getElementById('cloud-save-status').style.display = 'none';
        document.getElementById('cloud-save-modal').classList.add('active');
    }
    
    // 关闭云端保存弹窗
    closeCloudSaveModal() {
        document.getElementById('cloud-save-modal').classList.remove('active');
    }
    
    // 确认保存到云端
    async confirmCloudSave() {
        const statusEl = document.getElementById('cloud-save-status');
        const confirmBtn = document.getElementById('confirm-cloud-save');
        const password = document.getElementById('cloud-save-password').value;
        
        if (!password) {
            statusEl.textContent = '✗ 请输入密码';
            statusEl.className = 'cloud-status error';
            statusEl.style.display = 'block';
            return;
        }
        
        statusEl.textContent = '正在保存...';
        statusEl.className = 'cloud-status';
        statusEl.style.display = 'block';
        confirmBtn.disabled = true;
        
        try {
            const mapData = this.getMapData();
            // 生成缩略图
            mapData.thumbnail = this.generateThumbnail();
            const result = await MapCloudService.saveMap(mapData, password);
            
            statusEl.textContent = '✓ 保存成功！';
            statusEl.className = 'cloud-status success';
            
            setTimeout(() => {
                this.closeCloudSaveModal();
            }, 1000);
        } catch (err) {
            statusEl.textContent = '✗ ' + err.message;
            statusEl.className = 'cloud-status error';
        } finally {
            confirmBtn.disabled = false;
        }
    }
    
    // 生成地图缩略图
    generateThumbnail() {
        try {
            // 保存当前相机状态
            const oldPos = this.camera.position.clone();
            const oldTarget = this.cameraTarget.clone();
            const oldAngleX = this.cameraAngleX;
            const oldAngleY = this.cameraAngleY;
            const oldDistance = this.cameraDistance;
            
            // 获取地图大小
            const mapSize = parseInt(document.getElementById('mapSize').value) || 300;
            
            // 设置俯视角度，根据地图大小调整高度
            const cameraHeight = mapSize * 1.5;
            this.camera.position.set(0, cameraHeight, cameraHeight * 0.3);
            this.camera.lookAt(0, 0, 0);
            
            // 强制渲染一帧
            this.renderer.render(this.scene, this.camera);
            
            // 获取图像数据（使用较低质量减少数据量）
            const dataUrl = this.renderer.domElement.toDataURL('image/jpeg', 0.4);
            
            // 恢复相机状态
            this.camera.position.copy(oldPos);
            this.cameraTarget.copy(oldTarget);
            this.cameraAngleX = oldAngleX;
            this.cameraAngleY = oldAngleY;
            this.cameraDistance = oldDistance;
            this.updateCameraPosition();
            
            console.log('缩略图生成成功，大小:', Math.round(dataUrl.length / 1024), 'KB');
            return dataUrl;
        } catch (e) {
            console.error('生成缩略图失败:', e);
            return null;
        }
    }
    
    // 显示云端地图列表弹窗
    showCloudModal() {
        document.getElementById('cloud-modal').classList.add('active');
        this.loadCloudMapList();
    }
    
    // 关闭云端地图弹窗
    closeCloudModal() {
        document.getElementById('cloud-modal').classList.remove('active');
    }
    
    // 加载云端地图列表
    async loadCloudMapList() {
        const loadingEl = document.getElementById('cloud-loading');
        const errorEl = document.getElementById('cloud-error');
        const emptyEl = document.getElementById('cloud-empty');
        const listEl = document.getElementById('cloud-list');
        
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        emptyEl.style.display = 'none';
        listEl.innerHTML = '';
        
        try {
            const maps = await MapCloudService.listMaps();
            loadingEl.style.display = 'none';
            
            if (maps.length === 0) {
                emptyEl.style.display = 'block';
                return;
            }
            
            maps.forEach(map => {
                const item = document.createElement('div');
                item.className = 'cloud-map-item';
                
                const timeStr = map.updatedAt ? new Date(map.updatedAt).toLocaleString('zh-CN') : '';
                const likes = map.likes || 0;
                const thumbnail = map.thumbnail || '';
                
                item.innerHTML = `
                    ${thumbnail ? `<div class="cloud-map-thumbnail"><img src="${thumbnail}" alt="缩略图"></div>` : '<div class="cloud-map-thumbnail no-thumb">无预览</div>'}
                    <div class="cloud-map-info">
                        <div class="cloud-map-name">${this.escapeHtml(map.displayName || map.name)}</div>
                        <div class="cloud-map-id">${this.escapeHtml(map.id)}</div>
                        ${timeStr ? `<div class="cloud-map-time">${timeStr}</div>` : ''}
                    </div>
                    <div class="cloud-map-actions">
                        <button class="tool-btn cloud-like-btn" data-id="${this.escapeHtml(map.id)}">👍 <span class="like-count">${likes}</span></button>
                        <button class="tool-btn primary cloud-load-btn" data-id="${this.escapeHtml(map.id)}">加载</button>
                    </div>
                `;
                
                listEl.appendChild(item);
            });
            
            // 绑定加载按钮事件
            listEl.querySelectorAll('.cloud-load-btn').forEach(btn => {
                btn.addEventListener('click', () => this.loadCloudMap(btn.dataset.id));
            });
            
            listEl.querySelectorAll('.cloud-like-btn').forEach(btn => {
                btn.addEventListener('click', () => this.likeCloudMap(btn.dataset.id, btn));
            });
            
        } catch (err) {
            loadingEl.style.display = 'none';
            errorEl.textContent = err.message;
            errorEl.style.display = 'block';
        }
    }
    
    // 点赞云端地图
    async likeCloudMap(mapId, btn) {
        try {
            btn.disabled = true;
            const result = await MapCloudService.likeMap(mapId);
            const countEl = btn.querySelector('.like-count');
            if (countEl) {
                countEl.textContent = result.likes;
            }
        } catch (err) {
            alert('点赞失败: ' + err.message);
        } finally {
            btn.disabled = false;
        }
    }
    
    // 加载云端地图
    async loadCloudMap(mapId) {
        try {
            const mapData = await MapCloudService.getMap(mapId);
            this.loadMapData(mapData);
            this.closeCloudModal();
        } catch (err) {
            alert('加载失败: ' + err.message);
        }
    }
    
    // 删除云端地图
    async deleteCloudMap(mapId) {
        if (!confirm(`确定要删除地图 "${mapId}" 吗？此操作不可恢复。`)) {
            return;
        }
        
        try {
            await MapCloudService.deleteMap(mapId);
            this.loadCloudMapList(); // 刷新列表
        } catch (err) {
            alert('删除失败: ' + err.message);
        }
    }
    
    // HTML转义
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// 启动编辑器
window.addEventListener('DOMContentLoaded', () => {
    window.editor = new MapEditor();
});
