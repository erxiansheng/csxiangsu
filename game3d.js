// CS 1.6 像素风格 3D FPS 游戏 - 主模块

// ==================== 服务器配置 ====================
// 默认服务器地址，可在页面上配置覆盖
const DEFAULT_WS_SERVER_URL = 'wss://cs16xs.188np.cn';
// 从localStorage读取自定义服务器地址，如果没有则使用默认地址
let WS_SERVER_URL = localStorage.getItem('cs_server_url') || DEFAULT_WS_SERVER_URL;
// ===================================================

class PixelCS3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.ws = null;
        this.playerId = null;
        this.players = {};
        this.playerMeshes = {};
        this.walls = [];
        this.keys = {};
        this.velocity = new THREE.Vector3();
        this.isLocked = false;
        this.canJump = true;
        this.pitch = 0;
        this.yaw = 0;
        
        this.targetKills = 20;
        this.selectedTeam = 'ct';
        this.selectedMap = 'indoor';
        this.selectedGameMode = 'deathmatch';
        this.isCreating = false;
        this.gameOver = false;
        this.ctKills = 0;
        this.tKills = 0;
        this.remainingTime = -1;
        
        // 鼠标移动累积值
        this.pendingMouseX = 0;
        this.pendingMouseY = 0;
        
        this.isCrouching = false;
        this.standingHeight = 10;
        this.crouchingHeight = 6;
        this.currentHeight = 10;
        this.currentStandingHeight = 0;
        this.targetCameraHeight = 10;
        
        this.primaryWeapon = 'ak47';
        this.secondaryWeapon = 'pistol';
        this.currentWeapon = 'ak47';
        this.previousWeapon = 'pistol';
        this.grenadeCount = 1;
        
        this.gunModel = null;
        this.gunBasePosition = null;
        this.gunBaseRotation = null;
        this.gunRecoil = 0;
        this.recoilAccumulator = 0;
        this.weaponRecoil = 0.08;
        this.isReloading = false;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.fireRate = 100;
        this.lastShot = 0;
        this.lastShotReleaseTime = 0;
        this.isFiring = false;
        this.shotsFired = 0;
        this.screenShake = 0;
        this.reloadAnimProgress = 0;
        this.isSwitchingWeapon = false;
        this.switchAnimProgress = 0;
        
        this.crosshairOffset = 0;
        this.isScoped = false;
        this.scopeLevel = 0; // 0=无开镜, 1=一倍镜, 2=二倍镜
        this.normalFOV = 75;
        this.scopedFOV1 = 30;  // 一倍镜FOV
        this.scopedFOV2 = 15;  // 二倍镜FOV
        this.buyMenuOpen = false;
        this.settingsMenuOpen = false;
        this.respawnTimer = null;
        this.respawnCountdown = 3;
        
        // 灵敏度设置
        this.baseSensitivity = 0.002;
        this.sensitivityMultiplier = 1.0;
        this.scopeSensitivityMultiplier = 0.6;
        this.scopeSensitivityMultiplier2 = 0.3; // 二倍镜灵敏度更低
        this.masterVolume = 1.0;
        
        // 连杀追踪
        this.killStreak = 0;
        this.lastKillTime = 0;
        this.killStreakTimeout = 5000;
        
        // 帧率控制
        this.targetFPS = 120;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        
        // FPS 计数器
        this.fpsFrameCount = 0;
        this.fpsLastTime = 0;
        this.currentFPS = 0;
        
        // 网络发送节流
        this.lastNetworkSend = 0;
        this.networkSendInterval = 33;
        
        // 小地图
        this.minimap = null;
        
        // 爆破模式相关
        this.isDefuseMode = false;
        this.hasC4 = false;
        this.c4Planted = false;
        this.c4Position = null;
        this.c4Site = null;
        this.isPlanting = false;
        this.isDefusing = false;
        this.plantProgress = 0;
        this.defuseProgress = 0;
        this.plantInterval = null;
        this.c4Model = null;
        this.c4Light = null;
        this.c4Glow = null;
        this.c4Beam = null;
        
        // 自定义地图
        this.customMapData = null;
        
        // 观战模式
        this.isSpectating = false;
        this.spectatingPlayerId = null;
        this.spectatorTargets = [];
        
        this.audio = new AudioSystem();
        this.weaponBuilder = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('joinBtn').addEventListener('click', () => this.joinGame());
        document.getElementById('createBtn').addEventListener('click', () => this.createGame());
        document.getElementById('teamCT').addEventListener('click', () => this.selectTeam('ct'));
        document.getElementById('teamT').addEventListener('click', () => this.selectTeam('t'));
        document.getElementById('tabJoin').addEventListener('click', () => this.switchTab(false));
        document.getElementById('tabCreate').addEventListener('click', () => this.switchTab(true));
        
        document.getElementById('gameMode').addEventListener('change', (e) => this.onGameModeChange(e.target.value));
        
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', () => this.buyPrimaryWeapon(btn.dataset.weapon));
        });
        
        document.addEventListener('keydown', (e) => this.onKeyDown(e), { capture: true });
        document.addEventListener('keyup', (e) => this.onKeyUp(e), { capture: true });
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement !== null;
            if (!this.isLocked) this.isFiring = false;
        });
        
        this.preloadMaps();
        this.loadAnnouncement();
        this.initCustomMapImport();
        this.initServerConfig();
    }
    
    // 初始化服务器配置
    initServerConfig() {
        const serverUrlInput = document.getElementById('serverUrl');
        const saveServerBtn = document.getElementById('saveServerBtn');
        const currentServerSpan = document.getElementById('currentServer');
        
        if (!serverUrlInput || !saveServerBtn) return;
        
        // 显示当前服务器地址
        const savedUrl = localStorage.getItem('cs_server_url');
        if (savedUrl) {
            serverUrlInput.value = savedUrl;
            currentServerSpan.textContent = '当前: ' + savedUrl;
        } else {
            currentServerSpan.textContent = '当前: 默认服务器';
        }
        
        saveServerBtn.addEventListener('click', () => {
            const url = serverUrlInput.value.trim();
            if (url) {
                // 验证URL格式
                if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
                    alert('服务器地址必须以 ws:// 或 wss:// 开头');
                    return;
                }
                localStorage.setItem('cs_server_url', url);
                WS_SERVER_URL = url;
                currentServerSpan.textContent = '当前: ' + url;
                alert('服务器地址已保存');
            } else {
                // 清除自定义服务器，使用默认
                localStorage.removeItem('cs_server_url');
                WS_SERVER_URL = DEFAULT_WS_SERVER_URL;
                currentServerSpan.textContent = '当前: 默认服务器';
                alert('已恢复默认服务器');
            }
        });
    }
    
    async loadAnnouncement() {
        const announcementEl = document.getElementById('announcement-content');
        if (!announcementEl) return;
        
        try {
            const tempWs = new WebSocket(WS_SERVER_URL);
            tempWs.onopen = () => { tempWs.send(JSON.stringify({ action: 'get_announcement' })); };
            tempWs.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.action === 'announcement') this.displayAnnouncement(data);
                } catch (e) { console.log('解析公告失败'); }
                tempWs.close();
            };
            tempWs.onerror = () => { this.displayDefaultAnnouncement(); };
            setTimeout(() => {
                if (tempWs.readyState === WebSocket.OPEN || tempWs.readyState === WebSocket.CONNECTING) {
                    tempWs.close();
                    this.displayDefaultAnnouncement();
                }
            }, 3000);
        } catch (error) {
            this.displayDefaultAnnouncement();
        }
    }
    
    displayAnnouncement(data) {
        const announcementEl = document.getElementById('announcement-content');
        if (!announcementEl) return;
        let html = '';
        if (data.announcements && data.announcements.length > 0) {
            data.announcements.forEach(item => {
                html += `<div class="announcement-item"><span class="announcement-date">${item.date || ''}</span><p class="announcement-text">${item.content}</p></div>`;
            });
        } else {
            this.displayDefaultAnnouncement();
            return;
        }
        announcementEl.innerHTML = html;
    }
    
    displayDefaultAnnouncement() {
        const announcementEl = document.getElementById('announcement-content');
        if (!announcementEl) return;
        announcementEl.innerHTML = `
            <div class="announcement-item"><span class="announcement-date">2024-12-28</span><p class="announcement-text">🎉 欢迎来到 CS 1.6 像素版！</p></div>
            <div class="announcement-item"><span class="announcement-date">2024-12-28</span><p class="announcement-text">🔫 新增武器：AK47、M4A1、AWP</p></div>
            <div class="announcement-item"><span class="announcement-date">2024-12-28</span><p class="announcement-text">🗺️ 多张经典地图可选</p></div>
            <div class="announcement-item"><span class="announcement-date">2024-12-28</span><p class="announcement-text">⚡ 支持下蹲跳跃操作</p></div>
        `;
    }
    
    preloadMaps() {
        const loadingText = document.createElement('div');
        loadingText.id = 'preload-status';
        loadingText.style.cssText = 'position:fixed;bottom:10px;left:10px;color:#0f0;font-size:12px;font-family:monospace;z-index:9999;';
        loadingText.textContent = '正在预加载地图资源...';
        document.body.appendChild(loadingText);
        
        const doPreload = () => {
            preloadAllMaps(
                (progress, mapName) => { loadingText.textContent = `预加载地图: ${mapName} (${progress}%)`; },
                () => { loadingText.textContent = '✓ 地图资源加载完成'; setTimeout(() => loadingText.remove(), 2000); }
            );
        };
        
        if (window.requestIdleCallback) {
            requestIdleCallback(doPreload, { timeout: 1000 });
        } else {
            setTimeout(doPreload, 100);
        }
    }
    
    onKeyDown(e) {
        if (this.isLocked) {
            if (e.ctrlKey || e.code === 'ControlLeft' || e.code === 'ControlRight') {
                e.preventDefault();
                e.stopPropagation();
            }
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyR', 'KeyQ', 'KeyB'].includes(e.code)) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
        
        this.keys[e.code] = true;
        
        if (e.code === 'KeyR' && !this.isReloading && this.currentWeapon !== 'knife' && this.currentWeapon !== 'grenade') {
            const config = WeaponConfigs[this.currentWeapon];
            if (this.ammo < config.ammo) this.reload();
        }
        
        if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
            e.preventDefault();
            this.setCrouch(true);
        }
        
        if (!this.buyMenuOpen && !this.settingsMenuOpen) {
            if (e.code === 'Digit1') this.switchToSlot(1);
            if (e.code === 'Digit2') this.switchToSlot(2);
            if (e.code === 'Digit3') this.switchToSlot(3);
            if (e.code === 'Digit4') this.switchToSlot(4);
            // C4切换 - 按5切出C4
            if (e.code === 'Digit5') this.switchToC4();
        }
        if (e.code === 'KeyQ') this.switchToPrevious();
        if (e.code === 'KeyB') this.toggleBuyMenu();
        if (e.code === 'Escape') this.toggleSettingsMenu();
        
        // 爆破模式：E键安放/拆弹 - 持续按住
        if (e.code === 'KeyE' && this.isDefuseMode && !e.repeat) {
            if (this.hasC4 && this.selectedTeam === 't') {
                this.startPlantingC4();
            } else if (this.c4Planted && this.selectedTeam === 'ct') {
                this.tryDefuse();
            }
        }
        
        if (this.buyMenuOpen) {
            if (e.code === 'Digit1') { this.buyPrimaryWeapon('ak47'); e.preventDefault(); }
            if (e.code === 'Digit2') { this.buyPrimaryWeapon('m4a1'); e.preventDefault(); }
            if (e.code === 'Digit3') { this.buyPrimaryWeapon('awp'); e.preventDefault(); }
        }
    }
    
    // 切换到C4
    switchToC4() {
        if (!this.isDefuseMode || !this.hasC4) return;
        if (this.isReloading || this.isSwitchingWeapon) return;
        if (this.currentWeapon === 'c4') return;
        this.startWeaponSwitch('c4');
    }
    
    onKeyUp(e) {
        this.keys[e.code] = false;
        if (e.code === 'ControlLeft' || e.code === 'ControlRight') this.setCrouch(false);
        // E键松开时取消拆弹或下包
        if (e.code === 'KeyE') {
            if (this.isDefusing) this.cancelDefuse();
            if (this.isPlanting) this.cancelPlanting();
        }
    }
    
    onMouseDown(e) {
        if (this.buyMenuOpen || !this.isLocked) return;
        if (e.button === 0) {
            // 观战模式下，左键切换观战目标
            if (this.isSpectating) {
                this.switchSpectatorTarget();
                return;
            }
            // 鼠标左键下包支持 - 当持有C4且在包点时，开始下包读条
            if (this.isDefuseMode && this.currentWeapon === 'c4' && this.hasC4 && !this.c4Planted) {
                const site = this.isInBombSite();
                if (site) {
                    this.startPlantingC4();
                    return;
                }
            }
            // 非C4武器或不在包点时正常射击
            if (this.currentWeapon !== 'c4') {
                this.isFiring = true;
                const config = WeaponConfigs[this.currentWeapon];
                if (!config || !config.auto) this.shoot();
            }
        }
        if (e.button === 2) this.toggleScope();
    }
    
    onMouseUp(e) {
        if (e.button === 0) {
            this.isFiring = false;
            this.lastShotReleaseTime = Date.now();
            // 松开鼠标左键时取消下包（如果正在下包）
            if (this.isPlanting) {
                this.cancelPlanting();
            }
        }
    }
    
    onMouseMove(e) {
        if (!this.isLocked || this.buyMenuOpen || this.settingsMenuOpen) return;
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;
        if (Math.abs(movementX) > 200 || Math.abs(movementY) > 200) return;
        this.pendingMouseX += movementX;
        this.pendingMouseY += movementY;
    }
    
    processMouseMovement() {
        if (this.pendingMouseX === 0 && this.pendingMouseY === 0) return;
        const baseSens = this.baseSensitivity * this.sensitivityMultiplier;
        // 根据开镜等级调整灵敏度
        let sensitivity = baseSens;
        if (this.scopeLevel === 1) {
            sensitivity = baseSens * this.scopeSensitivityMultiplier;
        } else if (this.scopeLevel === 2) {
            sensitivity = baseSens * this.scopeSensitivityMultiplier2;
        }
        this.yaw -= this.pendingMouseX * sensitivity;
        this.pitch -= this.pendingMouseY * sensitivity;
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        this.pendingMouseX = 0;
        this.pendingMouseY = 0;
    }

    switchTab(isCreate) {
        this.isCreating = isCreate;
        document.getElementById('tabJoin').classList.toggle('active', !isCreate);
        document.getElementById('tabCreate').classList.toggle('active', isCreate);
        document.getElementById('createOptions').style.display = isCreate ? 'block' : 'none';
        document.getElementById('joinBtn').style.display = isCreate ? 'none' : 'block';
        document.getElementById('createBtn').style.display = isCreate ? 'block' : 'none';
    }
    
    selectTeam(team) {
        this.selectedTeam = team;
        document.getElementById('teamCT').classList.toggle('active', team === 'ct');
        document.getElementById('teamT').classList.toggle('active', team === 't');
    }
    
    onGameModeChange(mode) {
        const targetKillsGroup = document.getElementById('targetKillsGroup');
        const mapSelectGroup = document.getElementById('mapSelectGroup');
        const customMapGroup = document.getElementById('customMapGroup');
        const mapSelect = document.getElementById('mapSelect');
        
        // 更新地图选择
        updateMapSelect(mode === 'custom' ? 'deathmatch' : mode);
        
        if (mode === 'defuse') {
            targetKillsGroup.style.display = 'none';
            mapSelectGroup.style.display = 'block';
            customMapGroup.style.display = 'none';
        } else if (mode === 'custom') {
            // 自定义模式：显示导入按钮，隐藏地图选择
            mapSelectGroup.style.display = 'none';
            customMapGroup.style.display = 'block';
            // 默认隐藏击杀数，导入后根据地图模式决定
            targetKillsGroup.style.display = 'none';
        } else {
            targetKillsGroup.style.display = 'block';
            mapSelectGroup.style.display = 'block';
            customMapGroup.style.display = 'none';
        }
    }
    
    // 初始化自定义地图导入
    initCustomMapImport() {
        const fileInput = document.getElementById('customMapFile');
        const importBtn = document.getElementById('importMapBtn');
        
        if (!fileInput || !importBtn) return;
        
        importBtn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const mapData = JSON.parse(event.target.result);
                    const validationResult = this.validateCustomMap(mapData);
                    if (!validationResult.valid) {
                        alert('地图文件格式错误: ' + validationResult.error);
                        fileInput.value = '';
                        document.getElementById('customMapName').textContent = '未选择文件';
                        return;
                    }
                    this.loadCustomMap(mapData);
                    document.getElementById('customMapName').textContent = file.name;
                } catch (err) {
                    alert('地图文件解析失败: JSON格式错误');
                    fileInput.value = '';
                    document.getElementById('customMapName').textContent = '未选择文件';
                    console.error('地图加载失败:', err);
                }
            };
            reader.readAsText(file);
        });
    }
    
    // 校验自定义地图格式
    validateCustomMap(mapData) {
        // 检查必要字段
        if (!mapData || typeof mapData !== 'object') {
            return { valid: false, error: '无效的地图数据' };
        }
        
        // 检查地图名称
        if (!mapData.name || typeof mapData.name !== 'string' || mapData.name.trim() === '') {
            return { valid: false, error: '缺少地图名称(name)' };
        }
        
        // 检查地图大小
        if (mapData.mapSize !== undefined) {
            if (typeof mapData.mapSize !== 'number' || mapData.mapSize < 50 || mapData.mapSize > 1000) {
                return { valid: false, error: '地图大小(mapSize)必须在50-1000之间' };
            }
        }
        
        // 检查游戏模式
        if (mapData.gameMode !== undefined) {
            if (!Array.isArray(mapData.gameMode)) {
                return { valid: false, error: '游戏模式(gameMode)必须是数组' };
            }
            const validModes = ['deathmatch', 'defuse'];
            for (const mode of mapData.gameMode) {
                if (!validModes.includes(mode)) {
                    return { valid: false, error: '无效的游戏模式: ' + mode };
                }
            }
        }
        
        // 检查objects数组
        if (mapData.objects !== undefined) {
            if (!Array.isArray(mapData.objects)) {
                return { valid: false, error: '物体列表(objects)必须是数组' };
            }
            for (let i = 0; i < mapData.objects.length; i++) {
                const obj = mapData.objects[i];
                if (!obj || typeof obj !== 'object') {
                    return { valid: false, error: `物体[${i}]格式无效` };
                }
                // 检查必要的坐标和尺寸
                if (typeof obj.x !== 'number' || typeof obj.z !== 'number') {
                    return { valid: false, error: `物体[${i}]缺少有效坐标(x,z)` };
                }
            }
        }
        
        // 检查爆破模式必要的包点和出生点
        if (mapData.gameMode && mapData.gameMode.includes('defuse')) {
            if (!mapData.bombSites || typeof mapData.bombSites !== 'object') {
                return { valid: false, error: '爆破模式需要包点配置(bombSites)' };
            }
            if (!mapData.spawnPoints || typeof mapData.spawnPoints !== 'object') {
                return { valid: false, error: '爆破模式需要出生点配置(spawnPoints)' };
            }
        }
        
        return { valid: true };
    }
    
    // 加载自定义地图
    loadCustomMap(mapData) {
        this.customMapData = mapData;
        
        // 根据地图的游戏模式显示/隐藏击杀数选择
        const targetKillsGroup = document.getElementById('targetKillsGroup');
        const gameMode = mapData.gameMode || ['deathmatch'];
        
        // 如果是爆破模式
        if (gameMode.includes('defuse')) {
            this.selectedGameMode = 'defuse';
            targetKillsGroup.style.display = 'none';
        } else {
            this.selectedGameMode = 'deathmatch';
            targetKillsGroup.style.display = 'block';
        }
        
        // 动态注册地图配置
        const mapId = mapData.name || 'custom_imported';
        // 解析skyColor，支持字符串和数字格式
        let skyColor = 0x6bb3d9;
        if (mapData.skyColor !== undefined) {
            if (typeof mapData.skyColor === 'string') {
                skyColor = parseInt(mapData.skyColor.replace('0x', ''), 16) || 0x6bb3d9;
            } else {
                skyColor = mapData.skyColor;
            }
        }
        MapConfigs[mapId] = {
            displayName: mapData.displayName || '自定义地图',
            gameMode: gameMode,
            floorColor1: mapData.floorColor1 || '#8b7355',
            floorColor2: mapData.floorColor2 || '#7a6245',
            wallColor1: mapData.wallColor1 || '#95a5a6',
            wallColor2: mapData.wallColor2 || '#7f8c8d',
            skyColor: skyColor,
            mapSize: mapData.mapSize || 300,
            obstacles: this.convertObjectsToObstacles(mapData.objects || []),
            bombSites: mapData.bombSites || {},
            spawnPoints: mapData.spawnPoints || {}
        };
        
        this.selectedMap = mapId;
        console.log('自定义地图已加载:', mapId, MapConfigs[mapId]);
    }
    
    // 将编辑器对象转换为障碍物格式
    convertObjectsToObstacles(objects) {
        const obstacles = [];
        objects.forEach(obj => {
            if (obj.type === 'floor' || obj.type === 'bombsite_a' || obj.type === 'bombsite_b' || 
                obj.type === 'spawn_ct' || obj.type === 'spawn_t') {
                return; // 跳过地板和特殊点位
            }
            obstacles.push({
                x: obj.x,
                y: obj.y,
                z: obj.z,
                w: obj.w,
                h: obj.h,
                d: obj.d,
                color: obj.color,
                rotation: obj.rotation
            });
        });
        return obstacles;
    }
    
    toggleBuyMenu() {
        if (this.settingsMenuOpen) return;
        this.buyMenuOpen = !this.buyMenuOpen;
        document.getElementById('buy-menu').style.display = this.buyMenuOpen ? 'flex' : 'none';
        if (this.buyMenuOpen) document.exitPointerLock();
        else document.body.requestPointerLock();
    }
    
    toggleSettingsMenu() {
        if (this.buyMenuOpen) return;
        this.settingsMenuOpen = !this.settingsMenuOpen;
        document.getElementById('settings-menu').style.display = this.settingsMenuOpen ? 'block' : 'none';
        if (this.settingsMenuOpen) {
            document.exitPointerLock();
            this.setupSettingsListeners();
        } else {
            document.body.requestPointerLock();
        }
    }
    
    setupSettingsListeners() {
        const sensSlider = document.getElementById('sensitivity-slider');
        const scopeSensSlider = document.getElementById('scope-sensitivity-slider');
        const volumeSlider = document.getElementById('volume-slider');
        const resumeBtn = document.getElementById('resumeGame');
        const fullscreenBtn = document.getElementById('toggleFullscreen');
        const exitBtn = document.getElementById('exitGame');
        
        if (sensSlider && !sensSlider.hasListener) {
            sensSlider.hasListener = true;
            sensSlider.value = this.sensitivityMultiplier * 5;
            document.getElementById('sens-value').textContent = sensSlider.value;
            sensSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.sensitivityMultiplier = val / 5;
                document.getElementById('sens-value').textContent = val;
            });
        }
        
        if (scopeSensSlider && !scopeSensSlider.hasListener) {
            scopeSensSlider.hasListener = true;
            scopeSensSlider.value = this.scopeSensitivityMultiplier * 10;
            document.getElementById('scope-sens-value').textContent = scopeSensSlider.value;
            scopeSensSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.scopeSensitivityMultiplier = val / 10;
                document.getElementById('scope-sens-value').textContent = val;
            });
        }
        
        if (volumeSlider && !volumeSlider.hasListener) {
            volumeSlider.hasListener = true;
            volumeSlider.value = this.masterVolume * 100;
            document.getElementById('volume-value').textContent = volumeSlider.value;
            volumeSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.masterVolume = val / 100;
                this.audio.setVolume(this.masterVolume);
                document.getElementById('volume-value').textContent = val;
            });
        }
        
        if (resumeBtn && !resumeBtn.hasListener) {
            resumeBtn.hasListener = true;
            resumeBtn.addEventListener('click', () => this.toggleSettingsMenu());
        }
        
        if (fullscreenBtn && !fullscreenBtn.hasListener) {
            fullscreenBtn.hasListener = true;
            fullscreenBtn.addEventListener('click', () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    fullscreenBtn.textContent = '进入全屏';
                } else {
                    document.documentElement.requestFullscreen().catch(() => {});
                    fullscreenBtn.textContent = '退出全屏';
                }
                this.settingsMenuOpen = false;
                document.getElementById('settings-menu').style.display = 'none';
                setTimeout(() => document.body.requestPointerLock(), 100);
            });
        }
        
        if (exitBtn && !exitBtn.hasListener) {
            exitBtn.hasListener = true;
            exitBtn.addEventListener('click', () => this.backToMenu());
        }
    }
    
    updateAmmoDisplay() {
        const config = WeaponConfigs[this.currentWeapon];
        const weaponName = config ? config.name : 'AK-47';
        if (this.currentWeapon === 'knife' || this.currentWeapon === 'c4') {
            document.getElementById('weapon').textContent = weaponName;
        } else if (this.currentWeapon === 'grenade') {
            document.getElementById('weapon').textContent = `${weaponName} x${this.grenadeCount}`;
        } else {
            document.getElementById('weapon').textContent = `${weaponName} ${this.ammo}/${this.maxAmmo}`;
        }
    }
    
    updateTeamScores() {
        if (this.isDefuseMode) {
            document.getElementById('ct-score').textContent = `反恐精英: ${this.ctScore}`;
            document.getElementById('t-score').textContent = `恐怖分子: ${this.tScore}`;
        } else {
            document.getElementById('ct-score').textContent = `反恐精英: ${this.ctKills}`;
            document.getElementById('t-score').textContent = `恐怖分子: ${this.tKills}`;
        }
    }
    
    updateHUD(player) {
        document.getElementById('health').textContent = `HP: ${player.health}`;
        if (!this.isReloading) this.updateAmmoDisplay();
        document.getElementById('score').textContent = `K: ${player.kills} / D: ${player.deaths}`;
        if (!player.is_alive && !this.gameOver) {
            if (!this.isDefuseMode) {
                // 团队竞技模式：显示死亡界面
                document.getElementById('death-screen').style.display = 'block';
                document.getElementById('game').classList.add('dead-effect');
                document.getElementById('death-overlay').classList.add('active');
                document.getElementById('respawn-info').innerHTML = '<span id="respawn-countdown">3</span> 秒后自动复活';
                this.startRespawnTimer();
            } else {
                // 爆破模式死亡后自动进入观战模式
                if (!this.isSpectating) {
                    const aliveTeammates = this.getAliveTeammates();
                    if (aliveTeammates.length > 0) {
                        // 有存活队友，进入观战模式，不显示死亡界面
                        document.getElementById('death-screen').style.display = 'none';
                        document.getElementById('game').classList.remove('dead-effect');
                        document.getElementById('death-overlay').classList.remove('active');
                        this.startSpectating();
                    } else {
                        // 没有存活队友，显示等待复活
                        document.getElementById('death-screen').style.display = 'block';
                        document.getElementById('game').classList.add('dead-effect');
                        document.getElementById('death-overlay').classList.add('active');
                        document.getElementById('respawn-info').textContent = '等待下回合复活';
                    }
                }
            }
        }
    }
    
    updateCrosshair() {
        const crosshair = document.getElementById('crosshair');
        const offset = this.crosshairOffset * 50;
        crosshair.style.transform = `translate(-50%, calc(-50% - ${offset}px))`;
    }
    
    addKillFeed(message) {
        const feed = document.getElementById('killfeed');
        const msg = document.createElement('div');
        msg.className = 'kill-msg';
        msg.textContent = message;
        feed.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    }
    
    showKillFeedback(isHeadshot, isKnife, killStreak) {
        const killIcon = document.getElementById('kill-icon');
        const streakIcon = document.getElementById('kill-streak-icon');
        killIcon.className = '';
        streakIcon.className = '';
        
        if (isHeadshot) {
            killIcon.className = 'headshot';
            killIcon.textContent = 'HEADSHOT';
        } else if (isKnife) {
            killIcon.className = 'knife';
            killIcon.textContent = 'KNIFE KILL';
        } else {
            killIcon.className = 'kill';
            killIcon.textContent = 'KILL';
        }
        
        if (killStreak >= 2) {
            const streakNames = { 2: 'DOUBLE KILL', 3: 'TRIPLE KILL', 4: 'ULTRA KILL', 5: 'RAMPAGE', 6: 'GODLIKE', 7: 'UNSTOPPABLE', 8: 'LEGENDARY' };
            streakIcon.textContent = streakNames[Math.min(killStreak, 8)];
            streakIcon.className = 'active';
            if (killStreak >= 6) streakIcon.classList.add('streak-6');
            else if (killStreak >= 5) streakIcon.classList.add('streak-5');
            else if (killStreak >= 4) streakIcon.classList.add('streak-4');
            else if (killStreak >= 3) streakIcon.classList.add('streak-3');
        }
        
        setTimeout(() => { killIcon.className = ''; killIcon.textContent = ''; }, 2000);
        setTimeout(() => { streakIcon.className = ''; streakIcon.textContent = ''; }, 2500);
    }
    
    playDeathAnimation() {
        if (!this.camera) return;
        const startPitch = this.pitch;
        const startY = this.camera.position.y;
        const startTime = Date.now();
        const duration = 800;
        
        const flashOverlay = document.createElement('div');
        flashOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0.5);pointer-events:none;z-index:999;';
        document.body.appendChild(flashOverlay);
        
        let flashOpacity = 0.5;
        const flashFade = setInterval(() => {
            flashOpacity -= 0.05;
            if (flashOpacity <= 0) { clearInterval(flashFade); flashOverlay.remove(); }
            else flashOverlay.style.background = `rgba(255,0,0,${flashOpacity})`;
        }, 50);
        
        const animateDeath = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            this.pitch = startPitch + (Math.PI / 3) * easeOut;
            this.camera.rotation.x = this.pitch;
            this.camera.position.y = startY - (startY - 1.5) * easeOut;
            if (progress < 0.7) {
                const shake = Math.sin(progress * 20) * (1 - progress) * 0.05;
                this.camera.rotation.z = shake;
            } else {
                this.camera.rotation.z = 0;
            }
            if (progress < 1) requestAnimationFrame(animateDeath);
            else this.camera.rotation.z = 0.1;
        };
        animateDeath();
    }
    
    resetDeathAnimation() {
        if (!this.camera) return;
        this.camera.rotation.z = 0;
        this.pitch = 0;
        this.camera.rotation.x = 0;
    }
    
    startRespawnTimer() {
        if (this.respawnTimer) return;
        this.respawnCountdown = 3;
        document.getElementById('respawn-countdown').textContent = this.respawnCountdown;
        this.respawnTimer = setInterval(() => {
            this.respawnCountdown--;
            document.getElementById('respawn-countdown').textContent = this.respawnCountdown;
            if (this.respawnCountdown <= 0) {
                this.clearRespawnTimer();
                this.respawn();
            }
        }, 1000);
    }
    
    clearRespawnTimer() {
        if (this.respawnTimer) {
            clearInterval(this.respawnTimer);
            this.respawnTimer = null;
        }
    }
    
    showGameOver(winner, ctKills, tKills, reason = 'kills') {
        this.gameOver = true;
        this.clearRespawnTimer();
        document.getElementById('death-screen').style.display = 'none';
        document.getElementById('game-over').style.display = 'block';
        
        let winnerText;
        if (winner === 'draw') winnerText = '平局!';
        else if (winner === 'ct') winnerText = '反恐精英获胜!';
        else winnerText = '恐怖分子获胜!';
        
        let reasonText = '';
        if (reason === 'time') reasonText = ' (时间结束)';
        else if (reason === 'match_won') reasonText = ' (比赛胜利)';
        
        document.getElementById('winner-text').textContent = winnerText + reasonText;
        
        if (this.isDefuseMode) {
            document.getElementById('final-score').textContent = `最终比分 - 反恐精英: ${ctKills} 回合 | 恐怖分子: ${tKills} 回合`;
        } else {
            document.getElementById('final-score').textContent = `最终比分 - 反恐精英: ${ctKills} | 恐怖分子: ${tKills}`;
        }
        document.exitPointerLock();
    }


    // ==================== 武器系统 ====================
    updateGunModel() {
        if (!this.camera) return;
        if (this.gunModel) this.camera.remove(this.gunModel);
        this.weaponBuilder = new WeaponModelBuilder(this.selectedTeam);
        this.gunModel = this.weaponBuilder.createModel(this.currentWeapon);
        this.gunBasePosition = this.gunModel.position.clone();
        this.gunBaseRotation = this.gunModel.rotation.clone();
        this.camera.add(this.gunModel);
        this.gunRecoil = 0;
    }
    
    createGunModel() {
        this.weaponBuilder = new WeaponModelBuilder(this.selectedTeam);
        this.gunModel = this.weaponBuilder.createModel('ak47');
        this.gunBasePosition = this.gunModel.position.clone();
        this.gunBaseRotation = this.gunModel.rotation.clone();
        this.camera.add(this.gunModel);
        this.scene.add(this.camera);
        this.isSwitchingWeapon = false;
        this.isReloading = false;
        this.switchAnimProgress = 0;
        this.reloadAnimProgress = 0;
        this.gunRecoil = 0;
    }
    
    buyPrimaryWeapon(weapon) {
        this.primaryWeapon = weapon;
        this.switchToSlot(1);
        if (this.buyMenuOpen) this.toggleBuyMenu();
    }
    
    switchToSlot(slot) {
        if (this.isReloading || this.isSwitchingWeapon) return;
        let newWeapon;
        switch(slot) {
            case 1: newWeapon = this.primaryWeapon; break;
            case 2: newWeapon = this.secondaryWeapon; break;
            case 3: newWeapon = 'knife'; break;
            case 4: newWeapon = 'grenade'; break;
            default: return;
        }
        if (newWeapon === this.currentWeapon) return;
        if (newWeapon === 'grenade' && this.grenadeCount <= 0) return;
        this.startWeaponSwitch(newWeapon);
    }
    
    switchToPrevious() {
        if (this.isReloading || this.isSwitchingWeapon) return;
        const isPrimary = (w) => w === 'ak47' || w === 'm4a1' || w === 'awp';
        const isSecondary = (w) => w === 'pistol';
        
        let newWeapon;
        if (isPrimary(this.currentWeapon)) newWeapon = this.secondaryWeapon;
        else if (isSecondary(this.currentWeapon)) newWeapon = this.primaryWeapon;
        else if (this.currentWeapon === 'knife') newWeapon = isPrimary(this.previousWeapon) ? this.previousWeapon : this.primaryWeapon;
        else if (this.currentWeapon === 'grenade' || this.currentWeapon === 'c4') newWeapon = isPrimary(this.previousWeapon) ? this.previousWeapon : this.primaryWeapon;
        else newWeapon = this.primaryWeapon;
        
        if (newWeapon === this.currentWeapon) return;
        this.startWeaponSwitch(newWeapon);
    }
    
    startWeaponSwitch(newWeapon) {
        if (this.isScoped) this.closeScope(); // 使用closeScope确保完全关闭
        this.previousWeapon = this.currentWeapon;
        this.isSwitchingWeapon = true;
        this.switchAnimProgress = 0;
        this.audio.playWeaponSwitchSound();
        
        const self = this;
        setTimeout(function() {
            self.currentWeapon = newWeapon;
            const config = WeaponConfigs[newWeapon];
            if (config) {
                self.maxAmmo = config.ammo;
                self.ammo = config.ammo;
                self.fireRate = config.fireRate;
                self.weaponRecoil = config.recoil;
            }
            self.shotsFired = 0;
            self.recoilAccumulator = 0;
            self.updateGunModel();
            self.updateAmmoDisplay();
            
            setTimeout(function() {
                self.isSwitchingWeapon = false;
                self.switchAnimProgress = 0;
            }, 200);
        }, 300);
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'switch_weapon', weapon: newWeapon }));
        }
    }
    
    reload() {
        if (this.currentWeapon === 'knife' || this.currentWeapon === 'grenade' || this.currentWeapon === 'c4') return;
        this.isReloading = true;
        this.reloadAnimProgress = 0;
        this.audio.playReloadSound(this.currentWeapon);
        document.getElementById('weapon').textContent = '换弹中...';
        setTimeout(() => {
            this.ammo = this.maxAmmo;
            this.isReloading = false;
            this.reloadAnimProgress = 0;
            this.updateAmmoDisplay();
        }, 1800);
    }
    
    toggleScope() {
        if (this.currentWeapon !== 'awp') return;
        
        // 三级开镜：0->1->2->0
        this.scopeLevel = (this.scopeLevel + 1) % 3;
        this.isScoped = this.scopeLevel > 0;
        
        document.getElementById('scope').style.display = this.isScoped ? 'block' : 'none';
        document.getElementById('crosshair').style.display = this.isScoped ? 'none' : 'block';
        
        if (this.camera) {
            if (this.scopeLevel === 0) {
                this.camera.fov = this.normalFOV;
            } else if (this.scopeLevel === 1) {
                this.camera.fov = this.scopedFOV1;
            } else {
                this.camera.fov = this.scopedFOV2;
            }
            this.camera.updateProjectionMatrix();
        }
        if (this.gunModel) this.gunModel.visible = !this.isScoped;
    }
    
    closeScope() {
        if (!this.isScoped) return;
        this.isScoped = false;
        this.scopeLevel = 0;
        document.getElementById('scope').style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
        if (this.camera) {
            this.camera.fov = this.normalFOV;
            this.camera.updateProjectionMatrix();
        }
        if (this.gunModel) this.gunModel.visible = true;
    }
    
    setCrouch(crouch) {
        if (this.isCrouching === crouch) return;
        if (crouch && this.camera) {
            if (!this.canCrouchAt(this.camera.position.x, this.camera.position.z)) return;
        }
        this.isCrouching = crouch;
        const targetHeight = crouch ? this.crouchingHeight : this.standingHeight;
        this.targetCameraHeight = targetHeight + (this.currentStandingHeight || 0);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'crouch', crouching: crouch }));
        }
    }

    // ==================== 射击系统 ====================
    shoot() {
        if (this.isReloading || this.isSwitchingWeapon || this.gameOver || this.buyMenuOpen) return;
        if (!this.isLocked) return;
        
        const now = Date.now();
        if (now - this.lastShot < this.fireRate) return;
        
        if (this.currentWeapon === 'knife') {
            this.knifeAttack();
            this.lastShot = now;
            return;
        }
        
        if (this.currentWeapon === 'grenade') {
            this.throwGrenade();
            this.lastShot = now;
            return;
        }
        
        if (this.currentWeapon === 'c4') {
            // C4不能射击，只能安放
            return;
        }
        
        if (this.ammo <= 0) {
            this.reload();
            return;
        }
        
        this.lastShot = now;
        this.ammo--;
        this.shotsFired++;
        
        this.audio.playGunSound(this.currentWeapon);
        
        const config = WeaponConfigs[this.currentWeapon];
        
        let currentRecoil = 0;
        if (this.shotsFired > 2) {
            const shotFactor = Math.min(this.shotsFired - 2, 8);
            const progressiveRecoil = config.recoil + (shotFactor * config.recoilIncrease);
            currentRecoil = Math.min(progressiveRecoil, config.maxRecoil);
        }
        
        this.recoilAccumulator += currentRecoil;
        this.crosshairOffset = Math.min(this.recoilAccumulator * 1.5, 0.6);
        this.gunRecoil = 0.5 + (config.recoil * 2);
        this.screenShake = 0.02 + (config.recoil * 0.1);
        
        // 后坐力算法：使用相对于当前视角的后坐力，不依赖地图坐标
        // 垂直后坐力（向上）- 直接增加pitch，这在任何方向都是一致的
        const pitchRecoil = config.recoil * 0.008 * (1 + Math.min(this.shotsFired * 0.1, 0.5));
        // 水平后坐力（随机左右）- 直接增加yaw，这在任何方向都是一致的
        const yawRecoil = (Math.random() - 0.5) * config.recoil * 0.02;
        
        // 直接应用后坐力到视角角度（pitch和yaw是相对于玩家自身的，不是世界坐标）
        this.pitch += pitchRecoil;
        this.yaw += yawRecoil;
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.x = this.pitch;
        this.camera.rotation.y = this.yaw;
        
        const wasScoped = this.isScoped;
        
        if (this.currentWeapon === 'awp' && this.isScoped) {
            this.closeScope();
        }
        
        this.raycastShoot(wasScoped);
        this.updateAmmoDisplay();
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'shoot' }));
        }
    }
    
    knifeAttack() {
        this.audio.playKnifeSound();
        this.gunRecoil = 1;
        if (this.gunModel) {
            this.gunModel.rotation.z = -0.5;
            setTimeout(() => { if (this.gunModel) this.gunModel.rotation.z = 0.5; }, 100);
            setTimeout(() => { if (this.gunModel) this.gunModel.rotation.z = 0; }, 200);
        }
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        raycaster.far = 3;
        for (const [playerId, mesh] of Object.entries(this.playerMeshes)) {
            if (playerId === this.playerId) continue;
            const allParts = [];
            mesh.traverse(child => { if (child.isMesh) allParts.push(child); });
            const hits = raycaster.intersectObjects(allParts);
            if (hits.length > 0) {
                const hitPoint = hits[0].point;
                this.createHitMarker();
                this.createBloodEffect(hitPoint);
                this.audio.playHitSound();
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ action: 'hit_player', target_id: playerId, hit_height: hitPoint.y }));
                }
                break;
            }
        }
    }
    
    throwGrenade() {
        if (this.grenadeCount <= 0) return;
        this.grenadeCount--;
        this.audio.playGrenadeThrowSound();
        this.gunRecoil = 0.5;
        
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        const start = this.camera.position.clone();
        
        // 发送手雷投掷信息到服务器
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                action: 'throw_grenade',
                start: { x: start.x, y: start.y, z: start.z },
                direction: { x: direction.x, y: direction.y, z: direction.z }
            }));
        }
        
        // 本地创建手雷
        this.createLocalGrenade(start, direction);
        
        this.updateAmmoDisplay();
        // 投掷后立即切换武器，不再延迟
        if (this.grenadeCount <= 0) {
            this.switchToSlot(1);
        } else {
            // 还有手雷时也快速切换到其他武器
            this.switchToSlot(1);
        }
    }
    
    // 创建本地手雷（自己投掷或接收到其他玩家投掷）
    createLocalGrenade(start, direction, isRemote = false) {
        const grenadeGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const grenadeMat = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
        const grenade = new THREE.Mesh(grenadeGeom, grenadeMat);
        grenade.position.copy(start);
        this.scene.add(grenade);
        
        // 使用固定的物理参数，不依赖帧率
        const initialSpeed = 85; // 单位/秒，进一步增加投掷距离
        let velocity = new THREE.Vector3(direction.x, direction.y, direction.z).normalize().multiplyScalar(initialSpeed);
        velocity.y += 15; // 向上的初速度，增加抛物线高度
        const gravity = 55; // 重力加速度，稍微降低让手雷飞得更远
        const friction = 0.7; // 摩擦系数
        const bounceFactor = 0.5; // 反弹系数
        
        let bounces = 0;
        let lastTime = performance.now();
        const walls = this.walls;
        const grenadeRadius = 0.5;
        
        // 如果是远程手雷，播放投掷音效
        if (isRemote) {
            this.audio.playGrenadeThrowSound();
        }
        
        const checkWallCollision = (currentPos, nextPos, vel) => {
            let collided = false;
            
            for (const wall of walls) {
                const wx = wall.x, wz = wall.z, ww = wall.w, wd = wall.d;
                const wallHeight = wall.h || 20;
                
                if (currentPos.y > wallHeight + grenadeRadius) continue;
                
                const minX = wx - grenadeRadius;
                const maxX = wx + ww + grenadeRadius;
                const minZ = wz - grenadeRadius;
                const maxZ = wz + wd + grenadeRadius;
                
                if (nextPos.x >= minX && nextPos.x <= maxX && 
                    nextPos.z >= minZ && nextPos.z <= maxZ &&
                    nextPos.y <= wallHeight + grenadeRadius) {
                    
                    const distToLeft = nextPos.x - minX;
                    const distToRight = maxX - nextPos.x;
                    const distToFront = nextPos.z - minZ;
                    const distToBack = maxZ - nextPos.z;
                    
                    const minDist = Math.min(distToLeft, distToRight, distToFront, distToBack);
                    
                    if (minDist === distToLeft || minDist === distToRight) {
                        vel.x *= -bounceFactor;
                        if (minDist === distToLeft) {
                            nextPos.x = minX - 0.01;
                        } else {
                            nextPos.x = maxX + 0.01;
                        }
                    } else {
                        vel.z *= -bounceFactor;
                        if (minDist === distToFront) {
                            nextPos.z = minZ - 0.01;
                        } else {
                            nextPos.z = maxZ + 0.01;
                        }
                    }
                    
                    vel.x *= friction;
                    vel.z *= friction;
                    collided = true;
                    break;
                }
            }
            return collided;
        };
        
        const animateGrenade = () => {
            const now = performance.now();
            const deltaTime = Math.min((now - lastTime) / 1000, 0.05); // 限制最大deltaTime防止跳帧
            lastTime = now;
            
            // 应用重力
            velocity.y -= gravity * deltaTime;
            
            // 计算下一帧位置
            const currentPos = grenade.position.clone();
            const nextPos = currentPos.clone().add(velocity.clone().multiplyScalar(deltaTime));
            
            // 检查墙体碰撞
            checkWallCollision(currentPos, nextPos, velocity);
            
            // 更新位置
            grenade.position.copy(nextPos);
            
            // 地面碰撞
            if (grenade.position.y < 0.5) {
                grenade.position.y = 0.5;
                velocity.y *= -bounceFactor;
                velocity.x *= friction;
                velocity.z *= friction;
                bounces++;
            }
            
            // 边界检查
            const grenadeMapConfig = MapConfigs[this.selectedMap];
            const grenadeMapSize = (grenadeMapConfig && grenadeMapConfig.mapSize) || 125;
            const mapBoundary = grenadeMapSize - 5;
            if (Math.abs(grenade.position.x) > mapBoundary) {
                velocity.x *= -bounceFactor;
                grenade.position.x = Math.sign(grenade.position.x) * mapBoundary;
            }
            if (Math.abs(grenade.position.z) > mapBoundary) {
                velocity.z *= -bounceFactor;
                grenade.position.z = Math.sign(grenade.position.z) * mapBoundary;
            }
            
            // 继续动画或爆炸
            if (bounces < 5 && velocity.length() > 1) {
                requestAnimationFrame(animateGrenade);
            } else {
                setTimeout(() => {
                    this.createExplosion(grenade.position, isRemote);
                    this.scene.remove(grenade);
                }, 1500);
            }
        };
        animateGrenade();
    }
    
    createExplosion(position, isRemote = false) {
        this.audio.playExplosionSound();
        
        const explosionGeom = new THREE.SphereGeometry(2, 16, 16);
        const explosionMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
        const explosion = new THREE.Mesh(explosionGeom, explosionMat);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        const flashGeom = new THREE.SphereGeometry(1.5, 12, 12);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 1 });
        const flash = new THREE.Mesh(flashGeom, flashMat);
        flash.position.copy(position);
        this.scene.add(flash);
        
        const smokeGeom = new THREE.TorusGeometry(3, 1, 8, 16);
        const smokeMat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.6 });
        const smoke = new THREE.Mesh(smokeGeom, smokeMat);
        smoke.position.copy(position);
        smoke.rotation.x = Math.PI / 2;
        this.scene.add(smoke);
        
        const particles = [];
        for (let i = 0; i < 20; i++) {
            const particleGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const particleColor = Math.random() > 0.5 ? 0xff4400 : 0xffaa00;
            const particleMat = new THREE.MeshBasicMaterial({ color: particleColor, transparent: true, opacity: 1 });
            const particle = new THREE.Mesh(particleGeom, particleMat);
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 1.5 + 0.5, (Math.random() - 0.5) * 2);
            this.scene.add(particle);
            particles.push({ mesh: particle, mat: particleMat, vel: particle.velocity });
        }
        
        const originalCamPos = this.camera.position.clone();
        const distToPlayer = this.camera.position.distanceTo(position);
        const shakeIntensity = Math.max(0, 1 - distToPlayer / 30) * 0.5;
        
        let frame = 0;
        let scale = 1;
        let smokeScale = 1;
        
        const animateExplosion = () => {
            frame++;
            scale += 0.4;
            explosion.scale.set(scale, scale, scale);
            explosionMat.opacity -= 0.08;
            flashMat.opacity -= 0.15;
            flash.scale.set(scale * 0.8, scale * 0.8, scale * 0.8);
            smokeScale += 0.3;
            smoke.scale.set(smokeScale, smokeScale, smokeScale);
            smoke.position.y += 0.2;
            smokeMat.opacity -= 0.04;
            particles.forEach(p => {
                p.mesh.position.add(p.vel);
                p.vel.y -= 0.08;
                p.mat.opacity -= 0.05;
            });
            if (frame < 10 && shakeIntensity > 0) {
                this.camera.position.x = originalCamPos.x + (Math.random() - 0.5) * shakeIntensity;
                this.camera.position.y = originalCamPos.y + (Math.random() - 0.5) * shakeIntensity;
            }
            if (explosionMat.opacity > 0) {
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
                this.scene.remove(flash);
                this.scene.remove(smoke);
                particles.forEach(p => this.scene.remove(p.mesh));
            }
        };
        animateExplosion();
        
        // 只有自己投掷的手雷才检测伤害
        if (!isRemote) {
            for (const [playerId, mesh] of Object.entries(this.playerMeshes)) {
                if (playerId === this.playerId) continue;
                const dist = mesh.position.distanceTo(position);
                if (dist < 10 && this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ action: 'grenade_hit', target_id: playerId, distance: dist }));
                }
            }
        }
    }

    
    raycastShoot(wasScoped = false) {
        const raycaster = new THREE.Raycaster();
        const config = WeaponConfigs[this.currentWeapon];
        
        let spreadX = 0;
        let spreadY = 0;
        
        if (this.currentWeapon === 'awp' && !wasScoped) {
            const noScopeSpread = 0.15;
            spreadX = (Math.random() - 0.5) * noScopeSpread;
            spreadY = (Math.random() - 0.5) * noScopeSpread;
        } else if (this.shotsFired > 2) {
            // 连发10发后，散布固定在一个最大范围内随机
            const isMaxSpread = this.shotsFired >= 10;
            
            if (isMaxSpread) {
                // 10发后固定最大散布范围
                const maxSpread = (config.spread || 0.02) + 0.08;
                spreadX = (Math.random() - 0.5) * maxSpread;
                spreadY = (Math.random() - 0.5) * maxSpread * 0.8 + 0.04;
            } else {
                // 2-10发之间逐渐增加散布
                const spreadFactor = Math.min((this.shotsFired - 2) / 8, 1);
                const baseSpread = (config.spread || 0.02) * spreadFactor;
                const recoilSpread = this.recoilAccumulator * 0.03 * spreadFactor;
                const totalSpread = baseSpread + recoilSpread;
                spreadX = (Math.random() - 0.5) * totalSpread;
                spreadY = Math.random() * totalSpread * 0.8 + this.recoilAccumulator * 0.012;
            }
        }
        
        const origin = this.camera.position.clone();
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // 将散布应用到相机的本地坐标系，而不是世界坐标系
        // 这样无论玩家朝哪个方向，散布效果都是一致的
        if (spreadX !== 0 || spreadY !== 0) {
            // 获取相机的右向量和上向量
            const right = new THREE.Vector3();
            const up = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            right.crossVectors(direction, this.camera.up).normalize();
            up.crossVectors(right, direction).normalize();
            
            // 在本地坐标系中应用散布
            direction.add(right.multiplyScalar(spreadX));
            direction.add(up.multiplyScalar(spreadY));
            direction.normalize();
        }
        
        raycaster.set(origin, direction);
        
        let endPoint = origin.clone().add(direction.clone().multiplyScalar(100));
        let hitWallDist = Infinity;
        let hitPlayerId = null;
        let hitPoint = null;
        let hitFloor = false;
        
        if (direction.y < 0) {
            const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const floorIntersect = new THREE.Vector3();
            const intersected = raycaster.ray.intersectPlane(floorPlane, floorIntersect);
            if (intersected) {
                const toIntersect = floorIntersect.clone().sub(origin);
                const dotProduct = toIntersect.dot(direction);
                if (dotProduct > 0) {
                    const floorDist = floorIntersect.distanceTo(origin);
                    if (floorDist < hitWallDist && floorDist < 100 && floorDist > 0.5) {
                        hitWallDist = floorDist;
                        endPoint = floorIntersect.clone();
                        hitFloor = true;
                    }
                }
            }
        }
        
        const wallMeshes = this.walls.map(w => w.mesh);
        const wallHits = raycaster.intersectObjects(wallMeshes);
        if (wallHits.length > 0 && wallHits[0].distance < hitWallDist) {
            hitWallDist = wallHits[0].distance;
            endPoint = wallHits[0].point.clone();
            hitFloor = false;
            const normal = wallHits[0].face ? wallHits[0].face.normal.clone() : null;
            if (normal) normal.transformDirection(wallHits[0].object.matrixWorld);
            this.createBulletHole(wallHits[0].point, normal, false);
        } else if (hitFloor) {
            this.createFloorBulletHole(endPoint);
        }
        
        for (const [playerId, mesh] of Object.entries(this.playerMeshes)) {
            if (playerId === this.playerId) continue;
            const allParts = [];
            mesh.traverse(child => { if (child.isMesh) allParts.push(child); });
            const hits = raycaster.intersectObjects(allParts);
            if (hits.length > 0 && hits[0].distance < hitWallDist) {
                hitPlayerId = playerId;
                hitPoint = hits[0].point.clone();
                endPoint = hitPoint;
            }
        }
        
        if (hitPlayerId && hitPoint) {
            this.createHitMarker();
            this.createBloodEffect(hitPoint);
            this.audio.playHitSound();
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const targetMesh = this.playerMeshes[hitPlayerId];
                const relativeHeight = targetMesh ? hitPoint.y : hitPoint.y;
                this.ws.send(JSON.stringify({ action: 'hit_player', target_id: hitPlayerId, hit_height: relativeHeight }));
            }
        }
        this.createBulletTracer(origin, endPoint);
    }

    // ==================== 视觉效果 ====================
    createHitMarker() {
        const marker = document.createElement('div');
        marker.className = 'hit-marker';
        marker.innerHTML = '×';
        document.getElementById('game').appendChild(marker);
        setTimeout(() => marker.remove(), 200);
    }
    
    createBulletHole(position, normal = null, isFloor = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 32, 32);
        
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 14);
        gradient.addColorStop(0, 'rgba(20, 20, 20, 0.9)');
        gradient.addColorStop(0.3, 'rgba(40, 35, 30, 0.85)');
        gradient.addColorStop(0.6, 'rgba(60, 50, 40, 0.6)');
        gradient.addColorStop(0.8, 'rgba(80, 70, 60, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 90, 80, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.fill();
        
        const innerGradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 5);
        innerGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        innerGradient.addColorStop(0.5, 'rgba(10, 10, 10, 0.95)');
        innerGradient.addColorStop(1, 'rgba(30, 25, 20, 0.8)');
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(16, 16, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(30, 25, 20, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i + Math.random() * 0.5;
            const length = 6 + Math.random() * 4;
            ctx.beginPath();
            ctx.moveTo(16 + Math.cos(angle) * 5, 16 + Math.sin(angle) * 5);
            ctx.lineTo(16 + Math.cos(angle) * length, 16 + Math.sin(angle) * length);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        const hole = new THREE.Mesh(
            new THREE.CircleGeometry(0.4, 16),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
        );
        hole.position.copy(position);
        
        if (isFloor) {
            hole.rotation.x = -Math.PI / 2;
            hole.position.y = 0.02;
        } else if (normal) {
            hole.lookAt(position.clone().add(normal));
        } else {
            hole.lookAt(this.camera.position);
        }
        
        this.scene.add(hole);
        setTimeout(() => {
            const fadeOut = () => {
                hole.material.opacity -= 0.05;
                if (hole.material.opacity > 0) requestAnimationFrame(fadeOut);
                else this.scene.remove(hole);
            };
            fadeOut();
        }, 5000);
    }
    
    createFloorBulletHole(position) {
        this.createBulletHole(position, null, true);
    }
    
    createBloodEffect(position) {
        for (let i = 0; i < 5; i++) {
            const particle = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.3, 0.3),
                new THREE.MeshBasicMaterial({ color: 0xcc0000 })
            );
            particle.position.copy(position);
            particle.position.x += (Math.random() - 0.5) * 2;
            particle.position.y += Math.random() * 2;
            particle.position.z += (Math.random() - 0.5) * 2;
            this.scene.add(particle);
            setTimeout(() => this.scene.remove(particle), 300);
        }
    }
    
    createBulletTracer(start, end) {
        const distance = start.distanceTo(end);
        const bulletGeom = new THREE.SphereGeometry(0.06, 4, 4);
        const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 1 });
        const bullet = new THREE.Mesh(bulletGeom, bulletMat);
        bullet.position.copy(start);
        this.scene.add(bullet);
        let traveled = 0;
        const animateBullet = () => {
            traveled += 16;
            if (traveled >= distance) {
                this.scene.remove(bullet);
                return;
            }
            bullet.position.lerpVectors(start, end, traveled / distance);
            bulletMat.opacity = 1 - (traveled / distance) * 0.5;
            requestAnimationFrame(animateBullet);
        };
        animateBullet();
    }

    // ==================== 游戏初始化 ====================
    // 校验玩家名称和房间号
    validateInput(name, roomId) {
        // 名称长度限制：2-8个字符
        if (name.length < 2 || name.length > 8) {
            this.showMenuError('玩家名称必须在2-8个字符之间');
            return false;
        }
        // 房间号固定8个字符
        if (roomId.length !== 8) {
            this.showMenuError('房间号必须是8个字符');
            return false;
        }
        // 只允许字母数字
        if (!/^[a-zA-Z0-9]+$/.test(roomId)) {
            this.showMenuError('房间号只能包含字母和数字');
            return false;
        }
        return true;
    }
    
    joinGame() {
        const name = document.getElementById('playerName').value.trim();
        const roomId = document.getElementById('roomId').value.trim();
        
        if (!this.validateInput(name, roomId)) return;
        
        this.checkRoomInfo(roomId).then(roomInfo => {
            if (roomInfo.exists) {
                // 使用房间的地图和游戏模式信息
                this.selectedMap = roomInfo.map || 'dust2';
                this.selectedGameMode = roomInfo.game_mode || 'deathmatch';
                this.targetKills = roomInfo.target_kills || 20;
                
                // 如果是自定义地图房间，提示用户
                if (roomInfo.has_custom_map) {
                    console.log('加入自定义地图房间，地图将在连接后同步');
                }
                
                this.startGame(name, roomId, false);
            } else {
                this.showMenuError('房间不存在，请创建房间或输入正确的房间号');
            }
        }).catch(() => {
            this.startGame(name, roomId, false);
        });
    }
    
    checkRoomInfo(roomId) {
        return new Promise((resolve, reject) => {
            const checkWs = new WebSocket(WS_SERVER_URL);
            let resolved = false;
            checkWs.onopen = () => { checkWs.send(JSON.stringify({ action: 'check_room', room_id: roomId })); };
            checkWs.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.action === 'room_check') {
                        resolved = true;
                        checkWs.close();
                        resolve({
                            exists: data.exists,
                            map: data.map,
                            game_mode: data.game_mode,
                            target_kills: data.target_kills,
                            has_custom_map: data.has_custom_map || false
                        });
                    }
                } catch (e) { checkWs.close(); reject(e); }
            };
            checkWs.onerror = () => { if (!resolved) reject(new Error('连接失败')); };
            setTimeout(() => { if (!resolved) { checkWs.close(); reject(new Error('超时')); } }, 2000);
        });
    }
    
    showMenuError(message) {
        const existingError = document.querySelector('.menu-error');
        if (existingError) existingError.remove();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'menu-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'color: #ff4444; background: rgba(255,0,0,0.1); padding: 10px 20px; border-radius: 5px; margin-top: 10px; text-align: center; border: 1px solid #ff4444;';
        const joinBtn = document.getElementById('joinBtn');
        const createBtn = document.getElementById('createBtn');
        const targetBtn = joinBtn.style.display !== 'none' ? joinBtn : createBtn;
        targetBtn.parentNode.insertBefore(errorDiv, targetBtn.nextSibling);
        setTimeout(() => errorDiv.remove(), 3000);
    }
    
    createGame() {
        const name = document.getElementById('playerName').value.trim();
        let roomId = document.getElementById('roomId').value.trim();
        
        // 如果没有输入房间号，自动生成8位随机房间号
        if (!roomId) {
            roomId = Math.random().toString(36).substr(2, 8);
            document.getElementById('roomId').value = roomId;
        }
        
        if (!this.validateInput(name, roomId)) return;
        
        this.targetKills = parseInt(document.getElementById('targetKills').value) || 20;
        
        const gameMode = document.getElementById('gameMode').value || 'deathmatch';
        
        // 自定义模式处理
        if (gameMode === 'custom') {
            if (!this.customMapData) {
                alert('请先导入地图文件');
                return;
            }
            // selectedMap 和 selectedGameMode 已在 loadCustomMap 中设置
        } else {
            this.selectedMap = document.getElementById('mapSelect').value || 'dust2';
            this.selectedGameMode = gameMode;
        }
        
        this.startGame(name, roomId, true);
    }
    
    startGame(name, roomId, isCreating) {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('game').style.display = 'block';
        document.getElementById('target-kills').textContent = this.targetKills;
        document.getElementById('map-name').textContent = MapNames[this.selectedMap] || '沙漠2';
        
        const modeText = this.selectedGameMode === 'deathmatch' ? '团队竞技' : '爆破模式';
        document.getElementById('game-mode-text').textContent = modeText + ' | ';
        
        if (this.selectedGameMode === 'deathmatch') {
            document.getElementById('game-timer').style.display = 'inline';
            document.getElementById('game-timer').textContent = '10:00 | ';
        }
        
        // 停止背景音乐并隐藏音乐按钮
        if (typeof pixelMusic !== 'undefined' && pixelMusic) {
            pixelMusic.stop();
        }
        document.getElementById('music-control').style.display = 'none';
        
        // 隐藏地图编辑器入口
        const editorLink = document.getElementById('editor-link');
        if (editorLink) editorLink.style.display = 'none';
        
        // 停止背景动画
        if (typeof pixelBg !== 'undefined' && pixelBg) {
            pixelBg.stop();
        }
        
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
        
        this.audio.init();
        this.initThree();
        
        this.renderer.compile(this.scene, this.camera);
        this.renderer.render(this.scene, this.camera);
        
        this.connect(name, roomId, isCreating);
        
        setTimeout(() => { document.body.requestPointerLock(); }, 100);
        document.getElementById('backToMenu').addEventListener('click', () => this.backToMenu());
    }
    
    backToMenu() {
        if (this.ws) this.ws.close();
        document.exitPointerLock();
        if (document.fullscreenElement) document.exitFullscreen();
        location.reload();
    }
    
    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x6bb3d9);
        // 移除迷雾效果
        this.scene.fog = null;
        this.camera = new THREE.PerspectiveCamera(this.normalFOV, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, this.standingHeight, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        const gl = this.renderer.getContext();
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            console.log('🎮 GPU加速已启用:', gpu);
        }
        
        document.getElementById('game').insertBefore(this.renderer.domElement, document.getElementById('game').firstChild);
        
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        this.scene.add(sun);
        
        const mapBuilder = new MapBuilder(this.scene);
        this.walls = mapBuilder.createMap(this.selectedMap);
        
        this.createGunModel();
        
        // 初始化小地图
        this.minimap = new Minimap(this);
        
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('click', () => { if (!this.isLocked && !this.buyMenuOpen) document.body.requestPointerLock(); });
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        this.animate();
    }


    // ==================== 网络通信 ====================
    connect(name, roomId, isCreating) {
        this.ws = new WebSocket(WS_SERVER_URL);
        this.ws.onopen = () => {
            const joinData = { action: 'join', name, room_id: roomId, team: this.selectedTeam };
            if (isCreating) {
                joinData.target_kills = this.targetKills;
                joinData.map = this.selectedMap;
                joinData.game_mode = this.selectedGameMode;
                joinData.is_creating = true;
                
                // 发送地图配置（包点、出生点、地图大小）
                const mapConfig = MapConfigs[this.selectedMap];
                if (mapConfig) {
                    joinData.map_size = mapConfig.mapSize || 125;
                    if (mapConfig.bombSites) {
                        joinData.bomb_sites = mapConfig.bombSites;
                    }
                    if (mapConfig.spawnPoints) {
                        joinData.spawn_points = mapConfig.spawnPoints;
                    }
                    // 如果是自定义地图，发送完整配置
                    if (this.customMapData) {
                        joinData.custom_map_config = this.customMapData;
                    }
                }
            }
            this.ws.send(JSON.stringify(joinData));
        };
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
    }
    
    handleMessage(data) {
        switch (data.action) {
            case 'joined':
                this.playerId = data.player_id;
                const p = data.player;
                this.camera.position.set(p.x, this.standingHeight, p.y);
                this.currentWeapon = p.weapon || 'ak47';
                this.primaryWeapon = this.currentWeapon;
                const config = WeaponConfigs[this.currentWeapon];
                this.ammo = config.ammo;
                this.maxAmmo = config.ammo;
                this.fireRate = config.fireRate;
                this.weaponRecoil = config.recoil;
                if (data.target_kills) this.targetKills = data.target_kills;
                
                // 如果服务器发送了自定义地图配置，先加载它
                if (data.custom_map_config) {
                    this.loadCustomMap(data.custom_map_config);
                    // 自定义地图需要强制重新加载
                    this.walls.forEach(wall => { if (wall.mesh) this.scene.remove(wall.mesh); });
                    this.walls = [];
                    const mapBuilder = new MapBuilder(this.scene);
                    this.walls = mapBuilder.createMap(this.selectedMap);
                    document.getElementById('map-name').textContent = MapConfigs[this.selectedMap]?.displayName || '自定义地图';
                } else if (data.map && this.selectedMap !== data.map) {
                    // 只在地图不同时才重新加载地图，避免重复加载
                    this.selectedMap = data.map;
                    this.walls.forEach(wall => { if (wall.mesh) this.scene.remove(wall.mesh); });
                    this.walls = [];
                    const mapBuilder = new MapBuilder(this.scene);
                    this.walls = mapBuilder.createMap(this.selectedMap);
                    document.getElementById('map-name').textContent = MapNames[data.map] || MapConfigs[data.map]?.displayName || '自定义地图';
                }
                document.getElementById('target-kills').textContent = this.targetKills;
                this.updateGunModel();
                this.updateAmmoDisplay();
                this.updateState(data.state);
                if (data.game_mode === 'defuse') this.initDefuseMode(data);
                break;
            case 'state':
                this.updateState(data.state);
                break;
            case 'player_joined':
                this.addKillFeed(`${data.player.name} 加入了游戏`);
                break;
            case 'player_left':
                const leftPlayer = this.players[data.player_id];
                if (leftPlayer) this.addKillFeed(`${leftPlayer.name} 离开了游戏`);
                if (this.playerMeshes[data.player_id]) {
                    this.scene.remove(this.playerMeshes[data.player_id]);
                    delete this.playerMeshes[data.player_id];
                }
                delete this.players[data.player_id];
                break;
            case 'hits':
                data.hits.forEach(hit => {
                    if (hit.type === 'kill') {
                        const killer = this.players[hit.killer];
                        const victim = this.players[hit.victim];
                        if (killer && victim) {
                            const hsText = hit.headshot ? ' [爆头]' : '';
                            this.addKillFeed(`${killer.name} 击杀了 ${victim.name}${hsText}`);
                        }
                        if (hit.killer === this.playerId) {
                            this.createHitMarker();
                            this.audio.playHitSound();
                            const now = Date.now();
                            if (now - this.lastKillTime < this.killStreakTimeout) this.killStreak++;
                            else this.killStreak = 1;
                            this.lastKillTime = now;
                            this.showKillFeedback(hit.headshot, hit.knife_kill, this.killStreak);
                            if (hit.headshot) this.audio.playHeadshotVoice();
                            else if (hit.knife_kill) this.audio.playKnifeKillVoice();
                            else if (this.killStreak >= 2) this.audio.playMultiKillVoice(this.killStreak);
                        }
                        if (hit.victim === this.playerId) {
                            this.closeScope();
                            this.killStreak = 0;
                            this.audio.playDeathSound();
                            this.playDeathAnimation();
                        }
                    } else if (hit.type === 'hit' && hit.shooter === this.playerId) {
                        this.createHitMarker();
                        this.audio.playHitSound();
                    }
                });
                break;
            case 'respawn':
                if (data.player_id === this.playerId) {
                    this.clearRespawnTimer();
                    this.stopSpectating();
                    document.getElementById('death-screen').style.display = 'none';
                    document.getElementById('game').classList.remove('dead-effect');
                    document.getElementById('death-overlay').classList.remove('active');
                    this.resetDeathAnimation();
                    this.camera.position.set(data.player.x, this.standingHeight, data.player.y);
                    this.ammo = this.maxAmmo;
                    this.grenadeCount = 1;
                    this.updateAmmoDisplay();
                }
                break;
            case 'game_over':
                const ctScore = data.ct_score !== undefined ? data.ct_score : data.ct_kills;
                const tScore = data.t_score !== undefined ? data.t_score : data.t_kills;
                this.showGameOver(data.winner, ctScore, tScore, data.reason);
                break;
            case 'score_update':
                this.ctKills = data.ct_kills || 0;
                this.tKills = data.t_kills || 0;
                this.updateTeamScores();
                break;
            case 'room_full':
                alert('房间已满 (每队最多5人)');
                this.backToMenu();
                break;
            case 'room_not_found':
                alert('房间不存在，请创建房间或输入正确的房间号');
                this.backToMenu();
                break;
            case 'join_error':
                alert(data.message || '加入房间失败');
                this.backToMenu();
                break;
            case 'bullet':
                if (data.bullet && data.bullet.owner_id !== this.playerId) {
                    const shooter = this.players[data.bullet.owner_id];
                    if (shooter) {
                        const dx = shooter.x - this.camera.position.x;
                        const dz = shooter.y - this.camera.position.z;
                        const distance = Math.sqrt(dx * dx + dz * dz);
                        const maxDistance = 150;
                        const volume = Math.max(0.1, 1 - distance / maxDistance) * 0.6;
                        this.audio.playRemoteGunSound(data.bullet.weapon || shooter.weapon || 'ak47', volume);
                    }
                }
                break;
            case 'grenade_thrown':
                // 其他玩家投掷手雷
                if (data.owner_id !== this.playerId) {
                    const start = new THREE.Vector3(data.start.x, data.start.y, data.start.z);
                    const direction = new THREE.Vector3(data.direction.x, data.direction.y, data.direction.z);
                    this.createLocalGrenade(start, direction, true);
                }
                break;
            case 'c4_planted': this.onC4Planted(data); break;
            case 'bomb_defused': this.onBombDefused(data); break;
            case 'bomb_exploded': this.onBombExploded(data); break;
            case 'round_end': this.onRoundEnd(data); break;
            case 'round_start': this.onRoundStart(data); break;
            case 'freeze_time_end': this.onFreezeTimeEnd(); break;
            case 'defuse_started': this.onDefuseStarted(data); break;
            case 'defuse_cancelled':
            case 'defuse_interrupted': this.onDefuseCancelled(); break;
            case 'plant_failed':
            case 'defuse_failed': this.addKillFeed(data.message); break;
        }
    }
    
    // ==================== 爆破模式方法 ====================
    initDefuseMode(data) {
        this.isDefuseMode = true;
        this.hasC4 = data.has_c4 || false;
        this.c4Planted = false;
        this.c4Position = null;
        this.c4Site = null;
        this.bombSites = data.bomb_sites || {};
        this.currentRound = data.current_round || 1;
        this.ctScore = data.ct_score || 0;
        this.tScore = data.t_score || 0;
        this.isPlanting = false;
        this.isDefusing = false;
        this.plantProgress = 0;
        this.defuseProgress = 0;
        
        document.getElementById('defuse-hud').style.display = 'block';
        document.getElementById('round-info').style.display = 'inline';
        document.getElementById('deathmatch-info').style.display = 'none';
        document.getElementById('game').classList.add('defuse-mode');
        document.getElementById('current-round').textContent = this.currentRound;
        document.getElementById('max-rounds').textContent = '10';
        
        this.updateDefuseHUD();
        this.updateDefuseScores();
    }
    
    onC4Planted(data) {
        this.c4Planted = true;
        this.c4Position = data.position;
        this.c4Site = data.site;
        this.hasC4 = false;
        this.c4PlantedTime = Date.now(); // 记录C4安放时间用于音效
        this.lastC4BeepTime = 0; // 重置滴滴声计时
        document.getElementById('c4-timer-display').style.display = 'block';
        document.getElementById('plant-hint').style.display = 'none';
        this.createC4Model(data.position);
        this.audio.playC4PlantSound();
        this.addKillFeed(`💣 C4已安放在 ${data.site} 点!`);
        if (this.selectedTeam === 'ct') this.showDefuseHint();
        // 下包后切换到主武器（如果是自己下的包）
        if (data.planter === this.playerId) {
            this.switchToSlot(1);
        }
    }
    
    createC4Model(position) {
        if (this.c4Model) this.scene.remove(this.c4Model);
        const c4Group = new THREE.Group();
        
        // C4主体 - 使用透明材质避免遮挡玩家
        const bodyGeom = new THREE.BoxGeometry(3, 1.5, 2);
        const bodyMat = new THREE.MeshLambertMaterial({ 
            color: 0x2d2d2d,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.renderOrder = 1;
        c4Group.add(body);
        
        // 红色指示灯
        const lightGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 1,
            depthWrite: false
        });
        const light = new THREE.Mesh(lightGeom, lightMat);
        light.position.set(0, 0.8, 0);
        light.renderOrder = 2;
        c4Group.add(light);
        this.c4Light = light;
        
        // 线缆
        const wireGeom = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
        const wireMat = new THREE.MeshLambertMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });
        const wire = new THREE.Mesh(wireGeom, wireMat);
        wire.position.set(1, 0, 0);
        wire.rotation.z = Math.PI / 4;
        wire.renderOrder = 1;
        c4Group.add(wire);
        
        // 数字显示屏
        const screenGeom = new THREE.BoxGeometry(1.2, 0.5, 0.1);
        const screenMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 1,
            depthWrite: false
        });
        const screen = new THREE.Mesh(screenGeom, screenMat);
        screen.position.set(0, 0.3, 1.05);
        screen.renderOrder = 2;
        c4Group.add(screen);
        
        // 闪光特效 - 环形光晕（不遮挡其他物体）
        const glowGeom = new THREE.RingGeometry(2, 4, 32);
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: false
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.set(0, 0.1, 0);
        glow.rotation.x = -Math.PI / 2;
        glow.renderOrder = 999;
        glow.raycast = () => {};
        c4Group.add(glow);
        this.c4Glow = glow;
        
        // 垂直光柱 - 设置为不遮挡射线检测
        const beamGeom = new THREE.CylinderGeometry(0.5, 1.5, 8, 16, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({ 
            color: 0xff3300, 
            transparent: true, 
            opacity: 0.15,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: false
        });
        const beam = new THREE.Mesh(beamGeom, beamMat);
        beam.position.set(0, 4, 0);
        beam.renderOrder = 999;
        beam.raycast = () => {};
        c4Group.add(beam);
        this.c4Beam = beam;
        
        c4Group.position.set(position.x, 1, position.z);
        this.scene.add(c4Group);
        this.c4Model = c4Group;
    }
    
    onBombDefused(data) {
        this.c4Planted = false;
        this.c4PlantedTime = null;
        this.lastC4BeepTime = 0;
        document.getElementById('c4-timer-display').style.display = 'none';
        document.getElementById('defuse-progress-container').style.display = 'none';
        document.getElementById('defuse-hint').style.display = 'none';
        if (this.c4Model) { this.scene.remove(this.c4Model); this.c4Model = null; }
        this.audio.playC4DefusedSound();
        this.addKillFeed('💚 C4已被拆除!');
    }
    
    onBombExploded(data) {
        this.c4Planted = false;
        this.c4PlantedTime = null;
        this.lastC4BeepTime = 0;
        document.getElementById('c4-timer-display').style.display = 'none';
        if (this.c4Position) this.createC4Explosion(this.c4Position);
        if (this.c4Model) { this.scene.remove(this.c4Model); this.c4Model = null; }
        this.audio.playC4ExplodeSound();
        this.addKillFeed('💥 C4已爆炸!');
    }
    
    createC4Explosion(position) {
        const explosionGeom = new THREE.SphereGeometry(15, 32, 32);
        const explosionMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
        const explosion = new THREE.Mesh(explosionGeom, explosionMat);
        explosion.position.set(position.x, 10, position.z);
        this.scene.add(explosion);
        
        const shockwaveGeom = new THREE.RingGeometry(1, 3, 32);
        const shockwaveMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        const shockwave = new THREE.Mesh(shockwaveGeom, shockwaveMat);
        shockwave.position.set(position.x, 1, position.z);
        shockwave.rotation.x = -Math.PI / 2;
        this.scene.add(shockwave);
        
        const distance = this.camera.position.distanceTo(new THREE.Vector3(position.x, 10, position.z));
        this.screenShake = Math.max(0.5, 2 - distance / 100);
        this.audio.playExplosionSound();
        
        let scale = 1;
        const animate = () => {
            scale += 0.5;
            explosion.scale.set(scale, scale, scale);
            explosionMat.opacity -= 0.03;
            shockwave.scale.set(scale * 3, scale * 3, 1);
            shockwaveMat.opacity -= 0.02;
            if (explosionMat.opacity > 0) requestAnimationFrame(animate);
            else { this.scene.remove(explosion); this.scene.remove(shockwave); }
        };
        animate();
    }
    
    onRoundEnd(data) {
        const roundEndScreen = document.getElementById('round-end-screen');
        const roundWinner = document.getElementById('round-winner');
        const roundReason = document.getElementById('round-reason');
        const roundScore = document.getElementById('round-score');
        
        if (data.winner === 'ct') { roundWinner.textContent = '反恐精英获胜'; roundWinner.className = 'ct-win'; }
        else { roundWinner.textContent = '恐怖分子获胜'; roundWinner.className = 't-win'; }
        
        const reasons = { 'bomb_exploded': 'C4已爆炸', 'bomb_defused': 'C4已拆除', 't_eliminated': '恐怖分子全灭', 'ct_eliminated': '反恐精英全灭', 'time_up': '时间结束' };
        roundReason.textContent = reasons[data.reason] || data.reason;
        roundScore.textContent = `反恐精英 ${data.ct_score} - ${data.t_score} 恐怖分子`;
        this.ctScore = data.ct_score;
        this.tScore = data.t_score;
        this.updateDefuseScores();
        roundEndScreen.style.display = 'flex';
        setTimeout(() => { roundEndScreen.style.display = 'none'; }, 3000);
    }
    
    onRoundStart(data) {
        this.currentRound = data.round;
        this.c4Planted = false;
        this.c4Position = null;
        this.c4PlantedTime = null;
        this.lastC4BeepTime = 0;
        this.isPlanting = false;
        this.isDefusing = false;
        if (this.plantInterval) {
            clearInterval(this.plantInterval);
            this.plantInterval = null;
        }
        document.getElementById('round-end-screen').style.display = 'none';
        document.getElementById('c4-timer-display').style.display = 'none';
        document.getElementById('defuse-progress-container').style.display = 'none';
        document.getElementById('plant-progress-container').style.display = 'none';
        document.getElementById('plant-hint').style.display = 'none';
        document.getElementById('defuse-hint').style.display = 'none';
        document.getElementById('freeze-time-overlay').style.display = 'flex';
        if (this.c4Model) { this.scene.remove(this.c4Model); this.c4Model = null; }
        document.getElementById('current-round').textContent = this.currentRound;
        document.getElementById('death-screen').style.display = 'none';
        document.getElementById('game').classList.remove('dead-effect');
        document.getElementById('death-overlay').classList.remove('active');
        this.resetDeathAnimation();
        
        // 退出观战模式
        this.stopSpectating();
        
        // 更新玩家位置到出生点
        if (data.players && data.players[this.playerId]) {
            const myPlayer = data.players[this.playerId];
            this.camera.position.set(myPlayer.x, this.standingHeight, myPlayer.y);
            this.players = data.players;
        }
        
        // 更新C4携带状态
        this.hasC4 = (data.c4_carrier === this.playerId);
        this.updateDefuseHUD();
        
        // 重置弹药
        this.ammo = this.maxAmmo;
        this.grenadeCount = 1;
        this.updateAmmoDisplay();
        
        this.addKillFeed(`=== 第 ${this.currentRound} 回合 ===`);
    }
    
    onFreezeTimeEnd() {
        document.getElementById('freeze-time-overlay').style.display = 'none';
        this.addKillFeed('回合开始!');
    }
    
    onDefuseStarted(data) {
        if (data.defuser !== this.playerId) this.addKillFeed('CT正在拆弹...');
    }
    
    onDefuseCancelled() {
        document.getElementById('defuse-progress-container').style.display = 'none';
        this.isDefusing = false;
        this.defuseProgress = 0;
    }
    
    updateDefuseHUD() {
        if (!this.isDefuseMode) return;
        const c4Status = document.getElementById('c4-status');
        if (this.hasC4) c4Status.textContent = '你携带着C4 (按5切出)';
        else if (this.c4Planted) c4Status.textContent = `C4已安放在 ${this.c4Site} 点`;
        else c4Status.textContent = '';
    }
    
    // C4倒计时音效
    updateC4BeepSound() {
        if (!this.c4Planted || !this.c4PlantedTime) return;
        
        const now = Date.now();
        const c4Timer = 40; // C4爆炸倒计时40秒
        const elapsed = (now - this.c4PlantedTime) / 1000;
        const remaining = Math.max(0, c4Timer - elapsed);
        
        // 根据剩余时间决定滴滴声间隔
        let beepInterval;
        if (remaining <= 5) beepInterval = 200;
        else if (remaining <= 10) beepInterval = 400;
        else if (remaining <= 20) beepInterval = 800;
        else beepInterval = 1500;
        
        if (!this.lastC4BeepTime || now - this.lastC4BeepTime >= beepInterval) {
            this.audio.playC4BeepSound(remaining);
            this.lastC4BeepTime = now;
        }
    }
    
    updateDefuseScores() {
        document.getElementById('ct-score').textContent = `反恐精英: ${this.ctScore}`;
        document.getElementById('t-score').textContent = `恐怖分子: ${this.tScore}`;
    }
    
    // ==================== 观战模式 ====================
    startSpectating() {
        if (!this.isDefuseMode) return;
        
        // 获取存活的队友列表
        this.spectatorTargets = this.getAliveTeammates();
        
        if (this.spectatorTargets.length === 0) {
            // 没有存活的队友
            this.isSpectating = false;
            this.spectatingPlayerId = null;
            this.hideSpectatorUI();
            return;
        }
        
        this.isSpectating = true;
        this.spectatingPlayerId = this.spectatorTargets[0];
        this.showSpectatorUI();
        this.updateSpectatorView();
    }
    
    getAliveTeammates() {
        const teammates = [];
        for (const [id, player] of Object.entries(this.players)) {
            if (id !== this.playerId && player.team === this.selectedTeam && player.is_alive) {
                teammates.push(id);
            }
        }
        return teammates;
    }
    
    switchSpectatorTarget() {
        if (!this.isSpectating) return;
        
        // 更新存活队友列表
        this.spectatorTargets = this.getAliveTeammates();
        
        if (this.spectatorTargets.length === 0) {
            this.stopSpectating();
            return;
        }
        
        // 找到当前观战目标的索引
        const currentIndex = this.spectatorTargets.indexOf(this.spectatingPlayerId);
        // 切换到下一个
        const nextIndex = (currentIndex + 1) % this.spectatorTargets.length;
        this.spectatingPlayerId = this.spectatorTargets[nextIndex];
        this.updateSpectatorView();
    }
    
    updateSpectatorView() {
        if (!this.isSpectating || !this.spectatingPlayerId) return;
        
        const target = this.players[this.spectatingPlayerId];
        if (!target || !target.is_alive) {
            // 目标已死亡，切换到下一个
            this.spectatorTargets = this.getAliveTeammates();
            if (this.spectatorTargets.length > 0) {
                this.spectatingPlayerId = this.spectatorTargets[0];
                this.updateSpectatorView();
            } else {
                this.stopSpectating();
            }
            return;
        }
        
        // 更新观战UI显示
        const spectatorName = document.getElementById('spectator-name');
        if (spectatorName) {
            spectatorName.textContent = target.name || '队友';
        }
        
        // 更新武器模型
        this.updateSpectatorWeapon();
    }
    
    stopSpectating() {
        this.isSpectating = false;
        this.spectatingPlayerId = null;
        this.spectatorTargets = [];
        this.hideSpectatorUI();
    }
    
    showSpectatorUI() {
        const spectatorUI = document.getElementById('spectator-ui');
        if (spectatorUI) {
            spectatorUI.style.display = 'block';
        }
        // 观战时显示被观战者的武器模型
        this.updateSpectatorWeapon();
    }
    
    updateSpectatorWeapon() {
        if (!this.isSpectating || !this.spectatingPlayerId) return;
        
        const target = this.players[this.spectatingPlayerId];
        if (!target) return;
        
        // 更新为被观战者的武器
        const targetWeapon = target.weapon || 'ak47';
        if (this.gunModel) {
            this.camera.remove(this.gunModel);
        }
        this.weaponBuilder = new WeaponModelBuilder(target.team);
        this.gunModel = this.weaponBuilder.createModel(targetWeapon);
        this.gunBasePosition = this.gunModel.position.clone();
        this.gunBaseRotation = this.gunModel.rotation.clone();
        this.camera.add(this.gunModel);
    }
    
    hideSpectatorUI() {
        const spectatorUI = document.getElementById('spectator-ui');
        if (spectatorUI) {
            spectatorUI.style.display = 'none';
        }
        // 恢复自己的枪械模型
        this.updateGunModel();
    }
    
    updateSpectatorCamera() {
        if (!this.isSpectating || !this.spectatingPlayerId) return;
        
        const target = this.players[this.spectatingPlayerId];
        if (!target || !target.is_alive) {
            this.switchSpectatorTarget();
            return;
        }
        
        // 直接使用玩家数据的位置（target.x是x坐标，target.y是z坐标）
        const targetX = target.x;
        const targetZ = target.y; // 注意：服务器的y是游戏中的z
        const targetHeight = (target.height_offset || 0) + this.standingHeight;
        
        // 跟随目标位置
        this.camera.position.x = targetX;
        this.camera.position.z = targetZ;
        this.camera.position.y = targetHeight;
        
        // 跟随目标视角
        this.yaw = -target.angle + Math.PI / 2;
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = 0; // 保持水平视角
    }
    
    showDefuseHint() {
        if (this.c4Planted && this.selectedTeam === 'ct') document.getElementById('defuse-hint').style.display = 'block';
    }
    
    isInBombSite() {
        if (!this.bombSites || !this.camera) return null;
        const px = this.camera.position.x;
        const pz = this.camera.position.z;
        for (const [siteName, site] of Object.entries(this.bombSites)) {
            const dx = px - site.x;
            const dz = pz - site.z;
            if (Math.sqrt(dx * dx + dz * dz) <= site.radius) return siteName;
        }
        return null;
    }
    
    isNearC4() {
        if (!this.c4Planted || !this.c4Position || !this.camera) return false;
        const dx = this.camera.position.x - this.c4Position.x;
        const dz = this.camera.position.z - this.c4Position.z;
        return Math.sqrt(dx * dx + dz * dz) <= 5;
    }
    
    tryPlantC4() {
        if (!this.isDefuseMode || !this.hasC4 || this.c4Planted) return;
        const site = this.isInBombSite();
        if (site) {
            this.startPlantingC4();
        }
    }
    
    // 开始下包读条
    startPlantingC4() {
        if (!this.isDefuseMode || !this.hasC4 || this.c4Planted || this.isPlanting) return;
        const site = this.isInBombSite();
        if (!site) {
            this.addKillFeed('不在包点范围内');
            return;
        }
        
        this.isPlanting = true;
        this.plantProgress = 0;
        this.plantStartTime = Date.now();
        document.getElementById('plant-progress-container').style.display = 'block';
        this.audio.playC4PlantSound();
        
        // 开始下包进度更新
        this.plantInterval = setInterval(() => {
            if (!this.isPlanting) {
                clearInterval(this.plantInterval);
                this.plantInterval = null;
                return;
            }
            
            // 检查鼠标左键是否还在按着（通过isFiring状态或专门的下包状态）
            // 注意：鼠标左键下包时isFiring不会被设置，所以需要单独检查
            
            const elapsed = (Date.now() - this.plantStartTime) / 1000;
            const plantTime = 3; // 下包需要3秒
            this.plantProgress = Math.min(elapsed / plantTime, 1);
            
            const progressBar = document.getElementById('plant-progress');
            if (progressBar) {
                progressBar.style.width = (this.plantProgress * 100) + '%';
            }
            
            // 检查是否还在包点内
            if (!this.isInBombSite()) {
                this.cancelPlanting();
                this.addKillFeed('离开包点，下包取消');
                return;
            }
            
            if (this.plantProgress >= 1) {
                // 下包完成
                clearInterval(this.plantInterval);
                this.plantInterval = null;
                this.isPlanting = false;
                document.getElementById('plant-progress-container').style.display = 'none';
                this.ws.send(JSON.stringify({ action: 'plant_c4' }));
                // 下包后切换到主武器
                this.hasC4 = false;
                this.switchToSlot(1);
            }
        }, 50);
    }
    
    // 取消下包
    cancelPlanting() {
        if (this.isPlanting) {
            this.isPlanting = false;
            this.plantProgress = 0;
            if (this.plantInterval) {
                clearInterval(this.plantInterval);
                this.plantInterval = null;
            }
            document.getElementById('plant-progress-container').style.display = 'none';
        }
    }
    
    tryDefuse() {
        if (!this.isDefuseMode || !this.c4Planted || this.selectedTeam !== 'ct') return;
        if (this.isNearC4() && !this.isDefusing) {
            this.isDefusing = true;
            this.defuseStartTime = Date.now();
            document.getElementById('defuse-progress-container').style.display = 'block';
            this.audio.playC4DefuseSound();
            this.ws.send(JSON.stringify({ action: 'start_defuse' }));
        }
    }
    
    // 更新拆弹进度（在update循环中调用）
    updateDefuseProgress() {
        if (!this.isDefusing || !this.c4Planted) return;
        
        // 检查E键是否还在按着
        if (!this.keys['KeyE']) {
            this.cancelDefuse();
            return;
        }
        
        // 检查是否还在C4附近
        if (!this.isNearC4()) {
            this.cancelDefuse();
            this.addKillFeed('离开C4，拆弹取消');
            return;
        }
        
        const elapsed = (Date.now() - this.defuseStartTime) / 1000;
        const defuseTime = 10; // 拆弹需要10秒（无拆弹器）
        const progress = Math.min(elapsed / defuseTime, 1);
        
        const progressBar = document.getElementById('defuse-progress');
        if (progressBar) {
            progressBar.style.width = (progress * 100) + '%';
        }
    }
    
    cancelDefuse() {
        if (this.isDefusing) {
            this.isDefusing = false;
            document.getElementById('defuse-progress-container').style.display = 'none';
            this.ws.send(JSON.stringify({ action: 'cancel_defuse' }));
        }
    }

    
    // ==================== 状态更新 ====================
    updateState(state) {
        this.players = state.players;
        if (state.ct_kills !== undefined) this.ctKills = state.ct_kills;
        if (state.t_kills !== undefined) this.tKills = state.t_kills;
        this.updateTeamScores();
        
        if (state.remaining_time !== undefined && state.remaining_time >= 0) {
            this.remainingTime = state.remaining_time;
            const minutes = Math.floor(this.remainingTime / 60);
            const seconds = this.remainingTime % 60;
            document.getElementById('game-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')} | `;
            document.getElementById('game-timer').style.display = 'inline';
        }
        
        if (state.game_mode) {
            this.selectedGameMode = state.game_mode;
            const modeText = state.game_mode === 'deathmatch' ? '团队竞技' : '爆破模式';
            document.getElementById('game-mode-text').textContent = modeText + ' | ';
        }
        
        if (state.game_mode === 'defuse') {
            if (state.current_round !== undefined) {
                this.currentRound = state.current_round;
                document.getElementById('current-round').textContent = this.currentRound;
            }
            if (state.ct_score !== undefined) this.ctScore = state.ct_score;
            if (state.t_score !== undefined) this.tScore = state.t_score;
            this.updateDefuseScores();
            
            if (state.round_time !== undefined && state.round_time >= 0) {
                const minutes = Math.floor(state.round_time / 60);
                const seconds = state.round_time % 60;
                document.getElementById('game-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')} | `;
                document.getElementById('game-timer').style.display = 'inline';
            }
            
            if (state.is_freeze_time) {
                document.getElementById('freeze-time-overlay').style.display = 'flex';
                if (state.round_time !== undefined) document.getElementById('freeze-countdown').textContent = `准备阶段 ${state.round_time}`;
            } else {
                document.getElementById('freeze-time-overlay').style.display = 'none';
            }
            
            if (state.c4_planted) {
                this.c4Planted = true;
                if (state.c4_position) this.c4Position = state.c4_position;
                if (state.c4_site) this.c4Site = state.c4_site;
                if (state.c4_time !== undefined) {
                    document.getElementById('c4-timer-display').style.display = 'block';
                    document.getElementById('c4-countdown').textContent = state.c4_time;
                    document.getElementById('c4-timer-display').style.animationDuration = state.c4_time <= 10 ? '0.25s' : '0.5s';
                }
                if (this.selectedTeam === 'ct' && this.isNearC4()) document.getElementById('defuse-hint').style.display = 'block';
                else document.getElementById('defuse-hint').style.display = 'none';
            } else {
                this.c4Planted = false;
                document.getElementById('c4-timer-display').style.display = 'none';
                document.getElementById('defuse-hint').style.display = 'none';
            }
            
            // 只有拆包人自己才显示拆包读条
            if (state.defuse_progress !== undefined && state.defuse_progress > 0 && state.defuser_id === this.playerId) {
                document.getElementById('defuse-progress-container').style.display = 'block';
                document.getElementById('defuse-progress-bar').style.setProperty('--progress', (state.defuse_progress * 100) + '%');
            } else if (!this.isDefusing) {
                document.getElementById('defuse-progress-container').style.display = 'none';
            }
            
            if (state.c4_carrier === this.playerId) {
                this.hasC4 = true;
                const site = this.isInBombSite();
                if (site && !state.c4_planted && !state.is_freeze_time) document.getElementById('plant-hint').style.display = 'block';
                else document.getElementById('plant-hint').style.display = 'none';
            } else {
                this.hasC4 = false;
                document.getElementById('plant-hint').style.display = 'none';
            }
            
            this.updateDefuseHUD();
        }
        
        Object.entries(this.players).forEach(([id, player]) => {
            if (id === this.playerId) { this.updateHUD(player); return; }
            if (!player.is_alive) {
                if (this.playerMeshes[id]) {
                    const mesh = this.playerMeshes[id];
                    if (!mesh.userData.isDying && !mesh.userData.isDead) {
                        mesh.userData.isDying = true;
                        mesh.userData.deathStartTime = Date.now();
                        mesh.userData.deathStartRotationX = mesh.rotation.x || 0;
                        mesh.userData.deathStartY = mesh.position.y;
                    }
                }
                return;
            }
            
            // 玩家存活但mesh标记为死亡状态，强制删除并重建
            if (this.playerMeshes[id] && (this.playerMeshes[id].userData.isDying || this.playerMeshes[id].userData.isDead)) {
                this.scene.remove(this.playerMeshes[id]);
                delete this.playerMeshes[id];
            }
            
            const needsUpdate = !this.playerMeshes[id] || 
                this.playerMeshes[id].userData.crouching !== player.crouching ||
                this.playerMeshes[id].userData.weapon !== player.weapon;
            
            if (needsUpdate) {
                let oldPosition = null;
                let oldRotation = null;
                if (this.playerMeshes[id]) {
                    oldPosition = this.playerMeshes[id].position.clone();
                    oldRotation = this.playerMeshes[id].rotation.y;
                    this.scene.remove(this.playerMeshes[id]);
                }
                const mesh = PlayerModel.create(player.team, player.crouching, player.weapon);
                mesh.userData.crouching = player.crouching;
                mesh.userData.weapon = player.weapon;
                mesh.userData.meshId = Date.now() + '_' + id; // 唯一标识符，防止旧timeout删除新mesh
                if (oldPosition) {
                    mesh.position.copy(oldPosition);
                    mesh.rotation.y = oldRotation;
                } else {
                    mesh.position.set(player.x, player.height_offset || 0, player.y);
                    mesh.rotation.y = -player.angle + Math.PI / 2;
                }
                this.scene.add(mesh);
                this.playerMeshes[id] = mesh;
            }
            
            const mesh = this.playerMeshes[id];
            if (mesh) {
                mesh.userData.targetX = player.x;
                mesh.userData.targetZ = player.y;
                mesh.userData.targetY = player.height_offset || 0;
                mesh.userData.targetAngle = -player.angle + Math.PI / 2;
                mesh.userData.isShooting = player.is_shooting;
            }
        });
        
        // 清理不存在于players中的旧mesh（玩家离开或数据不同步）
        Object.keys(this.playerMeshes).forEach(id => {
            if (id !== this.playerId && !this.players[id]) {
                this.scene.remove(this.playerMeshes[id]);
                delete this.playerMeshes[id];
            }
        });
    }
    
    updateOtherPlayers() {
        const lerpFactor = 0.3;
        for (const [id, mesh] of Object.entries(this.playerMeshes)) {
            if (mesh.userData.isDying) {
                const elapsed = Date.now() - mesh.userData.deathStartTime;
                const duration = 600;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                mesh.rotation.x = mesh.userData.deathStartRotationX + (Math.PI / 2) * easeOut;
                mesh.position.y = mesh.userData.deathStartY - 3 * easeOut;
                if (progress >= 1) {
                    mesh.userData.isDying = false;
                    mesh.userData.isDead = true;
                    const meshId = mesh.userData.meshId; // 保存当前mesh的唯一ID
                    setTimeout(() => {
                        // 只有当mesh ID匹配时才删除，防止删除新创建的mesh
                        if (this.playerMeshes[id] && 
                            this.playerMeshes[id].userData.isDead && 
                            this.playerMeshes[id].userData.meshId === meshId) {
                            this.scene.remove(this.playerMeshes[id]);
                            delete this.playerMeshes[id];
                        }
                    }, 3000);
                }
                continue;
            }
            if (mesh.userData.isDead) continue;
            if (!mesh.userData.targetX) continue;
            if (mesh.userData.isShooting) PlayerModel.showMuzzleFlash(mesh);
            
            const dx = mesh.userData.targetX - mesh.position.x;
            const dz = mesh.userData.targetZ - mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 50) {
                mesh.position.x = mesh.userData.targetX;
                mesh.position.z = mesh.userData.targetZ;
                mesh.position.y = mesh.userData.targetY;
                mesh.rotation.y = mesh.userData.targetAngle;
            } else {
                mesh.position.x += dx * lerpFactor;
                mesh.position.z += dz * lerpFactor;
                mesh.position.y += (mesh.userData.targetY - mesh.position.y) * lerpFactor;
                let angleDiff = mesh.userData.targetAngle - mesh.rotation.y;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                mesh.rotation.y += angleDiff * lerpFactor;
            }
        }
    }
    
    respawn() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'respawn' }));
        }
    }

    // ==================== 游戏循环 ====================
    // 检测点到旋转矩形的碰撞（使用OBB算法）
    checkRotatedRectCollision(px, pz, cx, cz, hw, hd, rotation) {
        // 将玩家位置转换到矩形的局部坐标系（反向旋转）
        // Three.js的rotation.y是绕Y轴旋转，正值为逆时针（从上往下看）
        const cos = Math.cos(-rotation);  // 反向旋转
        const sin = Math.sin(-rotation);
        const dx = px - cx;
        const dz = pz - cz;
        // 旋转变换：将世界坐标转换到局部坐标
        const localX = dx * cos - dz * sin;
        const localZ = dx * sin + dz * cos;
        
        // 计算到矩形边缘的最近点（在局部坐标系中）
        const clampedX = Math.max(-hw, Math.min(hw, localX));
        const clampedZ = Math.max(-hd, Math.min(hd, localZ));
        
        // 计算从最近点到玩家的向量（在局部坐标系中）
        const localDistX = localX - clampedX;
        const localDistZ = localZ - clampedZ;
        const dist = Math.sqrt(localDistX * localDistX + localDistZ * localDistZ);
        
        // 检查是否在矩形内部
        const isInside = Math.abs(localX) <= hw && Math.abs(localZ) <= hd;
        
        // 计算推力方向
        let worldPushX, worldPushZ;
        
        if (isInside) {
            // 在内部：找到最近的边并推出
            const distToLeft = localX + hw;
            const distToRight = hw - localX;
            const distToBack = localZ + hd;
            const distToFront = hd - localZ;
            const minDist = Math.min(distToLeft, distToRight, distToBack, distToFront);
            
            let localPushX = 0, localPushZ = 0;
            if (minDist === distToLeft) {
                localPushX = -1;
            } else if (minDist === distToRight) {
                localPushX = 1;
            } else if (minDist === distToBack) {
                localPushZ = -1;
            } else {
                localPushZ = 1;
            }
            
            // 转换回世界坐标（正向旋转）
            const cosR = Math.cos(rotation);
            const sinR = Math.sin(rotation);
            worldPushX = localPushX * cosR - localPushZ * sinR;
            worldPushZ = localPushX * sinR + localPushZ * cosR;
            
            return { dist: -minDist, pushX: worldPushX, pushZ: worldPushZ, isInside: true, penetration: minDist };
        } else {
            // 在外部：推力方向是从最近点指向玩家
            if (dist > 0.001) {
                // 归一化局部推力方向
                const localPushX = localDistX / dist;
                const localPushZ = localDistZ / dist;
                // 转换回世界坐标（正向旋转）
                const cosR = Math.cos(rotation);
                const sinR = Math.sin(rotation);
                worldPushX = localPushX * cosR - localPushZ * sinR;
                worldPushZ = localPushX * sinR + localPushZ * cosR;
            } else {
                worldPushX = 1;
                worldPushZ = 0;
            }
            
            return { dist, pushX: worldPushX, pushZ: worldPushZ, isInside: false, penetration: 0 };
        }
    }
    
    checkCollision(newX, newZ, checkHeight = null) {
        const playerRadius = 2.5;
        const mapConfig = MapConfigs[this.selectedMap];
        const mapSize = (mapConfig && mapConfig.mapSize) || 125;
        const mapBoundary = mapSize;
        const playerHeight = checkHeight !== null ? checkHeight : this.camera.position.y;
        const maxJumpHeight = 20;
        
        let resultX = newX;
        let resultZ = newZ;
        let blocked = false;
        let standingOnHeight = 0;
        
        // 边界碰撞
        if (resultX < -mapBoundary) { resultX = -mapBoundary; blocked = true; }
        if (resultX > mapBoundary) { resultX = mapBoundary; blocked = true; }
        if (resultZ < -mapBoundary) { resultZ = -mapBoundary; blocked = true; }
        if (resultZ > mapBoundary) { resultZ = mapBoundary; blocked = true; }
        
        // 多次迭代解决碰撞（处理多个墙壁同时碰撞的情况）
        for (let iteration = 0; iteration < 4; iteration++) {
            let maxPenetration = 0;
            let bestPushX = 0, bestPushZ = 0;
            
            for (const wall of this.walls) {
                const wallHeight = wall.h || 20;
                const playerFeetHeight = playerHeight - this.standingHeight;
                
                // 如果玩家脚底高于障碍物，跳过碰撞但检查是否站在上面
                if (playerFeetHeight >= wallHeight - 0.5) {
                    let isAboveWall = false;
                    if (wall.rotation && wall.rotation !== 0) {
                        const hw = (wall.originalW || wall.w) / 2;
                        const hd = (wall.originalD || wall.d) / 2;
                        const cx = wall.centerX !== undefined ? wall.centerX : (wall.x + wall.w / 2);
                        const cz = wall.centerZ !== undefined ? wall.centerZ : (wall.z + wall.d / 2);
                        const result = this.checkRotatedRectCollision(resultX, resultZ, cx, cz, hw, hd, wall.rotation);
                        isAboveWall = result.isInside;
                    } else {
                        const wx = wall.x, wz = wall.z, ww = wall.w, wd = wall.d;
                        isAboveWall = resultX >= wx && resultX <= wx + ww && resultZ >= wz && resultZ <= wz + wd;
                    }
                    if (isAboveWall && wallHeight <= maxJumpHeight) {
                        standingOnHeight = Math.max(standingOnHeight, wallHeight);
                    }
                    continue;
                }
                
                if (wall.rotation && wall.rotation !== 0) {
                    // 旋转墙壁使用OBB碰撞检测
                    const hw = (wall.originalW || wall.w) / 2;
                    const hd = (wall.originalD || wall.d) / 2;
                    const cx = wall.centerX !== undefined ? wall.centerX : (wall.x + wall.w / 2);
                    const cz = wall.centerZ !== undefined ? wall.centerZ : (wall.z + wall.d / 2);
                    
                    const result = this.checkRotatedRectCollision(resultX, resultZ, cx, cz, hw, hd, wall.rotation);
                    
                    if (result.isInside) {
                        // 玩家在墙内
                        const penetration = result.penetration + playerRadius;
                        if (penetration > maxPenetration) {
                            maxPenetration = penetration;
                            bestPushX = result.pushX * penetration;
                            bestPushZ = result.pushZ * penetration;
                        }
                        blocked = true;
                    } else if (result.dist < playerRadius) {
                        // 玩家靠近墙壁
                        const penetration = playerRadius - result.dist;
                        if (penetration > maxPenetration) {
                            maxPenetration = penetration;
                            bestPushX = result.pushX * penetration;
                            bestPushZ = result.pushZ * penetration;
                        }
                        blocked = true;
                    }
                } else {
                    // 非旋转墙壁使用AABB检测
                    const wx = wall.x, wz = wall.z, ww = wall.w, wd = wall.d;
                    const closestX = Math.max(wx, Math.min(resultX, wx + ww));
                    const closestZ = Math.max(wz, Math.min(resultZ, wz + wd));
                    const distX = resultX - closestX;
                    const distZ = resultZ - closestZ;
                    const dist = Math.sqrt(distX * distX + distZ * distZ);
                    
                    if (dist < playerRadius) {
                        blocked = true;
                        const penetration = playerRadius - dist;
                        if (penetration > maxPenetration) {
                            maxPenetration = penetration;
                            if (dist > 0.01) {
                                bestPushX = (distX / dist) * penetration;
                                bestPushZ = (distZ / dist) * penetration;
                            } else {
                                // 在墙内，推向最近的边
                                const toLeft = resultX - wx;
                                const toRight = wx + ww - resultX;
                                const toBack = resultZ - wz;
                                const toFront = wz + wd - resultZ;
                                const minDist = Math.min(toLeft, toRight, toBack, toFront);
                                if (minDist === toLeft) { bestPushX = -(playerRadius + toLeft); bestPushZ = 0; }
                                else if (minDist === toRight) { bestPushX = playerRadius + toRight; bestPushZ = 0; }
                                else if (minDist === toBack) { bestPushX = 0; bestPushZ = -(playerRadius + toBack); }
                                else { bestPushX = 0; bestPushZ = playerRadius + toFront; }
                            }
                        }
                    }
                }
            }
            
            // 应用最大穿透的推力
            if (maxPenetration > 0.01) {
                resultX += bestPushX;
                resultZ += bestPushZ;
            } else {
                break; // 没有碰撞，退出迭代
            }
        }
        
        // 再次检查边界
        resultX = Math.max(-mapBoundary, Math.min(mapBoundary, resultX));
        resultZ = Math.max(-mapBoundary, Math.min(mapBoundary, resultZ));
        
        const pushX = resultX - newX;
        const pushZ = resultZ - newZ;
        
        return { blocked, pushX, pushZ, clampedX: resultX, clampedZ: resultZ, standingOnHeight };
    }
    
    canCrouchAt(x, z) {
        const playerRadius = 2.5;
        for (const wall of this.walls) {
            const wallHeight = wall.h || 20;
            let dist;
            
            if (wall.rotation && wall.rotation !== 0) {
                // 旋转墙壁使用OBB检测
                const hw = (wall.originalW || wall.w) / 2;
                const hd = (wall.originalD || wall.d) / 2;
                const cx = wall.centerX !== undefined ? wall.centerX : (wall.x + wall.w / 2);
                const cz = wall.centerZ !== undefined ? wall.centerZ : (wall.z + wall.d / 2);
                const result = this.checkRotatedRectCollision(x, z, cx, cz, hw, hd, wall.rotation);
                dist = result.isInside ? -result.penetration : result.dist;
            } else {
                // 非旋转墙壁使用AABB检测
                const wx = wall.x, wz = wall.z, ww = wall.w, wd = wall.d;
                const closestX = Math.max(wx, Math.min(x, wx + ww));
                const closestZ = Math.max(wz, Math.min(z, wz + wd));
                const distX = x - closestX;
                const distZ = z - closestZ;
                dist = Math.sqrt(distX * distX + distZ * distZ);
            }
            
            if (dist < playerRadius && this.crouchingHeight < wallHeight && this.standingHeight >= wallHeight) return false;
        }
        return true;
    }
    
    update(deltaTime) {
        const baseFrameTime = 1 / 60;
        const deltaMultiplier = deltaTime / baseFrameTime;
        
        if (this.isLocked && this.isFiring) {
            const config = WeaponConfigs[this.currentWeapon];
            if (config && config.auto) this.shoot();
        }
        
        if (!this.isFiring) {
            const timeSinceRelease = Date.now() - this.lastShotReleaseTime;
            if (timeSinceRelease > 150) {
                this.shotsFired = Math.max(0, this.shotsFired - 1);
                if (this.shotsFired === 0) this.recoilAccumulator *= 0.85;
            }
            this.crosshairOffset *= 0.9;
        }
        
        // 更新拆弹进度
        if (this.isDefusing) {
            this.updateDefuseProgress();
        }
        
        // 更新C4倒计时音效
        if (this.c4Planted && this.isDefuseMode) {
            this.updateC4BeepSound();
        }
        
        if (!this.playerId || this.gameOver) { this.updateGunAnimation(deltaMultiplier); this.updateOtherPlayers(); return; }
        const player = this.players[this.playerId];
        if (!player || !player.is_alive) {
            // 观战模式下更新摄像机跟随
            if (this.isSpectating) {
                this.updateSpectatorCamera();
            }
            this.updateGunAnimation(deltaMultiplier);
            this.updateOtherPlayers(); // 死亡时也要更新其他玩家的位置
            return;
        }
        
        const baseMoveSpeed = this.isCrouching ? 10 : 18;
        const moveSpeed = baseMoveSpeed * deltaTime;
        let dx = 0, dz = 0;
        
        if (this.keys['KeyW']) dz = -1;
        if (this.keys['KeyS']) dz = 1;
        if (this.keys['KeyA']) dx = -1;
        if (this.keys['KeyD']) dx = 1;
        
        if (dx !== 0 || dz !== 0) {
            const angle = this.yaw;
            const moveX = (Math.sin(angle) * dz + Math.cos(angle) * dx) * moveSpeed;
            const moveZ = (Math.cos(angle) * dz - Math.sin(angle) * dx) * moveSpeed;
            let newX = this.camera.position.x + moveX;
            let newZ = this.camera.position.z + moveZ;
            const collision = this.checkCollision(newX, newZ);
            if (collision.blocked) {
                // 使用碰撞检测返回的clampedX/Z作为最终位置
                newX = collision.clampedX;
                newZ = collision.clampedZ;
            }
            this.currentStandingHeight = collision.standingOnHeight || 0;
            this.camera.position.x = newX;
            this.camera.position.z = newZ;
            this.audio.playFootstep();
        }
        
        if (this.keys['Space'] && this.canJump) {
            this.velocity.y = this.isCrouching ? 39 : 45;
            this.canJump = false;
        }
        
        const baseGroundHeight = this.isCrouching ? this.crouchingHeight : this.standingHeight;
        const buildingHeight = this.currentStandingHeight || 0;
        const groundHeight = baseGroundHeight + buildingHeight;
        this.targetCameraHeight = groundHeight;
        
        if (!this.canJump) {
            const gravity = 150;
            this.velocity.y -= gravity * deltaTime;
            this.camera.position.y += this.velocity.y * deltaTime;
            if (this.camera.position.y < groundHeight) {
                this.camera.position.y = groundHeight;
                this.velocity.y = 0;
                this.canJump = true;
            }
        } else {
            const heightDiff = this.targetCameraHeight - this.camera.position.y;
            if (Math.abs(heightDiff) > 0.1) {
                const lerpSpeed = 15;
                this.camera.position.y += heightDiff * Math.min(lerpSpeed * deltaTime, 1);
            } else {
                this.camera.position.y = this.targetCameraHeight;
            }
        }
        
        this.currentHeight = this.camera.position.y;
        
        const now = performance.now();
        if (this.ws && this.ws.readyState === WebSocket.OPEN && now - this.lastNetworkSend >= this.networkSendInterval) {
            this.lastNetworkSend = now;
            this.ws.send(JSON.stringify({ 
                action: 'update_position', 
                x: this.camera.position.x,
                z: this.camera.position.z,
                height: this.currentHeight, 
                crouching: this.isCrouching,
                angle: -this.yaw + Math.PI / 2
            }));
        }
        
        this.updateGunAnimation(deltaMultiplier);
        this.updateOtherPlayers();
    }
    
    updateGunAnimation(deltaMultiplier = 1) {
        if (!this.gunModel || !this.gunBasePosition || !this.gunBaseRotation) return;
        this.gunModel.position.copy(this.gunBasePosition);
        this.gunModel.rotation.copy(this.gunBaseRotation);
        
        if (this.gunRecoil > 0.005) {
            this.gunRecoil *= 0.88;
            const recoilZ = this.gunRecoil * 0.1;
            const recoilY = this.gunRecoil * 0.04;
            const recoilRotX = this.gunRecoil * 0.15;
            this.gunModel.position.z += recoilZ;
            this.gunModel.position.y += recoilY;
            this.gunModel.rotation.x -= recoilRotX;
        } else {
            this.gunRecoil = 0;
        }
        
        if (this.isReloading) {
            this.reloadAnimProgress += 0.02;
            const reloadPhase = this.reloadAnimProgress % 1;
            if (reloadPhase < 0.3) this.gunModel.rotation.z += reloadPhase * 1.0;
            else if (reloadPhase < 0.7) this.gunModel.position.y -= (reloadPhase - 0.3) * 0.1;
            else this.gunModel.rotation.z += (1 - reloadPhase) * 1.0;
        }
        
        if (this.isSwitchingWeapon && this.switchAnimProgress < 1) {
            this.switchAnimProgress += 0.05;
            const switchOffset = Math.sin(this.switchAnimProgress * Math.PI) * 0.3;
            this.gunModel.position.y -= switchOffset;
        }
        
        this.screenShake *= 0.9;
        this.updateCrosshair();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        const now = performance.now();
        
        this.fpsFrameCount++;
        if (now - this.fpsLastTime >= 1000) {
            this.currentFPS = this.fpsFrameCount;
            this.fpsFrameCount = 0;
            this.fpsLastTime = now;
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) fpsElement.textContent = `FPS: ${this.currentFPS}`;
        }
        
        this.processMouseMovement();
        
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        const clampedDelta = Math.min(deltaTime, 0.1);
        
        this.update(clampedDelta);
        
        // 更新小地图
        if (this.minimap) this.minimap.update();
        
        // 更新C4闪光特效
        if (this.c4Planted && this.c4Model) {
            const blinkSpeed = this.c4Position ? (this.getC4RemainingTime && this.getC4RemainingTime() <= 10 ? 200 : 500) : 500;
            const blink = Math.floor(now / blinkSpeed) % 2 === 0;
            
            // 指示灯闪烁
            if (this.c4Light) {
                this.c4Light.material.color.setHex(blink ? 0xff0000 : 0x330000);
                this.c4Light.material.emissive = this.c4Light.material.color;
            }
            
            // 光晕脉冲效果
            if (this.c4Glow) {
                const pulse = Math.sin(now / 300) * 0.15 + 0.25;
                this.c4Glow.material.opacity = pulse;
                this.c4Glow.scale.set(1 + pulse * 0.5, 1 + pulse * 0.5, 1);
            }
            
            // 光柱旋转和脉冲
            if (this.c4Beam) {
                this.c4Beam.rotation.y += 0.02;
                const beamPulse = Math.sin(now / 400) * 0.05 + 0.12;
                this.c4Beam.material.opacity = beamPulse;
            }
        }
        
        let shakeOffsetX = 0, shakeOffsetY = 0;
        let shakePitch = 0, shakeYaw = 0;
        
        if (this.screenShake > 0.001) {
            shakeOffsetX = (Math.random() - 0.5) * this.screenShake * 2;
            shakeOffsetY = (Math.random() - 0.5) * this.screenShake * 1.5;
            shakePitch = (Math.random() - 0.5) * this.screenShake * 0.02;
            shakeYaw = (Math.random() - 0.5) * this.screenShake * 0.015;
            this.camera.position.x += shakeOffsetX;
            this.camera.position.y += shakeOffsetY;
            this.camera.rotation.x += shakePitch;
            this.camera.rotation.y += shakeYaw;
        }
        
        this.renderer.render(this.scene, this.camera);
        
        if (this.screenShake > 0.001) {
            this.camera.position.x -= shakeOffsetX;
            this.camera.position.y -= shakeOffsetY;
            this.camera.rotation.x -= shakePitch;
            this.camera.rotation.y -= shakeYaw;
        }
    }
}

// 启动游戏
const game = new PixelCS3D();
