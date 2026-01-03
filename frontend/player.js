// 玩家模型模块 - 带腿部行走动画
class PlayerModel {
    // 模型缩放比例
    static MODEL_SCALE = 0.7;
    
    // 创建像素风格材质
    static createPixelMaterial(color) {
        return new THREE.MeshPhongMaterial({ color: color, flatShading: true });
    }
    
    // 创建带骨骼的玩家模型（支持腿部动画）
    static create(team, crouching = false, weapon = 'ak47') {
        const group = new THREE.Group();
        const isCT = team === 'ct';
        const scale = PlayerModel.MODEL_SCALE;
        
        // 材质定义
        const shirtMat = PlayerModel.createPixelMaterial(isCT ? 0x1e3a5f : 0x5c4033);
        const shirtLightMat = PlayerModel.createPixelMaterial(isCT ? 0x2a4a6f : 0x6c5043);
        const vestMat = PlayerModel.createPixelMaterial(isCT ? 0x2563eb : 0x8b4513);
        const vestDarkMat = PlayerModel.createPixelMaterial(isCT ? 0x1e4fc0 : 0x6b3510);
        const pantsMat = PlayerModel.createPixelMaterial(isCT ? 0x1a2a3a : 0x3d2817);
        const pantsLightMat = PlayerModel.createPixelMaterial(isCT ? 0x2a3a4a : 0x4d3827);
        const bootMat = PlayerModel.createPixelMaterial(0x1a1a1a);
        const bootDetailMat = PlayerModel.createPixelMaterial(0x2a2a2a);
        const skinMat = PlayerModel.createPixelMaterial(isCT ? 0xe8c4a0 : 0xc9a070);
        const skinShadowMat = PlayerModel.createPixelMaterial(isCT ? 0xd4a882 : 0xb08860);
        const helmetMat = PlayerModel.createPixelMaterial(isCT ? 0x1e40af : 0x6b3a1a);
        const helmetLightMat = PlayerModel.createPixelMaterial(isCT ? 0x2e50bf : 0x7b4a2a);
        const gloveMat = PlayerModel.createPixelMaterial(isCT ? 0x2a2a2a : 0x3d2817);
        const beltMat = PlayerModel.createPixelMaterial(0x3a3a3a);
        const eyeMat = PlayerModel.createPixelMaterial(0x222222);
        const eyeWhiteMat = PlayerModel.createPixelMaterial(0xffffff);
        
        // 上半身组（不动）
        const upperBody = new THREE.Group();
        upperBody.name = 'upperBody';
        
        // 下半身/腿部组（用于行走动画）
        const leftLeg = new THREE.Group();
        leftLeg.name = 'leftLeg';
        const rightLeg = new THREE.Group();
        rightLeg.name = 'rightLeg';
        
        if (crouching) {
            // === 下蹲姿势 ===
            PlayerModel.createCrouchingModel(group, upperBody, leftLeg, rightLeg, {
                isCT, shirtMat, shirtLightMat, vestMat, vestDarkMat, pantsMat, pantsLightMat,
                bootMat, bootDetailMat, skinMat, skinShadowMat, helmetMat, helmetLightMat,
                gloveMat, beltMat, eyeMat, eyeWhiteMat
            }, weapon);
        } else {
            // === 站立姿势 ===
            PlayerModel.createStandingModel(group, upperBody, leftLeg, rightLeg, {
                isCT, shirtMat, shirtLightMat, vestMat, vestDarkMat, pantsMat, pantsLightMat,
                bootMat, bootDetailMat, skinMat, skinShadowMat, helmetMat, helmetLightMat,
                gloveMat, beltMat, eyeMat, eyeWhiteMat
            }, weapon);
        }
        
        // 添加到主组
        group.add(upperBody);
        group.add(leftLeg);
        group.add(rightLeg);
        
        // 保存腿部引用用于动画
        group.userData.leftLeg = leftLeg;
        group.userData.rightLeg = rightLeg;
        group.userData.upperBody = upperBody;
        group.userData.walkPhase = 0;
        
        // 应用整体缩放
        group.scale.set(scale, scale, scale);
        
        return group;
    }
    
    // 创建站立模型
    static createStandingModel(group, upperBody, leftLeg, rightLeg, mats, weapon) {
        const { isCT, shirtMat, shirtLightMat, vestMat, vestDarkMat, pantsMat, pantsLightMat,
                bootMat, bootDetailMat, skinMat, skinShadowMat, helmetMat, helmetLightMat,
                gloveMat, beltMat, eyeMat, eyeWhiteMat } = mats;
        
        // ========== 左腿 ==========
        leftLeg.position.set(-1.2, 0, 0);
        
        // 左靴子
        const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2, 2.2), bootMat);
        leftBoot.position.set(0, 1, 0);
        leftLeg.add(leftBoot);
        const leftBootTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 2.3), bootDetailMat);
        leftBootTop.position.set(0, 2, 0);
        leftLeg.add(leftBootTop);
        // 靴子鞋带细节（前方）
        const leftLace = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.1), new THREE.MeshLambertMaterial({ color: 0x444444 }));
        leftLace.position.set(0, 1.5, -1.15);
        leftLeg.add(leftLace);
        
        // 左小腿
        const leftLowerLeg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 1.5), pantsMat);
        leftLowerLeg.position.set(0, 3.2, 0);
        leftLeg.add(leftLowerLeg);
        // 护膝（前方）
        const leftKnee = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.8), pantsLightMat);
        leftKnee.position.set(0, 4.2, -0.5);
        leftLeg.add(leftKnee);
        
        // 左大腿
        const leftUpperLeg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.5, 1.6), pantsMat);
        leftUpperLeg.position.set(0, 5.7, 0);
        leftLeg.add(leftUpperLeg);
        
        // ========== 右腿 ==========
        rightLeg.position.set(1.2, 0, 0);
        
        // 右靴子
        const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2, 2.2), bootMat);
        rightBoot.position.set(0, 1, 0);
        rightLeg.add(rightBoot);
        const rightBootTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 2.3), bootDetailMat);
        rightBootTop.position.set(0, 2, 0);
        rightLeg.add(rightBootTop);
        const rightLace = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.1), new THREE.MeshLambertMaterial({ color: 0x444444 }));
        rightLace.position.set(0, 1.5, -1.15);
        rightLeg.add(rightLace);
        
        // 右小腿
        const rightLowerLeg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 1.5), pantsMat);
        rightLowerLeg.position.set(0, 3.2, 0);
        rightLeg.add(rightLowerLeg);
        const rightKnee = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.8), pantsLightMat);
        rightKnee.position.set(0, 4.2, -0.5);
        rightLeg.add(rightKnee);
        
        // 右大腿
        const rightUpperLeg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.5, 1.6), pantsMat);
        rightUpperLeg.position.set(0, 5.7, 0);
        rightLeg.add(rightUpperLeg);
        
        // ========== 上半身（固定不动） ==========
        // 腰带
        const belt = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.6, 2.2), beltMat);
        belt.position.set(0, 7.2, 0);
        upperBody.add(belt);
        // 皮带扣（前方）
        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.2), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
        buckle.position.set(0, 7.2, -1.2);
        upperBody.add(buckle);
        
        // 身体
        const torso = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 2), shirtMat);
        torso.position.set(0, 9.5, 0);
        upperBody.add(torso);
        
        // 防弹背心
        const vest = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4, 2.3), vestMat);
        vest.position.set(0, 10, 0);
        upperBody.add(vest);
        // 背心口袋（前方）
        const pocket1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.3), vestDarkMat);
        pocket1.position.set(-1.2, 10.2, -1.3);
        upperBody.add(pocket1);
        const pocket2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.3), vestDarkMat);
        pocket2.position.set(1.2, 10.2, -1.3);
        upperBody.add(pocket2);
        // 背心徽章（前方）
        const badge = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.15), new THREE.MeshLambertMaterial({ color: isCT ? 0xffd700 : 0xff4444 }));
        badge.position.set(0, 11, -1.3);
        upperBody.add(badge);
        
        // 脖子
        const neck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), skinMat);
        neck.position.set(0, 12.5, 0);
        upperBody.add(neck);
        
        // 头部
        const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), skinMat);
        head.position.set(0, 14.5, 0);
        upperBody.add(head);
        
        // 耳朵
        const ear1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.4), skinShadowMat);
        ear1.position.set(-1.5, 14.5, 0);
        upperBody.add(ear1);
        const ear2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.4), skinShadowMat);
        ear2.position.set(1.5, 14.5, 0);
        upperBody.add(ear2);
        
        // 面部特征
        PlayerModel.addFacialFeatures(upperBody, isCT, skinMat, skinShadowMat, eyeMat, eyeWhiteMat);
        
        // 头盔/头巾
        PlayerModel.addHeadgear(upperBody, isCT, helmetMat, helmetLightMat);
        
        // 肩膀
        const shoulder1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), shirtMat);
        shoulder1.position.set(-2.5, 11.5, 0);
        upperBody.add(shoulder1);
        const shoulderPad1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), shirtLightMat);
        shoulderPad1.position.set(-2.5, 12.1, 0);
        upperBody.add(shoulderPad1);
        const shoulder2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), shirtMat);
        shoulder2.position.set(2.5, 11.5, 0);
        upperBody.add(shoulder2);
        const shoulderPad2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), shirtLightMat);
        shoulderPad2.position.set(2.5, 12.1, 0);
        upperBody.add(shoulderPad2);
        
        // 手臂
        PlayerModel.addArms(upperBody, shirtMat, gloveMat, false);
        
        // 武器
        const weaponModel = PlayerModel.createWeaponModelHolding(weapon, false);
        if (weaponModel) {
            upperBody.add(weaponModel);
            group.userData.weaponModel = weaponModel;
        }
        
        // 枪口火焰
        const muzzleFlash = PlayerModel.createMuzzleFlashHolding(weapon, false);
        if (muzzleFlash) {
            muzzleFlash.visible = false;
            upperBody.add(muzzleFlash);
            group.userData.muzzleFlash = muzzleFlash;
        }
    }

    
    // 添加面部特征（面朝Z轴负方向）
    static addFacialFeatures(upperBody, isCT, skinMat, skinShadowMat, eyeMat, eyeWhiteMat) {
        const headY = 14.5;
        const headZ = -1.5; // 面朝前方（Z轴负方向）
        
        if (isCT) {
            // CT - 护目镜遮住眼睛，只显示下半脸
            // 鼻子
            const nose = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), skinShadowMat);
            nose.position.set(0, headY - 0.3, headZ);
            upperBody.add(nose);
            
            // 嘴巴区域（被面罩遮住大部分）
            const chin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.2), skinShadowMat);
            chin.position.set(0, headY - 1, headZ);
            upperBody.add(chin);
        } else {
            // T - 面罩遮住下半脸，露出眼睛
            // 眼白
            const eyeWhite1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.15), eyeWhiteMat);
            eyeWhite1.position.set(-0.55, headY + 0.2, headZ);
            upperBody.add(eyeWhite1);
            const eyeWhite2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.15), eyeWhiteMat);
            eyeWhite2.position.set(0.55, headY + 0.2, headZ);
            upperBody.add(eyeWhite2);
            
            // 瞳孔
            const pupil1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.1), eyeMat);
            pupil1.position.set(-0.55, headY + 0.2, headZ - 0.1);
            upperBody.add(pupil1);
            const pupil2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.1), eyeMat);
            pupil2.position.set(0.55, headY + 0.2, headZ - 0.1);
            upperBody.add(pupil2);
            
            // 眉毛
            const brow1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.1), new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
            brow1.position.set(-0.55, headY + 0.55, headZ);
            brow1.rotation.z = 0.1;
            upperBody.add(brow1);
            const brow2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.1), new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
            brow2.position.set(0.55, headY + 0.55, headZ);
            brow2.rotation.z = -0.1;
            upperBody.add(brow2);
        }
    }
    
    // 添加头盔/头巾（面朝Z轴负方向）
    static addHeadgear(upperBody, isCT, helmetMat, helmetLightMat) {
        const headY = 14.5;
        
        if (isCT) {
            // CT头盔
            const helmet = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2, 3.2), helmetMat);
            helmet.position.set(0, 16, 0);
            upperBody.add(helmet);
            const helmetRim = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 3.4), helmetLightMat);
            helmetRim.position.set(0, 15.1, 0);
            upperBody.add(helmetRim);
            // 护目镜（面朝前方）
            const visor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.3), new THREE.MeshLambertMaterial({ color: 0x333333, transparent: true, opacity: 0.8 }));
            visor.position.set(0, headY + 0.3, -1.5);
            upperBody.add(visor);
            // 护目镜反光
            const visorShine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0x6688aa }));
            visorShine.position.set(-0.5, headY + 0.4, -1.65);
            upperBody.add(visorShine);
            // 头盔标志（前方）
            const helmetBadge = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.15), new THREE.MeshLambertMaterial({ color: 0x4a9eff }));
            helmetBadge.position.set(0, 16.2, -1.7);
            upperBody.add(helmetBadge);
        } else {
            // T头巾
            const headwrap = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 3), helmetMat);
            headwrap.position.set(0, 15.8, 0);
            upperBody.add(headwrap);
            const wrapFold = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.3, 3.1), helmetLightMat);
            wrapFold.position.set(0, 15.2, 0);
            upperBody.add(wrapFold);
            // 头巾尾部（后方）
            const wrapTail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.3), helmetMat);
            wrapTail.position.set(0, 14.5, 1.6);
            wrapTail.rotation.x = -0.2;
            upperBody.add(wrapTail);
            // 面罩（前方，缩小尺寸）
            const mask = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.3), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
            mask.position.set(0, headY - 0.7, -1.5);
            upperBody.add(mask);
        }
    }
    
    // 添加手臂（面朝Z轴负方向持枪）
    static addArms(upperBody, shirtMat, gloveMat, crouching) {
        const baseY = crouching ? 7 : 10;
        
        // 左上臂（向前伸）
        const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), shirtMat);
        leftUpperArm.position.set(-2.2, baseY, crouching ? -2 : -1);
        leftUpperArm.rotation.x = -0.8;
        upperBody.add(leftUpperArm);
        
        // 左前臂
        const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 1.1), shirtMat);
        leftForearm.position.set(-1.5, baseY - 1, crouching ? -3.5 : -2.5);
        leftForearm.rotation.x = -1.2;
        upperBody.add(leftForearm);
        
        // 左手
        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), gloveMat);
        leftHand.position.set(-1.2, baseY - 1, crouching ? -4.5 : -3.5);
        upperBody.add(leftHand);
        
        // 右上臂
        const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), shirtMat);
        rightUpperArm.position.set(2.2, baseY, crouching ? -1.5 : -0.5);
        rightUpperArm.rotation.x = -0.5;
        upperBody.add(rightUpperArm);
        
        // 右前臂
        const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 1.1), shirtMat);
        rightForearm.position.set(1.8, baseY - 1, crouching ? -2.5 : -1.5);
        rightForearm.rotation.x = -0.8;
        upperBody.add(rightForearm);
        
        // 右手
        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), gloveMat);
        rightHand.position.set(1.5, baseY - 1, crouching ? -3.2 : -2.2);
        upperBody.add(rightHand);
    }
    
    // 创建下蹲模型
    static createCrouchingModel(group, upperBody, leftLeg, rightLeg, mats, weapon) {
        const { isCT, shirtMat, shirtLightMat, vestMat, vestDarkMat, pantsMat, pantsLightMat,
                bootMat, bootDetailMat, skinMat, skinShadowMat, helmetMat, helmetLightMat,
                gloveMat, beltMat, eyeMat, eyeWhiteMat } = mats;
        
        // 标记为下蹲模型（用于禁用走路动画）
        leftLeg.userData = { isCrouching: true };
        rightLeg.userData = { isCrouching: true };
        
        // 下蹲时腿部弯曲
        leftLeg.position.set(-1.5, 0, 1);
        rightLeg.position.set(1.5, 0, 1);
        
        // 左腿
        const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2, 2.2), bootMat);
        leftBoot.position.set(0, 1, 0);
        leftLeg.add(leftBoot);
        const leftLowerLeg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 3), pantsMat);
        leftLowerLeg.position.set(0, 2.5, -1.5);
        leftLeg.add(leftLowerLeg);
        const leftUpperLeg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 1.6), pantsMat);
        leftUpperLeg.position.set(0, 4.5, -2.5);
        leftUpperLeg.rotation.x = -0.3;
        leftLeg.add(leftUpperLeg);
        
        // 右腿
        const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2, 2.2), bootMat);
        rightBoot.position.set(0, 1, 0);
        rightLeg.add(rightBoot);
        const rightLowerLeg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 3), pantsMat);
        rightLowerLeg.position.set(0, 2.5, -1.5);
        rightLeg.add(rightLowerLeg);
        const rightUpperLeg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 1.6), pantsMat);
        rightUpperLeg.position.set(0, 4.5, -2.5);
        rightUpperLeg.rotation.x = -0.3;
        rightLeg.add(rightUpperLeg);
        
        // 上半身（下蹲时位置较低）
        const belt = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.6, 2.2), beltMat);
        belt.position.set(0, 5.8, -1);
        upperBody.add(belt);
        
        const torso = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 2), shirtMat);
        torso.position.set(0, 7, -1);
        upperBody.add(torso);
        
        const vest = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.5, 2.3), vestMat);
        vest.position.set(0, 7.2, -1);
        upperBody.add(vest);
        
        const neck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), skinMat);
        neck.position.set(0, 9.5, -1);
        upperBody.add(neck);
        
        const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), skinMat);
        head.position.set(0, 11.5, -1);
        upperBody.add(head);
        
        // 面部和头盔
        PlayerModel.addFacialFeaturesCrouching(upperBody, isCT, skinMat, skinShadowMat, eyeMat, eyeWhiteMat);
        PlayerModel.addHeadgearCrouching(upperBody, isCT, helmetMat, helmetLightMat);
        
        // 肩膀和手臂
        const shoulder1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), shirtMat);
        shoulder1.position.set(-2.5, 8.5, -1);
        upperBody.add(shoulder1);
        const shoulder2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), shirtMat);
        shoulder2.position.set(2.5, 8.5, -1);
        upperBody.add(shoulder2);
        
        PlayerModel.addArms(upperBody, shirtMat, gloveMat, true);
        
        // 武器
        const weaponModel = PlayerModel.createWeaponModelHolding(weapon, true);
        if (weaponModel) {
            upperBody.add(weaponModel);
            group.userData.weaponModel = weaponModel;
        }
        
        const muzzleFlash = PlayerModel.createMuzzleFlashHolding(weapon, true);
        if (muzzleFlash) {
            muzzleFlash.visible = false;
            upperBody.add(muzzleFlash);
            group.userData.muzzleFlash = muzzleFlash;
        }
    }
    
    static addFacialFeaturesCrouching(upperBody, isCT, skinMat, skinShadowMat, eyeMat, eyeWhiteMat) {
        const headY = 11.5;
        const headZ = -2.5; // 面朝前方（头部前表面）
        
        if (isCT) {
            // CT - 护目镜遮住眼睛，只显示下半脸
            const nose = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), skinShadowMat);
            nose.position.set(0, headY - 0.3, headZ);
            upperBody.add(nose);
            const chin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.2), skinShadowMat);
            chin.position.set(0, headY - 1, headZ);
            upperBody.add(chin);
        } else {
            // T - 面罩遮住下半脸，露出眼睛
            const eyeWhite1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.15), eyeWhiteMat);
            eyeWhite1.position.set(-0.55, headY + 0.2, headZ);
            upperBody.add(eyeWhite1);
            const eyeWhite2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.15), eyeWhiteMat);
            eyeWhite2.position.set(0.55, headY + 0.2, headZ);
            upperBody.add(eyeWhite2);
            const pupil1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.1), eyeMat);
            pupil1.position.set(-0.55, headY + 0.2, headZ - 0.1);
            upperBody.add(pupil1);
            const pupil2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.1), eyeMat);
            pupil2.position.set(0.55, headY + 0.2, headZ - 0.1);
            upperBody.add(pupil2);
            // 眉毛
            const brow1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.1), new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
            brow1.position.set(-0.55, headY + 0.55, headZ);
            brow1.rotation.z = 0.1;
            upperBody.add(brow1);
            const brow2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.1), new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
            brow2.position.set(0.55, headY + 0.55, headZ);
            brow2.rotation.z = -0.1;
            upperBody.add(brow2);
        }
    }
    
    static addHeadgearCrouching(upperBody, isCT, helmetMat, helmetLightMat) {
        const headY = 11.5;
        const headZ = -2.5; // 头部前表面
        if (isCT) {
            const helmet = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2, 3.2), helmetMat);
            helmet.position.set(0, 13, -1);
            upperBody.add(helmet);
            const visor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.3), new THREE.MeshLambertMaterial({ color: 0x333333 }));
            visor.position.set(0, 11.8, headZ); // 面朝前方
            upperBody.add(visor);
            // 护目镜反光
            const visorShine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0x6688aa }));
            visorShine.position.set(-0.5, 11.9, headZ - 0.15);
            upperBody.add(visorShine);
        } else {
            const headwrap = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 3), helmetMat);
            headwrap.position.set(0, 12.8, -1);
            upperBody.add(headwrap);
            // 面罩（缩小尺寸）
            const mask = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.3), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
            mask.position.set(0, headY - 0.7, headZ); // 面朝前方
            upperBody.add(mask);
        }
    }

    
    // 腿部行走动画 - 脚步前后摆动（仅站立时有效）
    static animateWalk(mesh, phase) {
        if (!mesh || !mesh.userData.leftLeg || !mesh.userData.rightLeg) return;
        
        // 下蹲时不播放走路动画（下蹲模型腿部结构不同）
        const leftLeg = mesh.userData.leftLeg;
        const rightLeg = mesh.userData.rightLeg;
        
        // 检测是否是下蹲模型（下蹲时腿部初始Z位置为1）
        const isCrouching = leftLeg.userData && leftLeg.userData.isCrouching;
        if (isCrouching) return;
        
        // 脚步前后移动（Z轴方向）- 模拟走路时脚的前后摆动
        const stepDistance = Math.sin(phase) * 1.5; // 步幅
        
        // 左脚向前时右脚向后
        leftLeg.position.z = stepDistance;
        rightLeg.position.z = -stepDistance;
        
        // 脚抬起的高度（走路时脚会稍微抬起）
        leftLeg.position.y = Math.max(0, Math.sin(phase)) * 0.5;
        rightLeg.position.y = Math.max(0, -Math.sin(phase)) * 0.5;
    }
    
    // 重置腿部位置
    static resetLegs(mesh) {
        if (!mesh || !mesh.userData.leftLeg || !mesh.userData.rightLeg) return;
        
        mesh.userData.leftLeg.position.z = 0;
        mesh.userData.rightLeg.position.z = 0;
        mesh.userData.leftLeg.position.y = 0;
        mesh.userData.rightLeg.position.y = 0;
    }
    
    // 创建托枪姿势的武器模型（面朝Z轴负方向）
    static createWeaponModelHolding(weapon, crouching = false) {
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const greenMat = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
        
        const weaponGroup = new THREE.Group();
        const baseY = crouching ? 6.5 : 9;
        const baseZ = crouching ? -4 : -3; // Z轴负方向（面朝前方）
        
        switch(weapon) {
            case 'ak47':
                const ak_body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 3.5), woodMat);
                ak_body.position.set(0, baseY, baseZ);
                weaponGroup.add(ak_body);
                const ak_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 2.5), metalMat);
                ak_barrel.position.set(0, baseY + 0.2, baseZ - 2.5);
                weaponGroup.add(ak_barrel);
                const ak_mag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.5), new THREE.MeshLambertMaterial({ color: 0x4a3a2a }));
                ak_mag.position.set(0, baseY - 0.8, baseZ + 0.5);
                ak_mag.rotation.x = 0.2;
                weaponGroup.add(ak_mag);
                const ak_stock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.5), woodMat);
                ak_stock.position.set(0, baseY - 0.1, baseZ + 2.2);
                weaponGroup.add(ak_stock);
                break;
                
            case 'm4a1':
                const m4_body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 3.2), blackMat);
                m4_body.position.set(0, baseY, baseZ);
                weaponGroup.add(m4_body);
                const m4_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2), metalMat);
                m4_barrel.position.set(0, baseY + 0.15, baseZ - 2.2);
                weaponGroup.add(m4_barrel);
                const m4_silencer = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1), new THREE.MeshLambertMaterial({ color: 0x333333 }));
                m4_silencer.position.set(0, baseY + 0.15, baseZ - 3.5);
                weaponGroup.add(m4_silencer);
                const m4_mag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.4), blackMat);
                m4_mag.position.set(0, baseY - 0.7, baseZ + 0.3);
                weaponGroup.add(m4_mag);
                const m4_stock = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 1.2), blackMat);
                m4_stock.position.set(0, baseY, baseZ + 2);
                weaponGroup.add(m4_stock);
                break;
                
            case 'awp':
                const awp_body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 4), greenMat);
                awp_body.position.set(0, baseY, baseZ - 0.5);
                weaponGroup.add(awp_body);
                const awp_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 3.5), metalMat);
                awp_barrel.position.set(0, baseY + 0.2, baseZ - 3.5);
                weaponGroup.add(awp_barrel);
                const awp_scope = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 1.5), metalMat);
                awp_scope.position.set(0, baseY + 0.6, baseZ);
                weaponGroup.add(awp_scope);
                const awp_mag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.5), greenMat);
                awp_mag.position.set(0, baseY - 0.6, baseZ + 0.2);
                weaponGroup.add(awp_mag);
                const awp_stock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.5), greenMat);
                awp_stock.position.set(0, baseY - 0.1, baseZ + 2.5);
                weaponGroup.add(awp_stock);
                break;
                
            case 'pistol':
                const pistol_body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 1.2), blackMat);
                pistol_body.position.set(1.5, baseY, baseZ + 1);
                weaponGroup.add(pistol_body);
                const pistol_barrel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.8), metalMat);
                pistol_barrel.position.set(1.5, baseY + 0.1, baseZ + 0.2);
                weaponGroup.add(pistol_barrel);
                break;
                
            case 'knife':
                const knife_blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 1.5), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
                knife_blade.position.set(1.5, baseY, baseZ + 0.5);
                weaponGroup.add(knife_blade);
                const knife_handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.7), new THREE.MeshLambertMaterial({ color: 0x3d2817 }));
                knife_handle.position.set(1.5, baseY, baseZ + 1.5);
                weaponGroup.add(knife_handle);
                break;
                
            case 'grenade':
                const grenade_body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), greenMat);
                grenade_body.position.set(1.5, baseY, baseZ + 1);
                weaponGroup.add(grenade_body);
                break;
                
            default:
                return null;
        }
        
        return weaponGroup;
    }
    
    // 创建枪口火焰（面朝Z轴负方向）
    static createMuzzleFlashHolding(weapon, crouching = false) {
        if (weapon === 'knife' || weapon === 'grenade') return null;
        
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.9 });
        const flashGroup = new THREE.Group();
        
        const baseY = crouching ? 6.5 : 9;
        const baseZ = crouching ? -4 : -3; // Z轴负方向
        
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
    
    // 显示枪口火焰
    static showMuzzleFlash(playerMesh) {
        if (playerMesh && playerMesh.userData.muzzleFlash) {
            playerMesh.userData.muzzleFlash.visible = true;
            setTimeout(() => {
                if (playerMesh.userData.muzzleFlash) {
                    playerMesh.userData.muzzleFlash.visible = false;
                }
            }, 50);
        }
    }
}
