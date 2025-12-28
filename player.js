// 玩家模型模块
class PlayerModel {
    // 模型缩放比例 - 调整整体大小
    static MODEL_SCALE = 0.7;
    
    // 创建像素风格材质
    static createPixelMaterial(color) {
        return new THREE.MeshPhongMaterial({ color: color, flatShading: true });
    }
    
    static create(team, crouching = false, weapon = 'ak47') {
        const group = new THREE.Group();
        const isCT = team === 'ct';
        const scale = PlayerModel.MODEL_SCALE;
        
        // 材质定义 - 添加更多颜色变化
        const shirtMat = PlayerModel.createPixelMaterial(isCT ? 0x1e3a5f : 0x5c4033);
        const shirtLightMat = PlayerModel.createPixelMaterial(isCT ? 0x2a4a6f : 0x6c5043);
        const vestMat = PlayerModel.createPixelMaterial(isCT ? 0x2563eb : 0x8b4513);
        const vestDarkMat = PlayerModel.createPixelMaterial(isCT ? 0x1e4fc0 : 0x6b3510);
        const pantsMat = PlayerModel.createPixelMaterial(isCT ? 0x1a2a3a : 0x3d2817);
        const pantsLightMat = PlayerModel.createPixelMaterial(isCT ? 0x2a3a4a : 0x4d3827);
        const bootMat = PlayerModel.createPixelMaterial(0x1a1a1a);
        const bootDetailMat = PlayerModel.createPixelMaterial(0x2a2a2a);
        const skinMat = PlayerModel.createPixelMaterial(0xdeb887);
        const skinShadowMat = PlayerModel.createPixelMaterial(0xc9a070);
        const helmetMat = PlayerModel.createPixelMaterial(isCT ? 0x1e40af : 0x6b3a1a);
        const helmetLightMat = PlayerModel.createPixelMaterial(isCT ? 0x2e50bf : 0x7b4a2a);
        const gloveMat = PlayerModel.createPixelMaterial(isCT ? 0x2a2a2a : 0x3d2817);
        const beltMat = PlayerModel.createPixelMaterial(0x3a3a3a);
        
        // 下蹲时的姿势调整
        if (crouching) {
            // === 下蹲姿势 ===
            // 靴子 - 添加细节
            const boot1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2, 2.2), bootMat);
            boot1.position.set(-1.5, 1, 1);
            group.add(boot1);
            const bootTop1 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 2.3), bootDetailMat);
            bootTop1.position.set(-1.5, 2, 1);
            group.add(bootTop1);
            
            const boot2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2, 2.2), bootMat);
            boot2.position.set(1.5, 1, 1);
            group.add(boot2);
            const bootTop2 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 2.3), bootDetailMat);
            bootTop2.position.set(1.5, 2, 1);
            group.add(bootTop2);
            
            // 小腿 - 添加护膝
            const lowerLeg1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 3), pantsMat);
            lowerLeg1.position.set(-1.5, 2.5, -0.5);
            group.add(lowerLeg1);
            const knee1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1), pantsLightMat);
            knee1.position.set(-1.5, 3, -1.8);
            group.add(knee1);
            
            const lowerLeg2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 3), pantsMat);
            lowerLeg2.position.set(1.5, 2.5, -0.5);
            group.add(lowerLeg2);
            const knee2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1), pantsLightMat);
            knee2.position.set(1.5, 3, -1.8);
            group.add(knee2);
            
            // 大腿
            const upperLeg1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 1.6), pantsMat);
            upperLeg1.position.set(-1.5, 4.5, -1.5);
            upperLeg1.rotation.x = -0.3;
            group.add(upperLeg1);
            const upperLeg2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 1.6), pantsMat);
            upperLeg2.position.set(1.5, 4.5, -1.5);
            upperLeg2.rotation.x = -0.3;
            group.add(upperLeg2);
            
            // 腰带
            const belt = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.6, 2.2), beltMat);
            belt.position.set(0, 5.8, -1);
            group.add(belt);
            
            // 身体
            const torso = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 2), shirtMat);
            torso.position.set(0, 7, -1);
            group.add(torso);
            
            // 防弹背心 - 添加口袋细节
            const vest = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.5, 2.3), vestMat);
            vest.position.set(0, 7.2, -1);
            group.add(vest);
            const pocket1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.3), vestDarkMat);
            pocket1.position.set(-1.2, 7.5, 0.3);
            group.add(pocket1);
            const pocket2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.3), vestDarkMat);
            pocket2.position.set(1.2, 7.5, 0.3);
            group.add(pocket2);
            
            // 脖子
            const neck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), skinMat);
            neck.position.set(0, 9.5, -1);
            group.add(neck);
            
            // 头 - 添加耳朵
            const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), skinMat);
            head.position.set(0, 11.5, -1);
            group.add(head);
            const ear1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.4), skinShadowMat);
            ear1.position.set(-1.5, 11.5, -1);
            group.add(ear1);
            const ear2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.4), skinShadowMat);
            ear2.position.set(1.5, 11.5, -1);
            group.add(ear2);
            
            // 头盔/头巾 - 添加细节
            if (isCT) {
                const helmet = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2, 3.2), helmetMat);
                helmet.position.set(0, 13, -1);
                group.add(helmet);
                const helmetRim = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 3.4), helmetLightMat);
                helmetRim.position.set(0, 12.1, -1);
                group.add(helmetRim);
                // 护目镜
                const visor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.3), new THREE.MeshLambertMaterial({ color: 0x333333 }));
                visor.position.set(0, 11.8, 0.5);
                group.add(visor);
                const visorShine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0x6688aa }));
                visorShine.position.set(-0.5, 12, 0.65);
                group.add(visorShine);
            } else {
                const headwrap = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 3), helmetMat);
                headwrap.position.set(0, 12.8, -1);
                group.add(headwrap);
                const wrapFold = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.3, 3.1), helmetLightMat);
                wrapFold.position.set(0, 12.2, -1);
                group.add(wrapFold);
                // 面罩
                const mask = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.3), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
                mask.position.set(0, 10.8, 0.5);
                group.add(mask);
            }
            
            // 肩膀 - 添加肩章
            const shoulder1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), shirtMat);
            shoulder1.position.set(-2.5, 8.5, -1);
            group.add(shoulder1);
            const shoulderPad1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), shirtLightMat);
            shoulderPad1.position.set(-2.5, 9.1, -1);
            group.add(shoulderPad1);
            const shoulder2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), shirtMat);
            shoulder2.position.set(2.5, 8.5, -1);
            group.add(shoulder2);
            const shoulderPad2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), shirtLightMat);
            shoulderPad2.position.set(2.5, 9.1, -1);
            group.add(shoulderPad2);
            
            // 手臂 - 托枪姿势
            // 左上臂 - 向前伸
            const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), shirtMat);
            leftUpperArm.position.set(-2.2, 7, -2);
            leftUpperArm.rotation.x = -0.8;
            group.add(leftUpperArm);
            
            // 左前臂 - 托住枪
            const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 1.1), shirtMat);
            leftForearm.position.set(-1.5, 6.5, -3.5);
            leftForearm.rotation.x = -1.2;
            group.add(leftForearm);
            
            // 左手 - 托枪位置
            const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), gloveMat);
            leftHand.position.set(-1.2, 6.5, -4.5);
            group.add(leftHand);
            
            // 右上臂 - 握枪
            const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), shirtMat);
            rightUpperArm.position.set(2.2, 7, -1.5);
            rightUpperArm.rotation.x = -0.5;
            group.add(rightUpperArm);
            
            // 右前臂 - 握住扳机
            const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 1.1), shirtMat);
            rightForearm.position.set(1.8, 6.5, -2.5);
            rightForearm.rotation.x = -0.8;
            group.add(rightForearm);
            
            // 右手 - 握枪位置
            const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), gloveMat);
            rightHand.position.set(1.5, 6.5, -3.2);
            group.add(rightHand);
            
            // 添加武器模型 - 下蹲时
            const weaponModel = PlayerModel.createWeaponModelHolding(weapon, true);
            if (weaponModel) {
                group.add(weaponModel);
                group.userData.weaponModel = weaponModel;
            }
            
            // 添加枪口火焰
            const muzzleFlash = PlayerModel.createMuzzleFlashHolding(weapon, true);
            if (muzzleFlash) {
                muzzleFlash.visible = false;
                group.add(muzzleFlash);
                group.userData.muzzleFlash = muzzleFlash;
            }
        } else {
            // === 站立姿势 ===
            // 靴子 - 添加细节
            const boot1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2, 2.2), bootMat);
            boot1.position.set(-1.2, 1, 0);
            group.add(boot1);
            const bootTop1 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 2.3), bootDetailMat);
            bootTop1.position.set(-1.2, 2, 0);
            group.add(bootTop1);
            
            const boot2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2, 2.2), bootMat);
            boot2.position.set(1.2, 1, 0);
            group.add(boot2);
            const bootTop2 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 2.3), bootDetailMat);
            bootTop2.position.set(1.2, 2, 0);
            group.add(bootTop2);
            
            // 小腿 - 添加护膝
            const lowerLeg1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 1.5), pantsMat);
            lowerLeg1.position.set(-1.2, 3.2, 0);
            group.add(lowerLeg1);
            const knee1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.8), pantsLightMat);
            knee1.position.set(-1.2, 4.2, 0.5);
            group.add(knee1);
            
            const lowerLeg2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 1.5), pantsMat);
            lowerLeg2.position.set(1.2, 3.2, 0);
            group.add(lowerLeg2);
            const knee2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.8), pantsLightMat);
            knee2.position.set(1.2, 4.2, 0.5);
            group.add(knee2);
            
            // 大腿
            const upperLeg1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.5, 1.6), pantsMat);
            upperLeg1.position.set(-1.2, 5.7, 0);
            group.add(upperLeg1);
            const upperLeg2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.5, 1.6), pantsMat);
            upperLeg2.position.set(1.2, 5.7, 0);
            group.add(upperLeg2);
            
            // 腰带
            const belt = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.6, 2.2), beltMat);
            belt.position.set(0, 7.2, 0);
            group.add(belt);
            const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.2), new THREE.MeshLambertMaterial({ color: 0x888888 }));
            buckle.position.set(0, 7.2, 1.2);
            group.add(buckle);
            
            // 身体
            const torso = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 2), shirtMat);
            torso.position.set(0, 9.5, 0);
            group.add(torso);
            
            // 防弹背心 - 添加口袋细节
            const vest = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4, 2.3), vestMat);
            vest.position.set(0, 10, 0);
            group.add(vest);
            const pocket1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.3), vestDarkMat);
            pocket1.position.set(-1.2, 10.2, 1.3);
            group.add(pocket1);
            const pocket2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.3), vestDarkMat);
            pocket2.position.set(1.2, 10.2, 1.3);
            group.add(pocket2);
            
            // 脖子
            const neck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), skinMat);
            neck.position.set(0, 12.5, 0);
            group.add(neck);
            
            // 头 - 添加耳朵
            const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), skinMat);
            head.position.set(0, 14.5, 0);
            group.add(head);
            const ear1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.4), skinShadowMat);
            ear1.position.set(-1.5, 14.5, 0);
            group.add(ear1);
            const ear2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.4), skinShadowMat);
            ear2.position.set(1.5, 14.5, 0);
            group.add(ear2);
            
            // 头盔/头巾 - 添加细节
            if (isCT) {
                const helmet = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2, 3.2), helmetMat);
                helmet.position.set(0, 16, 0);
                group.add(helmet);
                const helmetRim = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 3.4), helmetLightMat);
                helmetRim.position.set(0, 15.1, 0);
                group.add(helmetRim);
                // 护目镜
                const visor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.3), new THREE.MeshLambertMaterial({ color: 0x333333 }));
                visor.position.set(0, 14.8, 1.5);
                group.add(visor);
                const visorShine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0x6688aa }));
                visorShine.position.set(-0.5, 15, 1.65);
                group.add(visorShine);
            } else {
                const headwrap = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 3), helmetMat);
                headwrap.position.set(0, 15.8, 0);
                group.add(headwrap);
                const wrapFold = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.3, 3.1), helmetLightMat);
                wrapFold.position.set(0, 15.2, 0);
                group.add(wrapFold);
                // 面罩
                const mask = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.3), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
                mask.position.set(0, 13.8, 1.5);
                group.add(mask);
            }
            
            // 肩膀 - 添加肩章
            const shoulder1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), shirtMat);
            shoulder1.position.set(-2.5, 11.5, 0);
            group.add(shoulder1);
            const shoulderPad1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), shirtLightMat);
            shoulderPad1.position.set(-2.5, 12.1, 0);
            group.add(shoulderPad1);
            const shoulder2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), shirtMat);
            shoulder2.position.set(2.5, 11.5, 0);
            group.add(shoulder2);
            const shoulderPad2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), shirtLightMat);
            shoulderPad2.position.set(2.5, 12.1, 0);
            group.add(shoulderPad2);
            
            // 手臂 - 托枪姿势
            // 左上臂 - 向前伸
            const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), shirtMat);
            leftUpperArm.position.set(-2.2, 10, -1);
            leftUpperArm.rotation.x = -0.8;
            group.add(leftUpperArm);
            
            // 左前臂 - 托住枪
            const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 1.1), shirtMat);
            leftForearm.position.set(-1.5, 9, -2.5);
            leftForearm.rotation.x = -1.2;
            group.add(leftForearm);
            
            // 左手 - 托枪位置
            const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), gloveMat);
            leftHand.position.set(-1.2, 9, -3.5);
            group.add(leftHand);
            
            // 右上臂 - 握枪
            const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), shirtMat);
            rightUpperArm.position.set(2.2, 10, -0.5);
            rightUpperArm.rotation.x = -0.5;
            group.add(rightUpperArm);
            
            // 右前臂 - 握住扳机
            const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 1.1), shirtMat);
            rightForearm.position.set(1.8, 9, -1.5);
            rightForearm.rotation.x = -0.8;
            group.add(rightForearm);
            
            // 右手 - 握枪位置
            const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), gloveMat);
            rightHand.position.set(1.5, 9, -2.2);
            group.add(rightHand);
            
            // 添加武器模型 - 站立时
            const weaponModel = PlayerModel.createWeaponModelHolding(weapon, false);
            if (weaponModel) {
                group.add(weaponModel);
                group.userData.weaponModel = weaponModel;
            }
            
            // 添加枪口火焰
            const muzzleFlash = PlayerModel.createMuzzleFlashHolding(weapon, false);
            if (muzzleFlash) {
                muzzleFlash.visible = false;
                group.add(muzzleFlash);
                group.userData.muzzleFlash = muzzleFlash;
            }
        }
        
        // 应用整体缩放
        group.scale.set(scale, scale, scale);
        
        return group;
    }
    
    // 创建托枪姿势的武器模型
    static createWeaponModelHolding(weapon, crouching = false) {
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const greenMat = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
        
        const weaponGroup = new THREE.Group();
        
        // 根据下蹲状态调整武器位置
        const baseY = crouching ? 6.5 : 9;
        const baseZ = crouching ? -4 : -3;
        
        switch(weapon) {
            case 'ak47':
                // AK47 枪身 - 在双手之间
                const ak_body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 3.5), woodMat);
                ak_body.position.set(0, baseY, baseZ);
                weaponGroup.add(ak_body);
                // 枪管
                const ak_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 2.5), metalMat);
                ak_barrel.position.set(0, baseY + 0.2, baseZ - 2.5);
                weaponGroup.add(ak_barrel);
                // 弹匣
                const ak_mag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.5), new THREE.MeshLambertMaterial({ color: 0x4a3a2a }));
                ak_mag.position.set(0, baseY - 0.8, baseZ + 0.5);
                ak_mag.rotation.x = 0.2;
                weaponGroup.add(ak_mag);
                // 枪托
                const ak_stock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.5), woodMat);
                ak_stock.position.set(0, baseY - 0.1, baseZ + 2.2);
                weaponGroup.add(ak_stock);
                break;
                
            case 'm4a1':
                // M4A1 枪身
                const m4_body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 3.2), blackMat);
                m4_body.position.set(0, baseY, baseZ);
                weaponGroup.add(m4_body);
                // 枪管+消音器
                const m4_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2), metalMat);
                m4_barrel.position.set(0, baseY + 0.15, baseZ - 2.2);
                weaponGroup.add(m4_barrel);
                // 消音器
                const m4_silencer = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1), new THREE.MeshLambertMaterial({ color: 0x333333 }));
                m4_silencer.position.set(0, baseY + 0.15, baseZ - 3.5);
                weaponGroup.add(m4_silencer);
                // 弹匣
                const m4_mag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.4), blackMat);
                m4_mag.position.set(0, baseY - 0.7, baseZ + 0.3);
                weaponGroup.add(m4_mag);
                // 枪托
                const m4_stock = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 1.2), blackMat);
                m4_stock.position.set(0, baseY, baseZ + 2);
                weaponGroup.add(m4_stock);
                break;
                
            case 'awp':
                // AWP 枪身
                const awp_body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 4), greenMat);
                awp_body.position.set(0, baseY, baseZ - 0.5);
                weaponGroup.add(awp_body);
                // 枪管
                const awp_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 3.5), metalMat);
                awp_barrel.position.set(0, baseY + 0.2, baseZ - 3.5);
                weaponGroup.add(awp_barrel);
                // 瞄准镜
                const awp_scope = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 1.5), metalMat);
                awp_scope.position.set(0, baseY + 0.6, baseZ);
                weaponGroup.add(awp_scope);
                // 弹匣
                const awp_mag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.5), greenMat);
                awp_mag.position.set(0, baseY - 0.6, baseZ + 0.2);
                weaponGroup.add(awp_mag);
                // 枪托
                const awp_stock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.5), greenMat);
                awp_stock.position.set(0, baseY - 0.1, baseZ + 2.5);
                weaponGroup.add(awp_stock);
                break;
                
            case 'pistol':
                // 手枪 - 单手持握
                const pistol_body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 1.2), blackMat);
                pistol_body.position.set(1.5, baseY, baseZ + 1);
                weaponGroup.add(pistol_body);
                // 枪管
                const pistol_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.8), metalMat);
                pistol_barrel.position.set(1.5, baseY + 0.1, baseZ + 0.2);
                weaponGroup.add(pistol_barrel);
                break;
                
            case 'knife':
                // 刀
                const knife_blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 1.5), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
                knife_blade.position.set(1.5, baseY, baseZ + 0.5);
                weaponGroup.add(knife_blade);
                const knife_handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.7), new THREE.MeshLambertMaterial({ color: 0x3d2817 }));
                knife_handle.position.set(1.5, baseY, baseZ + 1.5);
                weaponGroup.add(knife_handle);
                break;
                
            case 'grenade':
                // 手雷
                const grenade_body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), greenMat);
                grenade_body.position.set(1.5, baseY, baseZ + 1);
                weaponGroup.add(grenade_body);
                break;
                
            default:
                return null;
        }
        
        return weaponGroup;
    }
    
    // 创建托枪姿势的枪口火焰
    static createMuzzleFlashHolding(weapon, crouching = false) {
        if (weapon === 'knife' || weapon === 'grenade') return null;
        
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.9 });
        const flashGroup = new THREE.Group();
        
        const baseY = crouching ? 6.5 : 9;
        const baseZ = crouching ? -4 : -3;
        
        const flash = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), flashMat);
        
        switch(weapon) {
            case 'ak47':
                flash.position.set(0, baseY + 0.2, baseZ - 3.8);
                break;
            case 'm4a1':
                flash.position.set(0, baseY + 0.15, baseZ - 4);
                flash.scale.set(0.8, 0.8, 0.8);
                break;
            case 'awp':
                flash.position.set(0, baseY + 0.2, baseZ - 5.5);
                flash.scale.set(1.5, 1.5, 1.5);
                break;
            case 'pistol':
                flash.position.set(1.5, baseY + 0.1, baseZ - 0.3);
                flash.scale.set(0.5, 0.5, 0.5);
                break;
        }
        
        flashGroup.add(flash);
        return flashGroup;
    }
    
    static createWeaponModel(weapon, scale = 1, baseY = 0) {
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const greenMat = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
        
        const weaponGroup = new THREE.Group();
        const armHeight = 8 * scale + baseY;
        
        switch(weapon) {
            case 'ak47':
                // AK47 枪身
                const ak_body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 3), woodMat);
                ak_body.position.set(2.8, armHeight, -1.5);
                weaponGroup.add(ak_body);
                // 枪管
                const ak_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2), metalMat);
                ak_barrel.position.set(2.8, armHeight + 0.2, -3.5);
                weaponGroup.add(ak_barrel);
                // 弹匣
                const ak_mag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.4), new THREE.MeshLambertMaterial({ color: 0x4a3a2a }));
                ak_mag.position.set(2.8, armHeight - 0.7, -1);
                ak_mag.rotation.x = 0.2;
                weaponGroup.add(ak_mag);
                break;
                
            case 'm4a1':
                // M4A1 枪身
                const m4_body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 2.8), blackMat);
                m4_body.position.set(2.8, armHeight, -1.4);
                weaponGroup.add(m4_body);
                // 枪管+消音器
                const m4_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 2.5), metalMat);
                m4_barrel.position.set(2.8, armHeight + 0.15, -3.5);
                weaponGroup.add(m4_barrel);
                // 消音器
                const m4_silencer = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.8), new THREE.MeshLambertMaterial({ color: 0x333333 }));
                m4_silencer.position.set(2.8, armHeight + 0.15, -5);
                weaponGroup.add(m4_silencer);
                // 弹匣
                const m4_mag = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.35), blackMat);
                m4_mag.position.set(2.8, armHeight - 0.6, -1);
                weaponGroup.add(m4_mag);
                break;
                
            case 'awp':
                // AWP 枪身
                const awp_body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 3.5), greenMat);
                awp_body.position.set(2.8, armHeight, -1.8);
                weaponGroup.add(awp_body);
                // 枪管
                const awp_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 3), metalMat);
                awp_barrel.position.set(2.8, armHeight + 0.2, -4.5);
                weaponGroup.add(awp_barrel);
                // 瞄准镜
                const awp_scope = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1.2), metalMat);
                awp_scope.position.set(2.8, armHeight + 0.6, -1.5);
                weaponGroup.add(awp_scope);
                // 弹匣
                const awp_mag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.4), greenMat);
                awp_mag.position.set(2.8, armHeight - 0.5, -1.2);
                weaponGroup.add(awp_mag);
                break;
                
            case 'pistol':
                // 手枪
                const pistol_body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 1), blackMat);
                pistol_body.position.set(2.8, armHeight, -0.5);
                weaponGroup.add(pistol_body);
                // 枪管
                const pistol_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.8), metalMat);
                pistol_barrel.position.set(2.8, armHeight + 0.1, -1.2);
                weaponGroup.add(pistol_barrel);
                break;
                
            case 'knife':
                // 刀
                const knife_blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 1.2), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
                knife_blade.position.set(2.8, armHeight, -0.8);
                weaponGroup.add(knife_blade);
                const knife_handle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.6), new THREE.MeshLambertMaterial({ color: 0x3d2817 }));
                knife_handle.position.set(2.8, armHeight, 0);
                weaponGroup.add(knife_handle);
                break;
                
            case 'grenade':
                // 手雷
                const grenade_body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), greenMat);
                grenade_body.position.set(2.8, armHeight, -0.3);
                weaponGroup.add(grenade_body);
                break;
                
            default:
                return null;
        }
        
        return weaponGroup;
    }
    
    static createMuzzleFlash(weapon, scale = 1, baseY = 0) {
        if (weapon === 'knife' || weapon === 'grenade') return null;
        
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.9 });
        const flashGroup = new THREE.Group();
        const armHeight = 8 * scale + baseY;
        
        // 枪口火焰
        const flash = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), flashMat);
        
        // 根据武器类型设置火焰位置
        switch(weapon) {
            case 'ak47':
                flash.position.set(2.8, armHeight + 0.2, -4.5);
                break;
            case 'm4a1':
                flash.position.set(2.8, armHeight + 0.15, -5.4);
                break;
            case 'awp':
                flash.position.set(2.8, armHeight + 0.2, -6);
                flash.scale.set(1.5, 1.5, 1.5);
                break;
            case 'pistol':
                flash.position.set(2.8, armHeight + 0.1, -1.6);
                flash.scale.set(0.6, 0.6, 0.6);
                break;
        }
        
        flashGroup.add(flash);
        return flashGroup;
    }
    
    // 显示枪口火焰
    static showMuzzleFlash(playerMesh) {
        if (playerMesh && playerMesh.userData.muzzleFlash) {
            playerMesh.userData.muzzleFlash.visible = true;
            // 50ms后隐藏
            setTimeout(() => {
                if (playerMesh.userData.muzzleFlash) {
                    playerMesh.userData.muzzleFlash.visible = false;
                }
            }, 50);
        }
    }
}
