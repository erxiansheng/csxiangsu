// 武器系统模块
const WeaponConfigs = {
    'ak47': { 
        ammo: 30, 
        fireRate: 100, 
        recoil: 0.12,           // 基础后坐力（比M4大）
        recoilIncrease: 0.015,  // 每发增加的后坐力
        maxRecoil: 0.35,        // 最大后坐力
        spread: 0.025,          // 基础散布
        auto: true, 
        name: 'AK-47', 
        slot: 'primary' 
    },
    'm4a1': { 
        ammo: 30, 
        fireRate: 90, 
        recoil: 0.08,           // 基础后坐力（比AK小）
        recoilIncrease: 0.01,   // 每发增加的后坐力
        maxRecoil: 0.25,        // 最大后坐力
        spread: 0.018,          // 基础散布（更精准）
        auto: true, 
        name: 'M4A1', 
        slot: 'primary' 
    },
    'awp': { 
        ammo: 10, 
        fireRate: 1500, 
        recoil: 0.3,            // 单发大后坐力
        recoilIncrease: 0,
        maxRecoil: 0.3,
        spread: 0.005,          // 非常精准
        auto: false, 
        name: 'AWP', 
        slot: 'primary' 
    },
    'pistol': { 
        ammo: 12, 
        fireRate: 200, 
        recoil: 0.05,
        recoilIncrease: 0.008,
        maxRecoil: 0.15,
        spread: 0.015,
        auto: false, 
        name: 'USP', 
        slot: 'secondary' 
    },
    'knife': { ammo: -1, fireRate: 500, recoil: 0, recoilIncrease: 0, maxRecoil: 0, spread: 0, auto: false, name: '军刀', slot: 'melee' },
    'grenade': { ammo: 1, fireRate: 1000, recoil: 0, recoilIncrease: 0, maxRecoil: 0, spread: 0, auto: false, name: '手雷', slot: 'grenade' }
};

// 武器模型创建器
class WeaponModelBuilder {
    constructor(team) {
        this.team = team;
        this.metalMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        this.woodMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        this.skinMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
        this.sleeveMat = new THREE.MeshLambertMaterial({ color: team === 'ct' ? 0x1e3a5f : 0x5c4033 });
    }
    
    // 创建文字纹理
    createTextTexture(text, bgColor, textColor = '#FFD700') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 背景
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 文字 - 放大3倍
        ctx.fillStyle = textColor;
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createModel(weaponType) {
        const gunModel = new THREE.Group();
        
        switch(weaponType) {
            case 'ak47': this.createAK47(gunModel); break;
            case 'm4a1': this.createM4A1(gunModel); break;
            case 'awp': this.createAWP(gunModel); break;
            case 'pistol': this.createPistol(gunModel); break;
            case 'knife': this.createKnife(gunModel); break;
            case 'grenade': this.createGrenade(gunModel); break;
            default: this.createAK47(gunModel);
        }
        
        return gunModel;
    }
    
    addArmsWithForegrip(gunModel, foregrip_z) {
        // 右手 - 握把手
        const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.2), this.sleeveMat);
        rightSleeve.position.set(0.14, -0.12, 0.1);
        gunModel.add(rightSleeve);
        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.1), this.skinMat);
        rightHand.position.set(0.1, -0.08, -0.02);
        gunModel.add(rightHand);
        
        // 左手 - 托枪手 (护木位置)
        const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.15), this.sleeveMat);
        leftSleeve.position.set(-0.1, -0.06, foregrip_z + 0.15);
        gunModel.add(leftSleeve);
        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.12), this.skinMat);
        leftHand.position.set(-0.06, -0.04, foregrip_z);
        gunModel.add(leftHand);
    }
    
    createAK47(gunModel) {
        // 枪身 - 木质护木
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.5), this.woodMat);
        body.position.set(0, 0, -0.25);
        gunModel.add(body);
        
        // 机匣
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.25), this.metalMat);
        receiver.position.set(0, 0.02, -0.1);
        gunModel.add(receiver);
        
        // AK-47 涂鸦标签 - 右侧（外侧）
        const labelTexture = this.createTextTexture('AK-47-内测外观', '#5c4033', '#FFD700');
        const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
        const labelRight = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.12), labelMat);
        labelRight.position.set(0.041, 0, -0.25);
        labelRight.rotation.y = Math.PI / 2;
        gunModel.add(labelRight);
        
        // AK-47 涂鸦标签 - 左侧（内侧，玩家视角可见）
        const labelTexture2 = this.createTextTexture('AK-47-内测外观', '#5c4033', '#FFD700');
        const labelMat2 = new THREE.MeshBasicMaterial({ map: labelTexture2, transparent: true });
        const labelLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.12), labelMat2);
        labelLeft.position.set(-0.041, 0, -0.25);
        labelLeft.rotation.y = -Math.PI / 2;
        gunModel.add(labelLeft);
        
        // 枪管
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.4), this.metalMat);
        barrel.position.set(0, 0.04, -0.6);
        gunModel.add(barrel);
        
        // 准星
        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), this.metalMat);
        frontSight.position.set(0, 0.1, -0.75);
        gunModel.add(frontSight);
        
        // 弹匣 - 弯曲的AK弹匣
        const magMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.08), magMat);
        mag.position.set(0, -0.14, -0.18);
        mag.rotation.x = 0.2;
        gunModel.add(mag);
        
        // 枪托
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.2), this.woodMat);
        stock.position.set(0, -0.02, 0.1);
        gunModel.add(stock);
        
        // 握把
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.04), this.woodMat);
        grip.position.set(0, -0.1, 0);
        grip.rotation.x = 0.3;
        gunModel.add(grip);
        
        this.addArmsWithForegrip(gunModel, -0.4);
        gunModel.position.set(0.25, -0.2, -0.4);
        gunModel.rotation.set(0, 0.08, 0);
    }

    createM4A1(gunModel) {
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        
        // 机匣
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.45), blackMat);
        body.position.set(0, 0, -0.2);
        gunModel.add(body);
        
        // M4A1 涂鸦标签 - 右侧（外侧）
        const labelTexture = this.createTextTexture('M4A1-内测外观', '#1a1a1a', '#00BFFF');
        const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
        const labelRight = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.105), labelMat);
        labelRight.position.set(0.036, 0, -0.2);
        labelRight.rotation.y = Math.PI / 2;
        gunModel.add(labelRight);
        
        // M4A1 涂鸦标签 - 左侧（内侧，玩家视角可见）
        const labelTexture2 = this.createTextTexture('M4A1-内测外观', '#1a1a1a', '#00BFFF');
        const labelMat2 = new THREE.MeshBasicMaterial({ map: labelTexture2, transparent: true });
        const labelLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.105), labelMat2);
        labelLeft.position.set(-0.036, 0, -0.2);
        labelLeft.rotation.y = -Math.PI / 2;
        gunModel.add(labelLeft);
        
        // 提把/瞄具座
        const carryHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.15), blackMat);
        carryHandle.position.set(0, 0.08, -0.15);
        gunModel.add(carryHandle);
        
        // 枪管
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.45), this.metalMat);
        barrel.position.set(0, 0.03, -0.65);
        gunModel.add(barrel);
        
        // 消音器
        const suppressor = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.15), new THREE.MeshLambertMaterial({ color: 0x333333 }));
        suppressor.position.set(0, 0.03, -0.95);
        gunModel.add(suppressor);
        
        // 弹匣
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.06), blackMat);
        mag.position.set(0, -0.12, -0.18);
        gunModel.add(mag);
        
        // 枪托
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.18), blackMat);
        stock.position.set(0, -0.01, 0.1);
        gunModel.add(stock);
        
        // 握把
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), blackMat);
        grip.position.set(0, -0.09, 0);
        grip.rotation.x = 0.25;
        gunModel.add(grip);
        
        this.addArmsWithForegrip(gunModel, -0.45);
        gunModel.position.set(0.25, -0.2, -0.4);
        gunModel.rotation.set(0, 0.08, 0);
    }
    
    createAWP(gunModel) {
        const greenMat = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
        
        // 枪身
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.6), greenMat);
        body.position.set(0, 0, -0.3);
        gunModel.add(body);
        
        // AWP 涂鸦标签 - 右侧（外侧）
        const labelTexture = this.createTextTexture('AWP-内测外观', '#2d4a2d', '#FF4500');
        const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
        const labelRight = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.105), labelMat);
        labelRight.position.set(0.046, 0, -0.3);
        labelRight.rotation.y = Math.PI / 2;
        gunModel.add(labelRight);
        
        // AWP 涂鸦标签 - 左侧（内侧，玩家视角可见）
        const labelTexture2 = this.createTextTexture('AWP-内测外观', '#2d4a2d', '#FF4500');
        const labelMat2 = new THREE.MeshBasicMaterial({ map: labelTexture2, transparent: true });
        const labelLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.105), labelMat2);
        labelLeft.position.set(-0.046, 0, -0.3);
        labelLeft.rotation.y = -Math.PI / 2;
        gunModel.add(labelLeft);
        
        // 枪管
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.55), this.metalMat);
        barrel.position.set(0, 0.04, -0.85);
        gunModel.add(barrel);
        
        // 瞄准镜
        const scopeBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.25), this.metalMat);
        scopeBody.position.set(0, 0.12, -0.25);
        gunModel.add(scopeBody);
        
        // 瞄准镜镜片
        const scopeLens = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0x4488ff }));
        scopeLens.position.set(0, 0.12, -0.38);
        gunModel.add(scopeLens);
        
        // 弹匣
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.08), greenMat);
        mag.position.set(0, -0.1, -0.2);
        gunModel.add(mag);
        
        // 枪托
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.2), greenMat);
        stock.position.set(0, -0.02, 0.1);
        gunModel.add(stock);
        
        // 脚架
        const bipod1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.15, 0.015), this.metalMat);
        bipod1.position.set(-0.04, -0.1, -0.5);
        bipod1.rotation.x = 0.3;
        gunModel.add(bipod1);
        const bipod2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.15, 0.015), this.metalMat);
        bipod2.position.set(0.04, -0.1, -0.5);
        bipod2.rotation.x = 0.3;
        gunModel.add(bipod2);
        
        this.addArmsWithForegrip(gunModel, -0.5);
        gunModel.position.set(0.25, -0.2, -0.4);
        gunModel.rotation.set(0, 0.08, 0);
    }
    
    createPistol(gunModel) {
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        
        // 套筒
        const slide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.18), blackMat);
        slide.position.set(0, 0.02, -0.12);
        gunModel.add(slide);
        
        // 枪管
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.14), this.metalMat);
        barrel.position.set(0, 0.02, -0.25);
        gunModel.add(barrel);
        
        // 握把
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.06), blackMat);
        grip.position.set(0, -0.06, -0.02);
        grip.rotation.x = 0.15;
        gunModel.add(grip);
        
        // 扳机护圈
        const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.04), blackMat);
        triggerGuard.position.set(0, -0.03, -0.08);
        gunModel.add(triggerGuard);
        
        // 单手握枪
        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.1), this.skinMat);
        rightHand.position.set(0.02, -0.06, 0.02);
        gunModel.add(rightHand);
        const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.18), this.sleeveMat);
        rightSleeve.position.set(0.06, -0.08, 0.15);
        gunModel.add(rightSleeve);
        
        gunModel.position.set(0.25, -0.2, -0.4);
        gunModel.rotation.set(0, 0.08, 0);
    }
    
    createKnife(gunModel) {
        const bladeMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        
        // 刀刃
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.22), bladeMat);
        blade.position.set(0, 0, -0.18);
        gunModel.add(blade);
        
        // 刀尖
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.05), bladeMat);
        tip.position.set(0, -0.01, -0.3);
        tip.rotation.x = 0.3;
        gunModel.add(tip);
        
        // 刀柄
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, 0.12), new THREE.MeshLambertMaterial({ color: 0x3d2817 }));
        handle.position.set(0, 0, 0);
        gunModel.add(handle);
        
        // 护手
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.015), this.metalMat);
        guard.position.set(0, 0, -0.06);
        gunModel.add(guard);
        
        // 握刀的手
        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.1), this.skinMat);
        rightHand.position.set(0.02, -0.02, 0.02);
        gunModel.add(rightHand);
        const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.18), this.sleeveMat);
        rightSleeve.position.set(0.06, -0.04, 0.16);
        gunModel.add(rightSleeve);
        
        gunModel.position.set(0.25, -0.2, -0.4);
        gunModel.rotation.set(-0.2, 0.08, 0);
    }
    
    createGrenade(gunModel) {
        const grenadeMat = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
        
        // 手雷本体
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), grenadeMat);
        body.position.set(0, 0, -0.1);
        gunModel.add(body);
        
        // 保险杆
        const lever = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.1, 0.025), new THREE.MeshLambertMaterial({ color: 0x888888 }));
        lever.position.set(0.04, 0.03, -0.1);
        gunModel.add(lever);
        
        // 拉环
        const ring = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), new THREE.MeshLambertMaterial({ color: 0x888888 }));
        ring.position.set(0, 0.08, -0.1);
        gunModel.add(ring);
        
        // 握手雷的手
        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.1), this.skinMat);
        rightHand.position.set(0.02, -0.02, 0);
        gunModel.add(rightHand);
        const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.18), this.sleeveMat);
        rightSleeve.position.set(0.06, -0.04, 0.14);
        gunModel.add(rightSleeve);
        
        gunModel.position.set(0.25, -0.2, -0.4);
        gunModel.rotation.set(0, 0.08, 0);
    }
}
