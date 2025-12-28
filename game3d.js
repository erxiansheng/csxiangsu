// CS 1.6 像素风格 3D FPS 游戏 - 主模块

// ==================== 服务器配置 ====================
// 部署时修改为你的服务器地址
// 本地开发: 'ws://localhost:8765'
// 生产环境: 'wss://your-domain.com'
const WS_SERVER_URL = 'wss://cs16xs.188np.cn';
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
        
        // 鼠标移动累积值 - 用于平滑处理
        this.pendingMouseX = 0;
        this.pendingMouseY = 0;
        
        this.isCrouching = false;
        this.standingHeight = 10;
        this.crouchingHeight = 6;
        this.currentHeight = 10;
        this.currentStandingHeight = 0;
        this.targetCameraHeight = 10;  // 目标相机高度，用于平滑过渡
        
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
        this.normalFOV = 75;
        this.scopedFOV = 30;
        this.buyMenuOpen = false;
        this.settingsMenuOpen = false;
        this.respawnTimer = null;
        this.respawnCountdown = 3;
        
        // 灵敏度设置
        this.baseSensitivity = 0.002;
        this.sensitivityMultiplier = 1.0;  // 1-10 对应 0.4-2.0
        this.scopeSensitivityMultiplier = 0.6;  // 开镜灵敏度
        this.masterVolume = 1.0;
        
        // 连杀追踪
        this.killStreak = 0;
        this.lastKillTime = 0;
        this.killStreakTimeout = 5000;  // 5秒内连杀才算
        
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
        this.networkSendInterval = 33; // 约30fps发送网络数据
        
        this.audio = new AudioSystem();
        this.weaponBuilder = null;
        
        this.setupEventListeners();
    }

    // ==================== 事件监听 ====================
    setupEventListeners() {
        document.getElementById('joinBtn').addEventListener('click', () => this.joinGame());
        document.getElementById('createBtn').addEventListener('click', () => this.createGame());
        document.getElementById('teamCT').addEventListener('click', () => this.selectTeam('ct'));
        document.getElementById('teamT').addEventListener('click', () => this.selectTeam('t'));
        document.getElementById('tabJoin').addEventListener('click', () => this.switchTab(false));
        document.getElementById('tabCreate').addEventListener('click', () => this.switchTab(true));
        
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', () => this.buyPrimaryWeapon(btn.dataset.weapon));
        });
        
        // 使用 capture: true 确保优先处理按键事件
        document.addEventListener('keydown', (e) => this.onKeyDown(e), { capture: true });
        document.addEventListener('keyup', (e) => this.onKeyUp(e), { capture: true });
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement !== null;
            if (!this.isLocked) this.isFiring = false;
        });
        
        // 页面加载完成后预加载所有地图资源
        this.preloadMaps();
        
        // 加载公告
        this.loadAnnouncement();
    }
    
    // 从服务端加载公告
    async loadAnnouncement() {
        const announcementEl = document.getElementById('announcement-content');
        if (!announcementEl) return;
        
        try {
            // 通过WebSocket获取公告
            const tempWs = new WebSocket(WS_SERVER_URL);
            
            tempWs.onopen = () => {
                tempWs.send(JSON.stringify({ action: 'get_announcement' }));
            };
            
            tempWs.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.action === 'announcement') {
                        this.displayAnnouncement(data);
                    }
                } catch (e) {
                    console.log('解析公告失败');
                }
                tempWs.close();
            };
            
            tempWs.onerror = () => {
                this.displayDefaultAnnouncement();
            };
            
            // 3秒超时
            setTimeout(() => {
                if (tempWs.readyState === WebSocket.OPEN || tempWs.readyState === WebSocket.CONNECTING) {
                    tempWs.close();
                    this.displayDefaultAnnouncement();
                }
            }, 3000);
        } catch (error) {
            console.log('无法获取公告，使用默认公告');
            this.displayDefaultAnnouncement();
        }
    }
    
    displayAnnouncement(data) {
        const announcementEl = document.getElementById('announcement-content');
        if (!announcementEl) return;
        
        let html = '';
        if (data.announcements && data.announcements.length > 0) {
            data.announcements.forEach(item => {
                html += `<div class="announcement-item">
                    <span class="announcement-date">${item.date || ''}</span>
                    <p class="announcement-text">${item.content}</p>
                </div>`;
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
            <div class="announcement-item">
                <span class="announcement-date">2024-12-28</span>
                <p class="announcement-text">🎉 欢迎来到 CS 1.6 像素版！</p>
            </div>
            <div class="announcement-item">
                <span class="announcement-date">2024-12-28</span>
                <p class="announcement-text">🔫 新增武器：AK47、M4A1、AWP</p>
            </div>
            <div class="announcement-item">
                <span class="announcement-date">2024-12-28</span>
                <p class="announcement-text">🗺️ 多张经典地图可选</p>
            </div>
            <div class="announcement-item">
                <span class="announcement-date">2024-12-28</span>
                <p class="announcement-text">⚡ 支持下蹲跳跃操作</p>
            </div>
        `;
    }
    
    // 预加载所有地图资源
    preloadMaps() {
        const loadingText = document.createElement('div');
        loadingText.id = 'preload-status';
        loadingText.style.cssText = 'position:fixed;bottom:10px;left:10px;color:#0f0;font-size:12px;font-family:monospace;z-index:9999;';
        loadingText.textContent = '正在预加载地图资源...';
        document.body.appendChild(loadingText);
        
        // 使用 requestIdleCallback 或 setTimeout 在空闲时预加载
        const doPreload = () => {
            preloadAllMaps(
                (progress, mapName) => {
                    loadingText.textContent = `预加载地图: ${mapName} (${progress}%)`;
                },
                () => {
                    loadingText.textContent = '✓ 地图资源加载完成';
                    setTimeout(() => loadingText.remove(), 2000);
                }
            );
        };
        
        if (window.requestIdleCallback) {
            requestIdleCallback(doPreload, { timeout: 1000 });
        } else {
            setTimeout(doPreload, 100);
        }
    }
    
    onKeyDown(e) {
        // 在游戏中时，阻止所有可能的浏览器快捷键
        if (this.isLocked) {
            // 阻止 Ctrl 相关的所有默认行为
            if (e.ctrlKey || e.code === 'ControlLeft' || e.code === 'ControlRight') {
                e.preventDefault();
                e.stopPropagation();
            }
            // 阻止游戏按键的默认行为
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyR', 'KeyQ', 'KeyB'].includes(e.code)) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
        
        // 记录按键状态
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
        }
        if (e.code === 'KeyQ') this.switchToPrevious();
        if (e.code === 'KeyB') this.toggleBuyMenu();
        if (e.code === 'Escape') this.toggleSettingsMenu();
        
        if (this.buyMenuOpen) {
            if (e.code === 'Digit1') { this.buyPrimaryWeapon('ak47'); e.preventDefault(); }
            if (e.code === 'Digit2') { this.buyPrimaryWeapon('m4a1'); e.preventDefault(); }
            if (e.code === 'Digit3') { this.buyPrimaryWeapon('awp'); e.preventDefault(); }
        }
    }
    
    onKeyUp(e) {
        this.keys[e.code] = false;
        if (e.code === 'ControlLeft' || e.code === 'ControlRight') this.setCrouch(false);
    }
    
    onMouseDown(e) {
        if (this.buyMenuOpen || !this.isLocked) return;
        if (e.button === 0) {
            this.isFiring = true;
            const config = WeaponConfigs[this.currentWeapon];
            if (!config.auto) this.shoot();
        }
        if (e.button === 2) this.toggleScope();
    }
    
    onMouseUp(e) {
        if (e.button === 0) {
            this.isFiring = false;
            // 不立即重置shotsFired，让它在一定时间后自然衰减
            // 这样连点过快时仍然会累积后坐力
            this.lastShotReleaseTime = Date.now();
        }
    }
    
    onMouseMove(e) {
        if (!this.isLocked || this.buyMenuOpen || this.settingsMenuOpen) return;
        
        // 获取鼠标移动值
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;
        
        // 忽略异常大的移动（可能是窗口切换、指针锁定切换等导致）
        // 但不要过于严格，否则快速移动会被丢弃
        if (Math.abs(movementX) > 200 || Math.abs(movementY) > 200) return;
        
        // 累积鼠标移动，在渲染循环中处理
        this.pendingMouseX += movementX;
        this.pendingMouseY += movementY;
    }
    
    // 处理累积的鼠标移动 - 在渲染循环中调用
    processMouseMovement() {
        if (this.pendingMouseX === 0 && this.pendingMouseY === 0) return;
        
        const baseSens = this.baseSensitivity * this.sensitivityMultiplier;
        const sensitivity = this.isScoped ? baseSens * this.scopeSensitivityMultiplier : baseSens;
        
        this.yaw -= this.pendingMouseX * sensitivity;
        this.pitch -= this.pendingMouseY * sensitivity;
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
        
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        
        // 清空累积值
        this.pendingMouseX = 0;
        this.pendingMouseY = 0;
    }

    // ==================== 菜单和UI ====================
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
                this.sensitivityMultiplier = val / 5;  // 1-10 -> 0.2-2.0
                document.getElementById('sens-value').textContent = val;
            });
        }
        
        if (scopeSensSlider && !scopeSensSlider.hasListener) {
            scopeSensSlider.hasListener = true;
            scopeSensSlider.value = this.scopeSensitivityMultiplier * 10;
            document.getElementById('scope-sens-value').textContent = scopeSensSlider.value;
            scopeSensSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.scopeSensitivityMultiplier = val / 10;  // 1-10 -> 0.1-1.0
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
        
        // 返回游戏按钮
        if (resumeBtn && !resumeBtn.hasListener) {
            resumeBtn.hasListener = true;
            resumeBtn.addEventListener('click', () => {
                this.toggleSettingsMenu();
            });
        }
        
        // 全屏切换按钮
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
                // 全屏切换后关闭设置菜单并锁定鼠标
                this.settingsMenuOpen = false;
                document.getElementById('settings-menu').style.display = 'none';
                setTimeout(() => document.body.requestPointerLock(), 100);
            });
        }
        
        // 退出游戏按钮
        if (exitBtn && !exitBtn.hasListener) {
            exitBtn.hasListener = true;
            exitBtn.addEventListener('click', () => {
                this.backToMenu();
            });
        }
    }
    
    updateAmmoDisplay() {
        const config = WeaponConfigs[this.currentWeapon];
        const weaponName = config ? config.name : 'AK-47';
        if (this.currentWeapon === 'knife') {
            document.getElementById('weapon').textContent = weaponName;
        } else if (this.currentWeapon === 'grenade') {
            document.getElementById('weapon').textContent = `${weaponName} x${this.grenadeCount}`;
        } else {
            document.getElementById('weapon').textContent = `${weaponName} ${this.ammo}/${this.maxAmmo}`;
        }
    }
    
    updateTeamScores() {
        document.getElementById('ct-score').textContent = `CT: ${this.ctKills}`;
        document.getElementById('t-score').textContent = `T: ${this.tKills}`;
    }
    
    updateHUD(player) {
        document.getElementById('health').textContent = `HP: ${player.health}`;
        if (!this.isReloading) this.updateAmmoDisplay();
        document.getElementById('score').textContent = `K: ${player.kills} / D: ${player.deaths}`;
        if (!player.is_alive && !this.gameOver) {
            document.getElementById('death-screen').style.display = 'block';
            // 添加死亡黑白效果
            document.getElementById('game').classList.add('dead-effect');
            document.getElementById('death-overlay').classList.add('active');
            this.startRespawnTimer();
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
    
    // 显示击杀反馈图标
    showKillFeedback(isHeadshot, isKnife, killStreak) {
        const killIcon = document.getElementById('kill-icon');
        const streakIcon = document.getElementById('kill-streak-icon');
        
        // 清除之前的类
        killIcon.className = '';
        streakIcon.className = '';
        
        // 显示击杀类型图标
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
        
        // 显示连杀图标
        if (killStreak >= 2) {
            const streakNames = {
                2: 'DOUBLE KILL',
                3: 'TRIPLE KILL',
                4: 'ULTRA KILL',
                5: 'RAMPAGE',
                6: 'GODLIKE',
                7: 'UNSTOPPABLE',
                8: 'LEGENDARY'
            };
            const streakName = streakNames[Math.min(killStreak, 8)];
            streakIcon.textContent = streakName;
            streakIcon.className = 'active';
            
            // 根据连杀数添加不同颜色
            if (killStreak >= 6) {
                streakIcon.classList.add('streak-6');
            } else if (killStreak >= 5) {
                streakIcon.classList.add('streak-5');
            } else if (killStreak >= 4) {
                streakIcon.classList.add('streak-4');
            } else if (killStreak >= 3) {
                streakIcon.classList.add('streak-3');
            }
        }
        
        // 2秒后隐藏
        setTimeout(() => {
            killIcon.className = '';
            killIcon.textContent = '';
        }, 2000);
        
        setTimeout(() => {
            streakIcon.className = '';
            streakIcon.textContent = '';
        }, 2500);
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
        if (winner === 'draw') {
            winnerText = '平局!';
        } else if (winner === 'ct') {
            winnerText = '反恐精英 (CT) 获胜!';
        } else {
            winnerText = '恐怖分子 (T) 获胜!';
        }
        
        const reasonText = reason === 'time' ? ' (时间结束)' : '';
        document.getElementById('winner-text').textContent = winnerText + reasonText;
        document.getElementById('final-score').textContent = `最终比分 - CT: ${ctKills} | T: ${tKills}`;
        document.exitPointerLock();
    }

    // ==================== 武器系统 ====================
    updateGunModel() {
        if (!this.camera) return;  // 相机未初始化时跳过
        if (this.gunModel) this.camera.remove(this.gunModel);
        this.weaponBuilder = new WeaponModelBuilder(this.selectedTeam);
        this.gunModel = this.weaponBuilder.createModel(this.currentWeapon);
        this.gunBasePosition = this.gunModel.position.clone();
        this.gunBaseRotation = this.gunModel.rotation.clone();
        this.camera.add(this.gunModel);
        // 重置动画状态
        this.gunRecoil = 0;
    }
    
    createGunModel() {
        this.weaponBuilder = new WeaponModelBuilder(this.selectedTeam);
        this.gunModel = this.weaponBuilder.createModel('ak47');
        this.gunBasePosition = this.gunModel.position.clone();
        this.gunBaseRotation = this.gunModel.rotation.clone();
        this.camera.add(this.gunModel);
        this.scene.add(this.camera);
        // 确保初始状态正确
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
        
        // 判断武器类型
        const isPrimary = (w) => w === 'ak47' || w === 'm4a1' || w === 'awp';
        const isSecondary = (w) => w === 'pistol';
        
        // 如果当前是主武器，切换到副武器或刀
        // 如果当前是副武器/刀/手雷，切换到主武器
        let newWeapon;
        if (isPrimary(this.currentWeapon)) {
            // 当前是主武器，切换到副武器
            newWeapon = this.secondaryWeapon;
        } else if (isSecondary(this.currentWeapon)) {
            // 当前是副武器，切换到主武器
            newWeapon = this.primaryWeapon;
        } else if (this.currentWeapon === 'knife') {
            // 当前是刀，切换到上一把武器（主武器或副武器）
            newWeapon = isPrimary(this.previousWeapon) ? this.previousWeapon : this.primaryWeapon;
        } else if (this.currentWeapon === 'grenade') {
            // 当前是手雷，切换到上一把武器
            newWeapon = isPrimary(this.previousWeapon) ? this.previousWeapon : this.primaryWeapon;
        } else {
            newWeapon = this.primaryWeapon;
        }
        
        // 如果新武器和当前武器相同，不切换
        if (newWeapon === this.currentWeapon) return;
        
        this.startWeaponSwitch(newWeapon);
    }
    
    startWeaponSwitch(newWeapon) {
        if (this.isScoped) this.toggleScope();
        this.previousWeapon = this.currentWeapon;
        this.isSwitchingWeapon = true;
        this.switchAnimProgress = 0;
        this.audio.playWeaponSwitchSound();
        
        const self = this;
        setTimeout(function() {
            self.currentWeapon = newWeapon;
            const config = WeaponConfigs[newWeapon];
            self.maxAmmo = config.ammo;
            self.ammo = config.ammo;
            self.fireRate = config.fireRate;
            self.weaponRecoil = config.recoil;
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
        if (this.currentWeapon === 'knife' || this.currentWeapon === 'grenade') return;
        this.isReloading = true;
        this.reloadAnimProgress = 0;
        // 根据武器播放对应的换弹音效
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
        this.isScoped = !this.isScoped;
        document.getElementById('scope').style.display = this.isScoped ? 'block' : 'none';
        document.getElementById('crosshair').style.display = this.isScoped ? 'none' : 'block';
        if (this.camera) {
            this.camera.fov = this.isScoped ? this.scopedFOV : this.normalFOV;
            this.camera.updateProjectionMatrix();
        }
        if (this.gunModel) this.gunModel.visible = !this.isScoped;
    }
    
    closeScope() {
        if (!this.isScoped) return;
        this.isScoped = false;
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
        
        // 如果要下蹲，检查当前位置是否允许下蹲（防止穿墙）
        if (crouch && this.camera) {
            if (!this.canCrouchAt(this.camera.position.x, this.camera.position.z)) {
                return; // 不允许在此位置下蹲
            }
        }
        
        this.isCrouching = crouch;
        
        // 立即设置目标高度，让相机平滑过渡
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
        
        if (this.ammo <= 0) {
            this.reload();
            return;
        }
        
        this.lastShot = now;
        this.ammo--;
        this.shotsFired++;
        
        this.audio.playGunSound(this.currentWeapon);
        
        // 获取武器配置
        const config = WeaponConfigs[this.currentWeapon];
        
        // 后坐力随连发数量递增
        // 前2发稳定，第3发开始增加，第10发达到上限
        let currentRecoil = 0;
        if (this.shotsFired > 2) {
            const shotFactor = Math.min(this.shotsFired - 2, 8); // 最多8级（第3-10发）
            const progressiveRecoil = config.recoil + (shotFactor * config.recoilIncrease);
            currentRecoil = Math.min(progressiveRecoil, config.maxRecoil);
        }
        
        this.recoilAccumulator += currentRecoil;
        this.crosshairOffset = Math.min(this.recoilAccumulator * 1.5, 0.6);
        
        // 枪械视觉后坐力也随武器不同
        this.gunRecoil = 0.8 + (config.recoil * 3);
        this.screenShake = 0.03 + (config.recoil * 0.15);
        
        // 添加视角后坐力 - 枪口上扬效果
        const pitchRecoil = config.recoil * 0.008 * (1 + Math.min(this.shotsFired * 0.1, 0.5));
        const yawRecoil = (Math.random() - 0.5) * config.recoil * 0.003;
        this.pitch += pitchRecoil;
        this.yaw += yawRecoil;
        // 限制pitch范围
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
        this.camera.rotation.x = this.pitch;
        this.camera.rotation.y = this.yaw;
        
        // 保存开镜状态用于射击判定
        const wasScoped = this.isScoped;
        
        // AWP开枪后自动关闭狙击镜
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
        const grenadeGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const grenadeMat = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
        const grenade = new THREE.Mesh(grenadeGeom, grenadeMat);
        grenade.position.copy(start);
        this.scene.add(grenade);
        
        let velocity = direction.clone().multiplyScalar(1.5);
        velocity.y += 0.3;
        let bounces = 0;
        
        const animateGrenade = () => {
            velocity.y -= 0.02;
            grenade.position.add(velocity);
            if (grenade.position.y < 0.5) {
                grenade.position.y = 0.5;
                velocity.y *= -0.5;
                velocity.x *= 0.7;
                velocity.z *= 0.7;
                bounces++;
            }
            if (bounces < 3 && velocity.length() > 0.05) {
                requestAnimationFrame(animateGrenade);
            } else {
                setTimeout(() => {
                    this.createExplosion(grenade.position);
                    this.scene.remove(grenade);
                }, 1500);
            }
        };
        animateGrenade();
        
        this.updateAmmoDisplay();
        if (this.grenadeCount <= 0) setTimeout(() => this.switchToSlot(1), 500);
    }
    
    createExplosion(position) {
        // 播放爆炸音效
        this.audio.playExplosionSound();
        
        // 主爆炸火球
        const explosionGeom = new THREE.SphereGeometry(2, 16, 16);
        const explosionMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
        const explosion = new THREE.Mesh(explosionGeom, explosionMat);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // 内部白色闪光
        const flashGeom = new THREE.SphereGeometry(1.5, 12, 12);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 1 });
        const flash = new THREE.Mesh(flashGeom, flashMat);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // 外部烟雾环
        const smokeGeom = new THREE.TorusGeometry(3, 1, 8, 16);
        const smokeMat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.6 });
        const smoke = new THREE.Mesh(smokeGeom, smokeMat);
        smoke.position.copy(position);
        smoke.rotation.x = Math.PI / 2;
        this.scene.add(smoke);
        
        // 爆炸碎片粒子
        const particles = [];
        for (let i = 0; i < 20; i++) {
            const particleGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const particleColor = Math.random() > 0.5 ? 0xff4400 : 0xffaa00;
            const particleMat = new THREE.MeshBasicMaterial({ color: particleColor, transparent: true, opacity: 1 });
            const particle = new THREE.Mesh(particleGeom, particleMat);
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5 + 0.5,
                (Math.random() - 0.5) * 2
            );
            this.scene.add(particle);
            particles.push({ mesh: particle, mat: particleMat, vel: particle.velocity });
        }
        
        // 屏幕震动效果
        const originalCamPos = this.camera.position.clone();
        const distToPlayer = this.camera.position.distanceTo(position);
        const shakeIntensity = Math.max(0, 1 - distToPlayer / 30) * 0.5;
        
        let frame = 0;
        let scale = 1;
        let smokeScale = 1;
        
        const animateExplosion = () => {
            frame++;
            
            // 主火球扩展
            scale += 0.4;
            explosion.scale.set(scale, scale, scale);
            explosionMat.opacity -= 0.08;
            
            // 闪光快速消失
            flashMat.opacity -= 0.15;
            flash.scale.set(scale * 0.8, scale * 0.8, scale * 0.8);
            
            // 烟雾环扩展
            smokeScale += 0.3;
            smoke.scale.set(smokeScale, smokeScale, smokeScale);
            smoke.position.y += 0.2;
            smokeMat.opacity -= 0.04;
            
            // 粒子动画
            particles.forEach(p => {
                p.mesh.position.add(p.vel);
                p.vel.y -= 0.08; // 重力
                p.mat.opacity -= 0.05;
            });
            
            // 屏幕震动
            if (frame < 10 && shakeIntensity > 0) {
                this.camera.position.x = originalCamPos.x + (Math.random() - 0.5) * shakeIntensity;
                this.camera.position.y = originalCamPos.y + (Math.random() - 0.5) * shakeIntensity;
            }
            
            if (explosionMat.opacity > 0) {
                requestAnimationFrame(animateExplosion);
            } else {
                // 清理所有效果
                this.scene.remove(explosion);
                this.scene.remove(flash);
                this.scene.remove(smoke);
                particles.forEach(p => this.scene.remove(p.mesh));
            }
        };
        animateExplosion();
        
        // 检测爆炸伤害
        for (const [playerId, mesh] of Object.entries(this.playerMeshes)) {
            if (playerId === this.playerId) continue;
            const dist = mesh.position.distanceTo(position);
            if (dist < 10 && this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ action: 'grenade_hit', target_id: playerId, distance: dist }));
            }
        }
    }
    
    raycastShoot(wasScoped = false) {
        const raycaster = new THREE.Raycaster();
        const config = WeaponConfigs[this.currentWeapon];
        
        // 前2发子弹完全精准，第3发开始有散布，第10发达到最大
        let spreadX = 0;
        let spreadY = 0;
        
        // AWP不开镜时有较大散布（使用传入的开镜状态）
        if (this.currentWeapon === 'awp' && !wasScoped) {
            const noScopeSpread = 0.15;
            spreadX = (Math.random() - 0.5) * noScopeSpread;
            spreadY = (Math.random() - 0.5) * noScopeSpread;
        } else if (this.shotsFired > 2) {
            // 第3发开始有散布，到第10发达到最大
            const spreadFactor = Math.min((this.shotsFired - 2) / 8, 1); // 0到1之间
            const baseSpread = (config.spread || 0.02) * spreadFactor;
            const recoilSpread = this.recoilAccumulator * 0.03 * spreadFactor;
            const totalSpread = baseSpread + recoilSpread;
            
            // 水平散布：左右随机
            spreadX = (Math.random() - 0.5) * totalSpread;
            // 垂直散布：只往上偏（枪口上扬），不往下
            spreadY = Math.random() * totalSpread * 0.8 + this.recoilAccumulator * 0.012;
        }
        
        const origin = this.camera.position.clone();
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // 应用散布到方向
        direction.x += spreadX;
        direction.y += spreadY;
        direction.normalize();
        
        raycaster.set(origin, direction);
        
        let endPoint = origin.clone().add(direction.clone().multiplyScalar(100));
        let hitWallDist = Infinity;
        let hitPlayerId = null;
        let hitPoint = null;
        let hitFloor = false;
        
        // 检测地面碰撞 - 只有当射线朝下时才检测
        if (direction.y < 0) {
            const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const floorIntersect = new THREE.Vector3();
            const intersected = raycaster.ray.intersectPlane(floorPlane, floorIntersect);
            
            // 确保交点在射线前方（不是后方）且在合理范围内
            if (intersected) {
                const toIntersect = floorIntersect.clone().sub(origin);
                const dotProduct = toIntersect.dot(direction);
                
                // dotProduct > 0 表示交点在射线前方
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
            // 获取墙面法线
            const normal = wallHits[0].face ? wallHits[0].face.normal.clone() : null;
            if (normal) {
                normal.transformDirection(wallHits[0].object.matrixWorld);
            }
            this.createBulletHole(wallHits[0].point, normal, false);
        } else if (hitFloor) {
            // 创建地面弹孔
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
                // 计算相对于玩家模型底部的高度（玩家模型底部在地面 y=0）
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
        // 创建圆形弹孔纹理
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // 透明背景
        ctx.clearRect(0, 0, 32, 32);
        
        // 外圈 - 烧焦痕迹
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
        
        // 中心弹孔 - 更深的黑色
        const innerGradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 5);
        innerGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        innerGradient.addColorStop(0.5, 'rgba(10, 10, 10, 0.95)');
        innerGradient.addColorStop(1, 'rgba(30, 25, 20, 0.8)');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(16, 16, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加一些随机的裂纹效果
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
        
        // 使用圆形几何体
        const hole = new THREE.Mesh(
            new THREE.CircleGeometry(0.4, 16),
            new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true, 
                opacity: 0.9, 
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        
        hole.position.copy(position);
        
        if (isFloor) {
            // 地面弹孔 - 水平放置
            hole.rotation.x = -Math.PI / 2;
            hole.position.y = 0.02; // 稍微抬高避免z-fighting
        } else if (normal) {
            // 根据法线方向旋转弹孔
            hole.lookAt(position.clone().add(normal));
        } else {
            // 默认朝向相机
            hole.lookAt(this.camera.position);
        }
        
        this.scene.add(hole);
        
        // 5秒后淡出消失
        setTimeout(() => {
            const fadeOut = () => {
                hole.material.opacity -= 0.05;
                if (hole.material.opacity > 0) {
                    requestAnimationFrame(fadeOut);
                } else {
                    this.scene.remove(hole);
                }
            };
            fadeOut();
        }, 5000);
    }
    
    // 创建地面弹孔
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
            traveled += 8;
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
    joinGame() {
        const name = document.getElementById('playerName').value || 'Player';
        const roomId = document.getElementById('roomId').value || 'default';
        this.startGame(name, roomId, false);
    }
    
    createGame() {
        const name = document.getElementById('playerName').value || 'Player';
        const roomId = document.getElementById('roomId').value || 'room_' + Math.random().toString(36).substr(2, 6);
        document.getElementById('roomId').value = roomId;
        this.targetKills = parseInt(document.getElementById('targetKills').value) || 20;
        this.selectedMap = document.getElementById('mapSelect').value || 'dust2';
        this.selectedGameMode = document.getElementById('gameMode').value || 'deathmatch';
        this.startGame(name, roomId, true);
    }
    
    startGame(name, roomId, isCreating) {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('game').style.display = 'block';
        document.getElementById('target-kills').textContent = this.targetKills;
        document.getElementById('map-name').textContent = MapNames[this.selectedMap] || '沙漠2';
        
        // 显示游戏模式
        const modeText = this.selectedGameMode === 'deathmatch' ? '团队竞技' : '爆破模式';
        document.getElementById('game-mode-text').textContent = modeText + ' | ';
        
        // 团队竞技模式显示倒计时
        if (this.selectedGameMode === 'deathmatch') {
            document.getElementById('game-timer').style.display = 'inline';
            document.getElementById('game-timer').textContent = '10:00 | ';
        }
        
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
        
        this.audio.init();
        this.initThree();
        
        // 预编译着色器 - 渲染一帧来编译所有材质
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
        this.scene.fog = new THREE.Fog(0x6bb3d9, 100, 500);
        this.camera = new THREE.PerspectiveCamera(this.normalFOV, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, this.standingHeight, 0);
        
        // 创建渲染器 - 启用GPU加速
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // 输出GPU信息
        const gl = this.renderer.getContext();
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            console.log('🎮 GPU加速已启用');
            console.log('GPU:', gpu);
            console.log('厂商:', vendor);
        }
        
        document.getElementById('game').insertBefore(this.renderer.domElement, document.getElementById('game').firstChild);
        
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        this.scene.add(sun);
        
        // 使用地图模块创建地图
        const mapBuilder = new MapBuilder(this.scene);
        this.walls = mapBuilder.createMap(this.selectedMap);
        
        this.createGunModel();
        
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
                this.updateState(data.state);
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
                if (data.map) {
                    this.selectedMap = data.map;
                    document.getElementById('map-name').textContent = MapNames[data.map] || '沙漠2';
                }
                document.getElementById('target-kills').textContent = this.targetKills;
                this.updateGunModel();
                this.updateAmmoDisplay();
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
                            
                            // 连杀追踪
                            const now = Date.now();
                            if (now - this.lastKillTime < this.killStreakTimeout) {
                                this.killStreak++;
                            } else {
                                this.killStreak = 1;
                            }
                            this.lastKillTime = now;
                            
                            // 显示击杀反馈图标
                            this.showKillFeedback(hit.headshot, hit.knife_kill, this.killStreak);
                            
                            // 播放连杀/爆头语音
                            if (hit.headshot) {
                                this.audio.playHeadshotVoice();
                            } else if (hit.knife_kill) {
                                this.audio.playKnifeKillVoice();
                            } else if (this.killStreak >= 2) {
                                this.audio.playMultiKillVoice(this.killStreak);
                            }
                        }
                        if (hit.victim === this.playerId) {
                            this.closeScope();
                            this.killStreak = 0;  // 死亡重置连杀
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
                    document.getElementById('death-screen').style.display = 'none';
                    // 移除死亡黑白效果
                    document.getElementById('game').classList.remove('dead-effect');
                    document.getElementById('death-overlay').classList.remove('active');
                    this.camera.position.set(data.player.x, this.standingHeight, data.player.y);
                    this.ammo = this.maxAmmo;
                    this.grenadeCount = 1;
                    this.updateAmmoDisplay();
                }
                break;
            case 'game_over':
                this.showGameOver(data.winner, data.ct_kills, data.t_kills, data.reason);
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
            case 'bullet':
                // 处理其他玩家的射击 - 播放远程枪声
                if (data.bullet && data.bullet.owner_id !== this.playerId) {
                    const shooter = this.players[data.bullet.owner_id];
                    if (shooter) {
                        // 计算距离，根据距离调整音量
                        const dx = shooter.x - this.camera.position.x;
                        const dz = shooter.y - this.camera.position.z;
                        const distance = Math.sqrt(dx * dx + dz * dz);
                        const maxDistance = 150;
                        const volume = Math.max(0.1, 1 - distance / maxDistance) * 0.6;
                        
                        // 播放对方武器的开枪声音
                        this.audio.playRemoteGunSound(data.bullet.weapon || shooter.weapon || 'ak47', volume);
                    }
                }
                break;
        }
    }
    
    updateState(state) {
        this.players = state.players;
        if (state.ct_kills !== undefined) this.ctKills = state.ct_kills;
        if (state.t_kills !== undefined) this.tKills = state.t_kills;
        this.updateTeamScores();
        
        // 更新倒计时显示
        if (state.remaining_time !== undefined && state.remaining_time >= 0) {
            this.remainingTime = state.remaining_time;
            const minutes = Math.floor(this.remainingTime / 60);
            const seconds = this.remainingTime % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')} | `;
            document.getElementById('game-timer').textContent = timeStr;
            document.getElementById('game-timer').style.display = 'inline';
        }
        
        // 更新游戏模式显示
        if (state.game_mode) {
            this.selectedGameMode = state.game_mode;
            const modeText = state.game_mode === 'deathmatch' ? '团队竞技' : '爆破模式';
            document.getElementById('game-mode-text').textContent = modeText + ' | ';
        }
        
        Object.entries(this.players).forEach(([id, player]) => {
            if (id === this.playerId) {
                this.updateHUD(player);
                return;
            }
            if (!player.is_alive) {
                if (this.playerMeshes[id]) {
                    this.scene.remove(this.playerMeshes[id]);
                    delete this.playerMeshes[id];
                }
                return;
            }
            const needsUpdate = !this.playerMeshes[id] || 
                this.playerMeshes[id].userData.crouching !== player.crouching ||
                this.playerMeshes[id].userData.weapon !== player.weapon;
            if (needsUpdate) {
                // 保存旧模型的当前位置（用于平滑过渡）
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
                
                // 如果有旧位置，使用旧位置作为起点（避免闪现）
                if (oldPosition) {
                    mesh.position.copy(oldPosition);
                    mesh.rotation.y = oldRotation;
                } else {
                    // 新玩家直接设置到目标位置
                    mesh.position.set(player.x, player.height_offset || 0, player.y);
                    mesh.rotation.y = -player.angle + Math.PI / 2;
                }
                
                this.scene.add(mesh);
                this.playerMeshes[id] = mesh;
            }
            
            // 更新目标位置（插值在updateOtherPlayers中进行）
            const mesh = this.playerMeshes[id];
            if (mesh) {
                mesh.userData.targetX = player.x;
                mesh.userData.targetZ = player.y;
                mesh.userData.targetY = player.height_offset || 0;
                mesh.userData.targetAngle = -player.angle + Math.PI / 2;
                mesh.userData.isShooting = player.is_shooting;
            }
        });
    }
    
    // 更新其他玩家位置（在游戏循环中调用）
    updateOtherPlayers() {
        const lerpFactor = 0.3;
        for (const [id, mesh] of Object.entries(this.playerMeshes)) {
            if (!mesh.userData.targetX) continue;
            
            // 处理射击状态 - 显示枪口火焰
            if (mesh.userData.isShooting) {
                PlayerModel.showMuzzleFlash(mesh);
            }
            
            // 位置插值
            mesh.position.x += (mesh.userData.targetX - mesh.position.x) * lerpFactor;
            mesh.position.z += (mesh.userData.targetZ - mesh.position.z) * lerpFactor;
            mesh.position.y += (mesh.userData.targetY - mesh.position.y) * lerpFactor;
            
            // 角度插值
            let angleDiff = mesh.userData.targetAngle - mesh.rotation.y;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            mesh.rotation.y += angleDiff * lerpFactor;
        }
    }
    
    respawn() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'respawn' }));
        }
    }

    // ==================== 游戏循环 ====================
    checkCollision(newX, newZ, checkHeight = null) {
        const playerRadius = 2.5;  // 稍微增大碰撞半径
        const mapBoundary = 118;
        // 使用传入的高度或当前相机高度
        const playerHeight = checkHeight !== null ? checkHeight : this.camera.position.y;
        const maxStepHeight = 8;
        
        let clampedX = Math.max(-mapBoundary, Math.min(mapBoundary, newX));
        let clampedZ = Math.max(-mapBoundary, Math.min(mapBoundary, newZ));
        
        let blocked = false;
        let pushX = 0, pushZ = 0;
        let standingOnHeight = 0;
        
        if (clampedX !== newX || clampedZ !== newZ) {
            blocked = true;
            pushX = clampedX - newX;
            pushZ = clampedZ - newZ;
        }
        
        for (const wall of this.walls) {
            const wx = wall.x;
            const wz = wall.z;
            const ww = wall.w;
            const wd = wall.d;
            const wallHeight = wall.h || 20;
            
            const closestX = Math.max(wx, Math.min(clampedX, wx + ww));
            const closestZ = Math.max(wz, Math.min(clampedZ, wz + wd));
            const distX = clampedX - closestX;
            const distZ = clampedZ - closestZ;
            const dist = Math.sqrt(distX * distX + distZ * distZ);
            
            // 检查是否站在建筑物上方
            const isAboveWall = clampedX >= wx && clampedX <= wx + ww && 
                               clampedZ >= wz && clampedZ <= wz + wd;
            
            // 只有当玩家高度已经超过建筑物时才能站在上面
            if (isAboveWall && wallHeight <= maxStepHeight && playerHeight >= wallHeight + this.standingHeight - 2) {
                standingOnHeight = Math.max(standingOnHeight, wallHeight);
            }
            
            // 墙壁碰撞检测 - 检查多个高度点
            // 检查站立高度和下蹲高度，防止通过下蹲穿墙
            const heightsToCheck = [this.standingHeight, this.crouchingHeight];
            let shouldBlock = false;
            
            for (const checkH of heightsToCheck) {
                if (dist < playerRadius && checkH < wallHeight) {
                    shouldBlock = true;
                    break;
                }
            }
            
            if (shouldBlock) {
                blocked = true;
                if (dist > 0.01) {
                    const overlap = playerRadius - dist;
                    pushX += (distX / dist) * overlap;
                    pushZ += (distZ / dist) * overlap;
                }
            }
        }
        return { blocked, pushX, pushZ, clampedX, clampedZ, standingOnHeight };
    }
    
    // 检查下蹲是否会导致穿墙
    canCrouchAt(x, z) {
        const playerRadius = 2.5;
        
        for (const wall of this.walls) {
            const wx = wall.x;
            const wz = wall.z;
            const ww = wall.w;
            const wd = wall.d;
            const wallHeight = wall.h || 20;
            
            const closestX = Math.max(wx, Math.min(x, wx + ww));
            const closestZ = Math.max(wz, Math.min(z, wz + wd));
            const distX = x - closestX;
            const distZ = z - closestZ;
            const dist = Math.sqrt(distX * distX + distZ * distZ);
            
            // 如果下蹲高度会穿过墙壁，不允许下蹲
            if (dist < playerRadius && this.crouchingHeight < wallHeight && this.standingHeight >= wallHeight) {
                return false;
            }
        }
        return true;
    }
    
    update() {
        // 自动射击 - 即使玩家数据未同步也要处理
        if (this.isLocked && this.isFiring) {
            const config = WeaponConfigs[this.currentWeapon];
            if (config && config.auto) this.shoot();
        }
        
        if (!this.isFiring) {
            // 松开鼠标后，如果超过300ms没有再次射击，才重置连发计数
            const timeSinceRelease = Date.now() - this.lastShotReleaseTime;
            if (timeSinceRelease > 150) {
                this.shotsFired = Math.max(0, this.shotsFired - 1);
                if (this.shotsFired === 0) {
                    this.recoilAccumulator *= 0.85;
                }
            }
            this.crosshairOffset *= 0.9;
        }
        
        if (!this.playerId || this.gameOver) {
            this.updateGunAnimation();
            return;
        }
        
        const player = this.players[this.playerId];
        if (!player || !player.is_alive) {
            this.updateGunAnimation();
            return;
        }
        
        // 移动
        const moveSpeed = this.isCrouching ? 0.12 : 0.20;
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
                newX = collision.clampedX + collision.pushX;
                newZ = collision.clampedZ + collision.pushZ;
                newX = Math.max(-118, Math.min(118, newX));
                newZ = Math.max(-118, Math.min(118, newZ));
            }
            
            // 更新站立高度（用于站在建筑物上）
            this.currentStandingHeight = collision.standingOnHeight || 0;
            
            this.camera.position.x = newX;
            this.camera.position.z = newZ;
            this.audio.playFootstep();
        }
        
        // 跳跃 - 下蹲时也可以跳跃（下蹲跳），保持下蹲状态
        if (this.keys['Space'] && this.canJump) {
            // 下蹲跳：跳跃高度稍低但保持下蹲姿态
            this.velocity.y = this.isCrouching ? 0.65 : 0.75;
            this.canJump = false;
        }
        
        // 计算地面高度（包括建筑物顶部）
        const baseGroundHeight = this.isCrouching ? this.crouchingHeight : this.standingHeight;
        const buildingHeight = this.currentStandingHeight || 0;
        const groundHeight = baseGroundHeight + buildingHeight;
        
        // 更新目标相机高度
        this.targetCameraHeight = groundHeight;
        
        // 只有在跳跃时才应用重力
        if (!this.canJump) {
            this.velocity.y -= 0.025;
            this.camera.position.y += this.velocity.y;
            
            if (this.camera.position.y < groundHeight) {
                this.camera.position.y = groundHeight;
                this.velocity.y = 0;
                this.canJump = true;
            }
        } else {
            // 在地面上时，平滑过渡到目标高度（用于蹲下/站起）
            const heightDiff = this.targetCameraHeight - this.camera.position.y;
            if (Math.abs(heightDiff) > 0.1) {
                // 使用插值平滑过渡
                this.camera.position.y += heightDiff * 0.25;
            } else {
                this.camera.position.y = this.targetCameraHeight;
            }
        }
        
        this.currentHeight = this.camera.position.y;
        
        // 发送位置信息到服务器 - 节流处理
        const now = performance.now();
        if (this.ws && this.ws.readyState === WebSocket.OPEN && 
            now - this.lastNetworkSend >= this.networkSendInterval) {
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
        
        this.updateGunAnimation();
        this.updateOtherPlayers();
    }
    
    updateGunAnimation() {
        // 枪械动画 - 只有在枪模型和基础位置都存在时才执行
        if (!this.gunModel || !this.gunBasePosition || !this.gunBaseRotation) {
            return;
        }
        
        // 先重置到基础位置
        this.gunModel.position.copy(this.gunBasePosition);
        this.gunModel.rotation.copy(this.gunBaseRotation);
        
        // 后坐力动画
        if (this.gunRecoil > 0.005) {
            this.gunRecoil *= 0.88;
            // 增强后坐力效果 - 更明显的视觉反馈
            const recoilZ = this.gunRecoil * 0.15;   // 后退
            const recoilY = this.gunRecoil * 0.06;   // 上抬
            const recoilRotX = this.gunRecoil * 0.25; // 枪口上扬
            
            this.gunModel.position.z += recoilZ;
            this.gunModel.position.y += recoilY;
            this.gunModel.rotation.x -= recoilRotX;
        } else {
            this.gunRecoil = 0;
        }
        
        // 换弹动画
        if (this.isReloading) {
            this.reloadAnimProgress += 0.02;
            const reloadPhase = this.reloadAnimProgress % 1;
            if (reloadPhase < 0.3) {
                this.gunModel.rotation.z += reloadPhase * 1.0;
            } else if (reloadPhase < 0.7) {
                this.gunModel.position.y -= (reloadPhase - 0.3) * 0.1;
            } else {
                this.gunModel.rotation.z += (1 - reloadPhase) * 1.0;
            }
        }
        
        // 切枪动画 - 只在切枪过程中执行
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
        
        // FPS 计算
        this.fpsFrameCount++;
        if (now - this.fpsLastTime >= 1000) {
            this.currentFPS = this.fpsFrameCount;
            this.fpsFrameCount = 0;
            this.fpsLastTime = now;
            // 更新 FPS 显示
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${this.currentFPS}`;
            }
        }
        
        // 处理鼠标移动 - 每帧都处理，保证流畅
        this.processMouseMovement();
        
        // 游戏逻辑更新 - 受帧率限制
        const elapsed = now - this.lastFrameTime;
        if (elapsed >= this.frameInterval) {
            this.lastFrameTime = now - (elapsed % this.frameInterval);
            this.update();
        }
        
        // 屏幕抖动效果 - 使用临时偏移，不修改实际相机位置
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
        
        // 渲染后恢复相机位置
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
