// 地图配置模块
// 预加载缓存
const MapCache = {
    textures: {},       // 纹理缓存
    geometries: {},     // 几何体缓存
    materials: {},      // 材质缓存
    graffitiTextures: [], // 涂鸦纹理缓存
    isPreloaded: false  // 预加载完成标志
};

const MapConfigs = {
    'indoor': {
        displayName: '室内竞技场 (Indoor)',  // 地图显示名称
        gameMode: ['deathmatch'],  // 支持的游戏模式
        floorColor1: '#8b7355', floorColor2: '#7a6245',  // 温暖的木地板色
        wallColor1: '#c9a86c', wallColor2: '#a08050',    // 暖色墙壁
        skyColor: 0x87ceeb,  // 明亮的天空蓝
        obstacles: [
            // ========== 左上角建筑 ==========
            {x: -52, y: 15, z: -19.5, w: 65, h: 30, d: 2, color: 0xb85c38},
            {x: -19.5, y: 15, z: -52, w: 2, h: 30, d: 65, color: 0xb85c38},
            {x: -52, y: 15, z: -84.5, w: 65, h: 30, d: 2, color: 0xb85c38},
            {x: -84.5, y: 15, z: -52, w: 2, h: 30, d: 65, color: 0xb85c38},
            
            // ========== 右上角建筑 ==========
            {x: 52, y: 15, z: -19.5, w: 65, h: 30, d: 2, color: 0xd4a574},
            {x: 19.5, y: 15, z: -52, w: 2, h: 30, d: 65, color: 0xd4a574},
            {x: 52, y: 15, z: -84.5, w: 65, h: 30, d: 2, color: 0xd4a574},
            {x: 84.5, y: 15, z: -52, w: 2, h: 30, d: 65, color: 0xd4a574},
            
            // ========== 左下角建筑 ==========
            {x: -52, y: 15, z: 19.5, w: 65, h: 30, d: 2, color: 0x7a9eb8},
            {x: -19.5, y: 15, z: 52, w: 2, h: 30, d: 65, color: 0x7a9eb8},
            {x: -52, y: 15, z: 84.5, w: 65, h: 30, d: 2, color: 0x7a9eb8},
            {x: -84.5, y: 15, z: 52, w: 2, h: 30, d: 65, color: 0x7a9eb8},
            
            // ========== 右下角建筑 ==========
            {x: 52, y: 15, z: 19.5, w: 65, h: 30, d: 2, color: 0xa67c52},
            {x: 19.5, y: 15, z: 52, w: 2, h: 30, d: 65, color: 0xa67c52},
            {x: 52, y: 15, z: 84.5, w: 65, h: 30, d: 2, color: 0xa67c52},
            {x: 84.5, y: 15, z: 52, w: 2, h: 30, d: 65, color: 0xa67c52}
        ]
    },
    // 'dust2': {
    //     displayName: '沙漠2 (Dust2)',  // 地图显示名称
    //     gameMode: ['deathmatch', 'defuse'],  // 支持团队竞技和爆破模式
    //     floorColor1: '#c4a35a', floorColor2: '#b8963d',
    //     wallColor1: '#c9a227', wallColor2: '#8b7355',
    //     skyColor: 0x87ceeb,
    //     mapSize: 300, // 大地图
    //     // 沙漠地图 - 无障碍物，只保留包点
    //     obstacles: [],
    //     // 爆破模式包点位置
    //     bombSites: {
    //         A: { x: 180, z: -180, radius: 40 },
    //         B: { x: -180, z: 180, radius: 40 }
    //     },
    //     // 出生点
    //     spawnPoints: {
    //         ct: [
    //             {x: 250, z: 240}, {x: 240, z: 250}, {x: 260, z: 230},
    //             {x: 230, z: 260}, {x: 270, z: 240}
    //         ],
    //         t: [
    //             {x: -250, z: -240}, {x: -240, z: -250}, {x: -260, z: -230},
    //             {x: -230, z: -260}, {x: -270, z: -240}
    //         ]
    //     }
    // },
    'shipment': {
        displayName: '运输船 (Shipment)',  // 地图显示名称
        gameMode: ['deathmatch'],  // 支持团队竞技
        floorColor1: '#5a5a5a', floorColor2: '#4a4a4a',
        wallColor1: '#8b4513', wallColor2: '#5a2d0d',
        skyColor: 0x708090,
        obstacles: [
            // 四角蓝色集装箱
            {x: -55, y: 8, z: -55, w: 8, h: 16, d: 25, color: 0x4a6a8a},
            {x: -55, y: 8, z: -25, w: 25, h: 16, d: 8, color: 0x4a6a8a},
            {x: 55, y: 8, z: -55, w: 8, h: 16, d: 25, color: 0x4a6a8a},
            {x: 55, y: 8, z: -25, w: 25, h: 16, d: 8, color: 0x4a6a8a},
            {x: -55, y: 8, z: 55, w: 8, h: 16, d: 25, color: 0x4a6a8a},
            {x: -55, y: 8, z: 25, w: 25, h: 16, d: 8, color: 0x4a6a8a},
            {x: 55, y: 8, z: 55, w: 8, h: 16, d: 25, color: 0x4a6a8a},
            {x: 55, y: 8, z: 25, w: 25, h: 16, d: 8, color: 0x4a6a8a},
            // 中央斜放绿色集装箱
            {x: 15, y: 6, z: -25, w: 20, h: 12, d: 8, color: 0x3d5a3d, rotation: 0.5},
            {x: -15, y: 6, z: 25, w: 20, h: 12, d: 8, color: 0x3d5a3d, rotation: -0.5},
            {x: 25, y: 6, z: 5, w: 18, h: 12, d: 8, color: 0x3d5a3d, rotation: 0.4},
            // 左侧绿色集装箱堆
            {x: -35, y: 6, z: 0, w: 8, h: 12, d: 15, color: 0x3d5a3d},
            {x: -35, y: 14, z: -5, w: 8, h: 8, d: 10, color: 0x4a6a4a},
            // 木箱
            {x: -40, y: 4, z: -45, w: 8, h: 8, d: 8, color: 0xc4a35a},
            {x: 40, y: 4, z: -45, w: 8, h: 8, d: 8, color: 0xc4a35a},
            {x: -40, y: 4, z: 45, w: 8, h: 8, d: 8, color: 0xc4a35a},
            {x: 40, y: 4, z: 45, w: 8, h: 8, d: 8, color: 0xc4a35a},
            {x: 0, y: 4, z: 0, w: 6, h: 8, d: 6, color: 0xc4a35a},
            // 边缘灰色集装箱
            {x: 0, y: 8, z: -58, w: 30, h: 16, d: 6, color: 0x6a6a6a},
            {x: 0, y: 8, z: 58, w: 30, h: 16, d: 6, color: 0x6a6a6a}
        ]
    },
    'office': {
        displayName: '办公大楼 (Office)',  // 地图显示名称
        gameMode: ['deathmatch'],  // 支持团队竞技
        floorColor1: '#4a4a4a', floorColor2: '#3a3a3a',
        wallColor1: '#d4d4d4', wallColor2: '#a0a0a0',
        skyColor: 0x708090,
        obstacles: [
            {x: -40, y: 8, z: -40, w: 30, h: 16, d: 15},
            {x: 40, y: 8, z: 40, w: 30, h: 16, d: 15},
            {x: 0, y: 6, z: -50, w: 40, h: 12, d: 8},
            {x: 0, y: 6, z: 50, w: 40, h: 12, d: 8}
        ]
    },
    'warehouse': {
        displayName: '仓库 (Warehouse)',  // 地图显示名称
        gameMode: ['deathmatch'],  // 支持团队竞技
        floorColor1: '#5a5a5a', floorColor2: '#4a4a4a',
        wallColor1: '#8b4513', wallColor2: '#5a2d0d',
        skyColor: 0x6bb3d9,
        obstacles: [
            {x: -50, y: 12, z: -30, w: 25, h: 24, d: 25},
            {x: 50, y: 12, z: 30, w: 25, h: 24, d: 25},
            {x: 0, y: 5, z: 0, w: 60, h: 10, d: 10}
        ]
    },
    'custom_shamo': {
        displayName: '沙漠灰',
        gameMode: ['defuse'],
        floorColor1: '#8b7355',
        floorColor2: '#7a6245',
        wallColor1: '#95a5a6',
        wallColor2: '#7f8c8d',
        skyColor: 0x6bb3d9,
        mapSize: 300,
        obstacles: [
            {x: -300, y: 10, z: 280, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: 280, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: 240, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: 240, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: 200, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: 200, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: 160, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: 160, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: 120, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: 120, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: 80, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: 80, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: 40, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: 40, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: 0, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: 0, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: -40, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: -40, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: -80, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: -80, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: -120, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: -120, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: -160, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: -160, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: -200, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: -200, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: -240, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: -240, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -300, y: 10, z: -280, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 300, y: 10, z: -280, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -280, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -280, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -240, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -240, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -200, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -200, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -160, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -160, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -120, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -120, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -80, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -80, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -40, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -40, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 0, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 0, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 40, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 40, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 80, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 80, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 120, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 120, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 160, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 160, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 200, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 200, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 240, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 240, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 280, y: 10, z: 300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 280, y: 10, z: -300, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -142, y: 10, z: 234, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -106, y: 10, z: 234, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -70, y: 10, z: 234, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -30, y: 10, z: 234, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 4, y: 10, z: 234, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 50, y: 10, z: 234, w: 32, h: 20, d: 1, rotation: 3.142, textureType: 'brick'},
            {x: 82, y: 10, z: 234, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 120, y: 10, z: 234, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 138, y: 10, z: 190, w: 40, h: 20, d: 2, rotation: 7.854, textureType: 'brick'},
            {x: 138, y: 10, z: 150, w: 40, h: 20, d: 2, rotation: 10.996, textureType: 'brick'},
            {x: 118, y: 10, z: 208, w: 40, h: 20, d: 2, rotation: 12.567, textureType: 'brick'},
            {x: 70, y: 10, z: 162, w: 40, h: 20, d: 2, rotation: 17.279, textureType: 'brick'},
            {x: 70, y: 10, z: 122, w: 40, h: 20, d: 2, rotation: 17.279, textureType: 'brick'},
            {x: 6, y: 10, z: 154, w: 40, h: 20, d: 2, rotation: 17.279, textureType: 'brick'},
            {x: 6, y: 10, z: 194, w: 40, h: 20, d: 2, rotation: 17.279, textureType: 'brick'},
            {x: 8, y: 10, z: 212, w: 43, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 6, y: 10, z: 114, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 6, y: 10, z: 74, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 6, y: 10, z: 34, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 6, y: 10, z: -6, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 6, y: 10, z: -46, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 6, y: 10, z: -86, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -14, y: 10, z: -106, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 90, y: 10, z: 102, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 138, y: 10, z: 110, w: 20, h: 20, d: 2, rotation: 4.713, textureType: 'brick'},
            {x: 120, y: 10, z: 102, w: 40, h: 20, d: 2, rotation: 9.425, textureType: 'brick'},
            {x: -14, y: 10, z: -142, w: 40, h: 20, d: 2, rotation: 9.425, textureType: 'brick'},
            {x: 6, y: 10, z: -164, w: 40, h: 20, d: 2, rotation: 10.996, textureType: 'brick'},
            {x: 74, y: 10, z: -182, w: 69, h: 20, d: 2, rotation: 25.133, textureType: 'brick'},
            {x: 0, y: 10, z: -186, w: 40, h: 20, d: 2, rotation: 21.991, textureType: 'brick'},
            {x: 156, y: 10, z: 38, w: 43, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 136, y: 10, z: 16, w: 44, h: 20, d: 2, rotation: 7.854, textureType: 'brick'},
            {x: 136, y: 10, z: -24, w: 40, h: 20, d: 2, rotation: 7.854, textureType: 'brick'},
            {x: 136, y: 10, z: -64, w: 40, h: 20, d: 2, rotation: 7.854, textureType: 'brick'},
            {x: 136, y: 10, z: -104, w: 40, h: 20, d: 2, rotation: 7.854, textureType: 'brick'},
            {x: 136, y: 10, z: -144, w: 40, h: 20, d: 2, rotation: 7.854, textureType: 'brick'},
            {x: 280, y: 10, z: 38, w: 40, h: 20, d: 2, rotation: 9.425, textureType: 'brick'},
            {x: 244, y: 10, z: 38, w: 40, h: 20, d: 2, rotation: 9.425, textureType: 'brick'},
            {x: 140, y: 10, z: 126, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 104, y: 4, z: 6, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -2, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: 14, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: 22, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: 30, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -10, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -18, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -26, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -34, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -42, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -50, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -58, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -66, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -74, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -82, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -90, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -98, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -106, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -114, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -122, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -130, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -138, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -146, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -162, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -170, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 112, y: 10, z: -182, w: 46, h: 20, d: 2, rotation: 9.425, textureType: 'brick'},
            {x: 134, y: 10, z: -204, w: 43, h: 20, d: 2, rotation: 10.996, textureType: 'brick'},
            {x: 186, y: 10, z: -192, w: 43, h: 20, d: 2, rotation: 12.567, textureType: 'brick'},
            {x: 158, y: 10, z: -36, w: 44, h: 20, d: 2, rotation: 12.567, textureType: 'brick'},
            {x: 248, y: 10, z: -16, w: 40, h: 20, d: 2, rotation: 14.137, textureType: 'brick'},
            {x: 250, y: 10, z: 16, w: 44, h: 20, d: 2, rotation: 14.137, textureType: 'brick'},
            {x: 206, y: 10, z: -170, w: 44, h: 20, d: 2, rotation: 14.137, textureType: 'brick'},
            {x: 206, y: 10, z: -130, w: 40, h: 20, d: 2, rotation: 14.137, textureType: 'brick'},
            {x: 164, y: 10, z: -94, w: 56, h: 20, d: 2, rotation: 18.85, textureType: 'brick'},
            {x: -278, y: 10, z: 232, w: 40, h: 20, d: 2, rotation: 12.567, textureType: 'brick'},
            {x: -240, y: 10, z: 232, w: 44, h: 20, d: 2, rotation: 15.708, textureType: 'brick'},
            {x: -218, y: 10, z: 252, w: 40, h: 20, d: 2, rotation: 20.421, textureType: 'brick'},
            {x: -216, y: 10, z: 278, w: 40, h: 20, d: 2, rotation: 20.421, textureType: 'brick'},
            {x: -54, y: 10, z: -106, w: 40, h: 20, d: 2, rotation: 25.133, textureType: 'brick'},
            {x: -94, y: 10, z: -106, w: 40, h: 20, d: 2, rotation: 25.133, textureType: 'brick'},
            {x: -108, y: 10, z: -84, w: 40, h: 20, d: 2, rotation: 26.704, textureType: 'brick'},
            {x: -108, y: 10, z: -44, w: 40, h: 20, d: 2, rotation: 26.704, textureType: 'brick'},
            {x: -108, y: 10, z: -4, w: 40, h: 20, d: 2, rotation: 26.704, textureType: 'brick'},
            {x: -108, y: 10, z: 36, w: 40, h: 20, d: 2, rotation: 26.704, textureType: 'brick'},
            {x: -108, y: 10, z: 76, w: 40, h: 20, d: 2, rotation: 26.704, textureType: 'brick'},
            {x: -108, y: 10, z: 116, w: 40, h: 20, d: 2, rotation: 26.704, textureType: 'brick'},
            {x: -108, y: 10, z: 156, w: 40, h: 20, d: 2, rotation: 26.704, textureType: 'brick'},
            {x: -108, y: 10, z: 196, w: 40, h: 20, d: 2, rotation: 26.704, textureType: 'brick'},
            {x: -110, y: 9, z: 212, w: 44, h: 18, d: 2, rotation: 26.704, textureType: 'brick'},
            {x: -54, y: 10, z: -142, w: 40, h: 20, d: 2, rotation: 28.275, textureType: 'brick'},
            {x: -92, y: 10, z: -142, w: 40, h: 20, d: 2, rotation: 28.275, textureType: 'brick'},
            {x: -132, y: 10, z: -142, w: 40, h: 20, d: 2, rotation: 28.275, textureType: 'brick'},
            {x: -172, y: 10, z: -142, w: 40, h: 20, d: 2, rotation: 28.275, textureType: 'brick'},
            {x: -210, y: 10, z: -142, w: 40, h: 20, d: 2, rotation: 28.275, textureType: 'brick'},
            {x: -280, y: 10, z: -142, w: 40, h: 20, d: 2, rotation: 28.275, textureType: 'brick'},
            {x: -260, y: 10, z: -164, w: 44, h: 20, d: 2, rotation: 29.845, textureType: 'brick'},
            {x: -230, y: 10, z: -164, w: 45, h: 20, d: 2, rotation: 29.845, textureType: 'brick'},
            {x: -280, y: 10, z: -186, w: 40, h: 20, d: 2, rotation: 34.558, textureType: 'brick'},
            {x: -174, y: 10, z: -194, w: 39, h: 20, d: 2, rotation: 42.412, textureType: 'brick'},
            {x: -172, y: 10, z: -278, w: 40, h: 20, d: 2, rotation: 42.412, textureType: 'brick'},
            {x: -170, y: 10, z: -250, w: 40, h: 20, d: 2, rotation: 42.412, textureType: 'brick'},
            {x: -134, y: 10, z: -106, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -174, y: 10, z: -106, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -276, y: 10, z: -104, w: 50, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -248, y: 10, z: -104, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -154, y: 10, z: -174, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -78, y: 10, z: -174, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -38, y: 10, z: -174, w: 40, h: 20, d: 2, rotation: 6.283, textureType: 'brick'},
            {x: 136, y: 10, z: -276, w: 40, h: 20, d: 2, rotation: 7.854, textureType: 'brick'},
            {x: -22, y: 4, z: -180, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -22, y: 12, z: -180, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -22, y: 20, z: -180, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 178, y: 10, z: -256, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 218, y: 10, z: -256, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 236, y: 10, z: -234, w: 42, h: 20, d: 2, rotation: 4.713, textureType: 'brick'},
            {x: -292, y: 4, z: -250, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -284, y: 4, z: -250, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -276, y: 4, z: -250, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -276, y: 12, z: -250, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -292, y: 12, z: -250, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -254, y: 4, z: -250, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -254, y: 4, z: -258, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -254, y: 4, z: -266, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -254, y: 4, z: -274, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -254, y: 4, z: -282, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -254, y: 4, z: -290, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -254, y: 12, z: -250, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -254, y: 12, z: -258, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -254, y: 12, z: -274, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -254, y: 12, z: -282, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -162, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -138, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -130, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -114, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -106, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -90, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -82, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -66, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -58, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -42, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -34, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -18, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -10, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: 6, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: 22, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 29, y: 4, z: 233, w: 5, h: 8, d: 10, rotation: 1.571, textureType: 'wood'},
            {x: 104, y: 4, z: -154, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 12, z: -146, w: 8, h: 8, d: 8, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: 104, y: 4, z: -177, w: 8, h: 8, d: 9, color: 0x8b7355, rotation: 1.571, textureType: 'metal'},
            {x: -210, y: 10, z: -186, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: -194, y: 10, z: -186, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: 156, y: 10, z: -162, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: 280, y: 10, z: 228, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: 240, y: 10, z: 228, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: 200, y: 10, z: 282, w: 40, h: 20, d: 2, rotation: 4.712, textureType: 'brick'},
            {x: 220, y: 10, z: 228, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 200, y: 10, z: 248, w: 40, h: 20, d: 2, rotation: 4.712, textureType: 'brick'},
            {x: 70, y: 10, z: 186, w: 40, h: 20, d: 2, rotation: 4.712, textureType: 'brick'},
            {x: 88, y: 10, z: 206, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: 210, y: 10, z: 38, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: 166, y: 10, z: -174, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: 186, y: 10, z: -94, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 206, y: 10, z: -114, w: 40, h: 20, d: 2, rotation: 4.712, textureType: 'brick'},
            {x: 136, y: 10, z: -260, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -186, y: 10, z: -106, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 52, y: 10, z: -182, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: -230, y: 10, z: -86, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -206, y: 10, z: -88, w: 40, h: 20, d: 2, rotation: 1.571, textureType: 'brick'},
            {x: -186, y: 10, z: -70, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -150, y: 10, z: -70, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -128, y: 10, z: -70, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -250, y: 10, z: -66, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -280, y: 10, z: -66, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: -72, y: 4, z: -138, w: 8, h: 8, d: 8, color: 0x8b7355, textureType: 'metal'},
            {x: -72, y: 4, z: -130, w: 8, h: 8, d: 8, color: 0x8b7355, textureType: 'metal'},
            {x: 214, y: 10, z: -36, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: 228, y: 10, z: -34, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: -116, y: 10, z: -174, w: 40, h: 20, d: 2, rotation: 3.142, textureType: 'brick'},
            {x: 142, y: 5, z: -290, w: 10, h: 10, d: 10, textureType: 'wood'},
            {x: 32, y: 8, z: -180, w: 8, h: 16, d: 2, rotation: 1.571, textureType: 'wood'},
            {x: 20, y: 8, z: -182, w: 8, h: 16, d: 2, rotation: 1.571, textureType: 'wood'},
            {x: 6, y: 8, z: -140, w: 8, h: 16, d: 2, rotation: 1.571, textureType: 'wood'},
            {x: 6, y: 8, z: -132, w: 8, h: 16, d: 2, rotation: 1.571, textureType: 'wood'},
            {x: 6, y: 8, z: -110, w: 8, h: 16, d: 2, rotation: 1.571, textureType: 'wood'},
            {x: -214, y: 10, z: 230, w: 40, h: 20, d: 2, textureType: 'brick'},
            {x: -130, y: 10, z: 52, w: 43, h: 20, d: 2, textureType: 'brick'},
            {x: 242, y: 5, z: -224, w: 10, h: 10, d: 10, textureType: 'wood'},
            {x: 252, y: 5, z: -224, w: 10, h: 10, d: 10, textureType: 'wood'},
            {x: 256, y: 5, z: -10, w: 10, h: 10, d: 10, textureType: 'wood'},
            {x: 266, y: 5, z: -10, w: 10, h: 10, d: 10, textureType: 'wood'},
            {x: 256, y: 15, z: -10, w: 10, h: 10, d: 10, textureType: 'wood'}
        ],
        bombSites: {
            A: { x: 240, z: -278, radius: 20 },
            B: { x: -200, z: -278, radius: 20 }
        },
        spawnPoints: {
            ct: [
                {x: 94, z: -276},
                {x: 90, z: -254},
                {x: 66, z: -260},
                {x: -60, z: -272},
                {x: -40, z: -252}
            ],
            t: [
                {x: -32, z: 246},
                {x: -20, z: 268},
                {x: -40, z: 270},
                {x: 58, z: 250},
                {x: 58, z: 274}
            ]
        }
    }
};

// MapNames 已废弃，使用 MapConfigs 中的 displayName
// 保留此对象用于向后兼容
const MapNames = {};
for (const [mapId, config] of Object.entries(MapConfigs)) {
    MapNames[mapId] = config.displayName || mapId;
}


// 地图创建器
class MapBuilder {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];
    }
    
    // 创建砖墙纹理 - 真实的砖块效果
    createBrickWallTexture(baseColor) {
        const cacheKey = `brick_${baseColor}`;
        if (MapCache.textures[cacheKey]) {
            return MapCache.textures[cacheKey];
        }
        
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
            const offset = (row % 2) * (brickW / 2); // 交错排列
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
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const size = Math.random() * 8 + 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        MapCache.textures[cacheKey] = texture;
        return texture;
    }
    
    // 创建混凝土/水泥墙纹理
    createConcreteTexture(baseColor) {
        const cacheKey = `concrete_${baseColor}`;
        if (MapCache.textures[cacheKey]) {
            return MapCache.textures[cacheKey];
        }
        
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
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const brightness = Math.random() * 40 - 20;
            const nr = Math.min(255, Math.max(0, r + brightness));
            const ng = Math.min(255, Math.max(0, g + brightness));
            const nb = Math.min(255, Math.max(0, b + brightness));
            ctx.fillStyle = `rgb(${Math.floor(nr)},${Math.floor(ng)},${Math.floor(nb)})`;
            ctx.fillRect(x, y, 1, 1);
        }
        
        // 添加裂缝效果
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            let x = Math.random() * 64;
            let y = Math.random() * 64;
            ctx.moveTo(x, y);
            for (let j = 0; j < 5; j++) {
                x += (Math.random() - 0.5) * 15;
                y += Math.random() * 10;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // 添加水渍/污渍
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const w = Math.random() * 15 + 5;
            const h = Math.random() * 20 + 10;
            ctx.beginPath();
            ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);
        MapCache.textures[cacheKey] = texture;
        return texture;
    }
    
    // 创建金属/集装箱纹理
    createMetalTexture(baseColor) {
        const cacheKey = `metal_${baseColor}`;
        if (MapCache.textures[cacheKey]) {
            return MapCache.textures[cacheKey];
        }
        
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
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 6 + 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        MapCache.textures[cacheKey] = texture;
        return texture;
    }
    
    // 创建木箱纹理
    createWoodTexture(baseColor) {
        const cacheKey = `wood_${baseColor}`;
        if (MapCache.textures[cacheKey]) {
            return MapCache.textures[cacheKey];
        }
        
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
        MapCache.textures[cacheKey] = texture;
        return texture;
    }
    
    // 根据颜色和类型选择合适的纹理
    getWallTexture(color, obstacleType = 'default') {
        // 根据颜色判断材质类型
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        
        // 蓝色/灰色 -> 金属/集装箱
        if (b > r && b > g) {
            return this.createMetalTexture(color);
        }
        // 绿色 -> 金属
        if (g > r && g > b) {
            return this.createMetalTexture(color);
        }
        // 黄色/棕色 -> 木箱或砖墙
        if (r > 150 && g > 100 && b < 100) {
            return Math.random() > 0.5 ? this.createWoodTexture(color) : this.createBrickWallTexture(color);
        }
        // 灰色 -> 混凝土
        if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
            return this.createConcreteTexture(color);
        }
        // 默认砖墙
        return this.createBrickWallTexture(color);
    }
    
    // 创建墙壁纹理（带缓存）- 极简砖块纹理（保留作为备用）
    createWallTexture(baseColor) {
        const cacheKey = `wall_${baseColor}`;
        if (MapCache.textures[cacheKey]) {
            return MapCache.textures[cacheKey];
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // 基础颜色
        const r = (baseColor >> 16) & 0xff;
        const g = (baseColor >> 8) & 0xff;
        const b = baseColor & 0xff;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, 16, 16);
        
        // 极简砖块线条
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 16, 8);
        ctx.strokeRect(8, 8, 16, 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);
        MapCache.textures[cacheKey] = texture;
        return texture;
    }
    
    // 创建地板纹理（带缓存）- 带格子纹理
    createFloorTexture(color1, color2) {
        const cacheKey = `floor_${color1}_${color2}`;
        if (MapCache.textures[cacheKey]) {
            return MapCache.textures[cacheKey];
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 基础颜色
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 64, 64);
        
        // 添加格子纹理
        ctx.fillStyle = color2 || color1;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.fillRect(i * 16, j * 16, 16, 16);
                }
            }
        }
        
        // 添加细微的噪点纹理
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            ctx.fillRect(x, y, 1, 1);
        }
        
        // 添加格子线条
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 16, 0);
            ctx.lineTo(i * 16, 64);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * 16);
            ctx.lineTo(64, i * 16);
            ctx.stroke();
        }
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(30, 30);
        
        MapCache.textures[cacheKey] = tex;
        return tex;
    }
    
    // 创建涂鸦纹理
    createGraffitiTexture(text, bgColor, textColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 半透明背景
        ctx.fillStyle = bgColor || 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, 256, 128);
        
        // 涂鸦边框
        ctx.strokeStyle = textColor || '#ff6600';
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, 246, 118);
        
        // 涂鸦文字
        ctx.fillStyle = textColor || '#ff6600';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(text, 128, 64);
        
        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }
    
    // 创建B站UP主涂鸦
    createBilibiliGraffiti() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 粉色背景
        ctx.fillStyle = 'rgba(251, 114, 153, 0.8)';
        ctx.fillRect(0, 0, 256, 128);
        
        // 白色边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, 240, 112);
        
        // B站logo风格文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 2;
        
        ctx.fillText('B站UP主', 128, 40);
        ctx.font = 'bold 28px Arial';
        ctx.fillText('1603366374', 128, 80);
        
        // 添加小装饰
        ctx.font = '16px Arial';
        ctx.fillText('⭐ 关注一下 ⭐', 128, 110);
        
        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }
    
    // 创建随机涂鸦
    createRandomGraffiti() {
        const graffitis = [
            { text: 'CS 1.6', color: '#00ff00', bg: 'rgba(0,50,0,0.7)' },
            { text: 'HEADSHOT!', color: '#ff0000', bg: 'rgba(50,0,0,0.7)' },
            { text: 'GG', color: '#ffff00', bg: 'rgba(50,50,0,0.7)' },
            { text: 'RUSH B!', color: '#ff6600', bg: 'rgba(50,25,0,0.7)' },
            { text: 'NO SCOPE', color: '#00ffff', bg: 'rgba(0,50,50,0.7)' },
            { text: 'ACE', color: '#ff00ff', bg: 'rgba(50,0,50,0.7)' },
            { text: 'CLUTCH', color: '#ffffff', bg: 'rgba(30,30,30,0.7)' },
            { text: 'EZ WIN', color: '#00ff00', bg: 'rgba(0,30,0,0.7)' }
        ];
        
        const g = graffitis[Math.floor(Math.random() * graffitis.length)];
        return this.createGraffitiTexture(g.text, g.bg, g.color);
    }
    
    // 添加涂鸦到墙面 - 作为墙面的贴图层
    addGraffitiToWall(x, y, z, rotationY, scale = 1) {
        // 随机选择涂鸦类型
        const isBilibili = Math.random() < 0.3; // 30%概率是B站涂鸦
        const texture = isBilibili ? this.createBilibiliGraffiti() : this.createRandomGraffiti();
        
        const graffitiGeom = new THREE.PlaneGeometry(8 * scale, 4 * scale);
        const graffitiMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: false
        });
        
        const graffiti = new THREE.Mesh(graffitiGeom, graffitiMat);
        graffiti.position.set(x, y, z);
        graffiti.rotation.y = rotationY;
        this.scene.add(graffiti);
    }
    
    // 获取或创建几何体（带缓存）- 使用立方体代替平面
    getGeometry(w, h, d) {
        // 使用BoxGeometry创建完整的立方体
        const cacheKey = `box_${w}_${h}_${d}`;
        if (!MapCache.geometries[cacheKey]) {
            MapCache.geometries[cacheKey] = new THREE.BoxGeometry(w, h, d);
        }
        return { geom: MapCache.geometries[cacheKey], isBox: true };
    }etry(w, h, d) {
        // 所有墙体都使用平面（单层）
        const planeW = Math.max(w, d);
        const cacheKey = `plane_${planeW}_${h}`;
        if (!MapCache.geometries[cacheKey]) {
            MapCache.geometries[cacheKey] = new THREE.PlaneGeometry(planeW, h);
        }
        return { geom: MapCache.geometries[cacheKey], isPlane: true, faceZ: w <= d };
    }
    
    // 获取或创建材质（带缓存）- 使用纹理
    getMaterial(color) {
        const actualColor = color || 0x888888;
        const cacheKey = `mat_textured_${actualColor}`;
        if (!MapCache.materials[cacheKey]) {
            const texture = this.getWallTexture(actualColor);
            MapCache.materials[cacheKey] = new THREE.MeshLambertMaterial({ 
                map: texture,
                side: THREE.DoubleSide
            });
        }
        return MapCache.materials[cacheKey];
    }
    
    // 根据纹理类型获取材质
    getMaterialByType(color, textureType) {
        const actualColor = color || 0x888888;
        const cacheKey = `mat_${textureType}_${actualColor}`;
        if (!MapCache.materials[cacheKey]) {
            let texture;
            switch (textureType) {
                case 'wood':
                    texture = this.createWoodTexture(actualColor);
                    break;
                case 'brick':
                    texture = this.createBrickWallTexture(actualColor);
                    break;
                case 'concrete':
                    texture = this.createConcreteTexture(actualColor);
                    break;
                case 'metal':
                    texture = this.createMetalTexture(actualColor);
                    break;
                case 'woodDoor':
                    texture = this.createWoodTexture(actualColor);
                    break;
                case 'barrel':
                    texture = this.createMetalTexture(actualColor);
                    break;
                case 'sandbag':
                    texture = this.createConcreteTexture(actualColor);
                    break;
                case 'floor':
                    // 地板纹理 - 使用格子纹理
                    const r = (actualColor >> 16) & 0xff;
                    const g = (actualColor >> 8) & 0xff;
                    const b = actualColor & 0xff;
                    const color1 = `rgb(${r},${g},${b})`;
                    const color2 = `rgb(${Math.floor(r * 0.85)},${Math.floor(g * 0.85)},${Math.floor(b * 0.85)})`;
                    texture = this.createFloorTexture(color1, color2);
                    break;
                default:
                    texture = this.getWallTexture(actualColor);
            }
            MapCache.materials[cacheKey] = new THREE.MeshLambertMaterial({ 
                map: texture,
                side: THREE.DoubleSide
            });
        }
        return MapCache.materials[cacheKey];
    }
    
    // 获取简单颜色材质（用于边界墙）
    getSimpleMaterial(color) {
        const cacheKey = `mat_simple_${color}`;
        if (!MapCache.materials[cacheKey]) {
            const texture = this.createConcreteTexture(color || 0x555555);
            MapCache.materials[cacheKey] = new THREE.MeshLambertMaterial({ 
                map: texture,
                side: THREE.DoubleSide
            });
        }
        return MapCache.materials[cacheKey];
    }
    
    createMap(mapName) {
        const mapConfig = MapConfigs[mapName] || MapConfigs['dust2'];
        
        // 根据地图配置设置大小
        const isIndoor = mapName === 'indoor';
        const mapSize = mapConfig.mapSize || 125;
        const floorSize = mapSize * 2 + 50;
        const boundarySize = mapSize;
        
        // 地板 - 带纹理
        const floorTex = this.createFloorTexture(mapConfig.floorColor1, mapConfig.floorColor2);
        floorTex.repeat.set(floorSize / 16, floorSize / 16);
        
        // 地板几何体缓存
        const floorKey = `floor_${floorSize}`;
        if (!MapCache.geometries[floorKey]) {
            MapCache.geometries[floorKey] = new THREE.PlaneGeometry(floorSize, floorSize);
        }
        
        const floor = new THREE.Mesh(
            MapCache.geometries[floorKey], 
            new THREE.MeshLambertMaterial({ map: floorTex })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.name = 'floor'; // 标记为地板，用于弹孔检测
        this.scene.add(floor);
        
        const self = this;
        const createWall = (x, y, z, w, h, d, color = null, rotation = 0, isBoundary = false, textureType = null) => {
            const geomInfo = self.getGeometry(w, h, d);
            let mat;
            if (isBoundary) {
                mat = self.getSimpleMaterial(color);
            } else if (textureType) {
                // 使用指定的纹理类型
                mat = self.getMaterialByType(color, textureType);
            } else {
                mat = self.getMaterial(color);
            }
            const wall = new THREE.Mesh(geomInfo.geom, mat);
            wall.position.set(x, y, z);
            
            if (rotation) {
                wall.rotation.y = rotation;
            }
            self.scene.add(wall);
            
            // 存储碰撞数据
            // 对于旋转的墙壁，存储原始尺寸和旋转角度，碰撞检测时使用OBB
            // 对于非旋转墙壁，使用AABB
            if (rotation && rotation !== 0) {
                // 旋转墙壁：存储中心点和原始尺寸
                self.walls.push({ 
                    mesh: wall, 
                    // 存储为AABB格式的左下角（用于兼容性），但碰撞检测会使用中心点
                    x: x - w/2, 
                    z: z - d/2, 
                    w: w, 
                    d: d, 
                    h: y + h/2,  // 顶部高度
                    hBottom: y - h/2,  // 底部高度
                    rotation: rotation,
                    originalW: w,
                    originalD: d,
                    centerX: x,
                    centerZ: z
                });
            } else {
                // 非旋转墙壁：使用AABB
                self.walls.push({ 
                    mesh: wall, 
                    x: x - w/2, 
                    z: z - d/2, 
                    w: w, 
                    d: d, 
                    h: y + h/2,  // 顶部高度
                    hBottom: y - h/2,  // 底部高度
                    rotation: 0
                });
            }
        };
        
        // 创建屋顶（平面）
        const createRoof = (x, y, z, w, d, color) => {
            if (!MapCache.geometries[`roof_${w}_${d}`]) {
                MapCache.geometries[`roof_${w}_${d}`] = new THREE.PlaneGeometry(w, d);
            }
            const mat = self.getMaterial(color);
            const roof = new THREE.Mesh(MapCache.geometries[`roof_${w}_${d}`], mat);
            roof.position.set(x, y, z);
            roof.rotation.x = -Math.PI / 2;  // 水平放置
            self.scene.add(roof);
        };
        
        // 边界墙 - 使用混凝土纹理
        createWall(0, 15, -boundarySize, boundarySize * 2, 30, 5, 0x555555, 0, true);
        createWall(0, 15, boundarySize, boundarySize * 2, 30, 5, 0x555555, 0, true);
        createWall(-boundarySize, 15, 0, 5, 30, boundarySize * 2, 0x555555, 0, true);
        createWall(boundarySize, 15, 0, 5, 30, boundarySize * 2, 0x555555, 0, true);
        
        // 地图特定障碍物 - 支持新格式(objects)和旧格式(obstacles)
        const mapObjects = mapConfig.objects || mapConfig.obstacles || [];
        mapObjects.forEach(o => {
            createWall(o.x, o.y, o.z, o.w, o.h, o.d, o.color, o.rotation || 0, false, o.textureType);
        });
        
        // 室内竞技场添加整个地图的屋顶
        if (isIndoor) {
            createRoof(0, 30, 0, 250, 250, 0x4a4a4a);
        }
        
        // 添加涂鸦到边界墙 - 紧贴单层墙面
        // 自定义地图不添加自动涂鸦
        const isCustomMap = mapName && mapName.startsWith('custom_');
        if (!isCustomMap) {
            // 北墙涂鸦（墙在 z = -boundarySize）
            this.addGraffitiToWall(-40, 10, -boundarySize + 0.1, 0, 1.2);
            this.addGraffitiToWall(40, 12, -boundarySize + 0.1, 0, 1);
            // 南墙涂鸦（墙在 z = boundarySize）
            this.addGraffitiToWall(-30, 8, boundarySize - 0.1, Math.PI, 1);
            this.addGraffitiToWall(50, 14, boundarySize - 0.1, Math.PI, 1.3);
            // 西墙涂鸦（墙在 x = -boundarySize）
            this.addGraffitiToWall(-boundarySize + 0.1, 10, -20, Math.PI / 2, 1);
            this.addGraffitiToWall(-boundarySize + 0.1, 12, 40, Math.PI / 2, 1.1);
            // 东墙涂鸦（墙在 x = boundarySize）
            this.addGraffitiToWall(boundarySize - 0.1, 8, 0, -Math.PI / 2, 1.2);
            this.addGraffitiToWall(boundarySize - 0.1, 15, -50, -Math.PI / 2, 1);
            
            // 在内部建筑墙上也添加涂鸦
            if (mapConfig.obstacles.length > 0) {
                // 随机选择几个障碍物添加涂鸦
                const numGraffitis = Math.min(6, mapConfig.obstacles.length);
                const usedIndices = new Set();
                
                for (let i = 0; i < numGraffitis; i++) {
                    let idx;
                    do {
                        idx = Math.floor(Math.random() * mapConfig.obstacles.length);
                    } while (usedIndices.has(idx) && usedIndices.size < mapConfig.obstacles.length);
                    usedIndices.add(idx);
                    
                    const o = mapConfig.obstacles[idx];
                    // 根据墙的朝向添加涂鸦 - 紧贴单层墙面
                    if (o.w > o.d) {
                        // 宽墙，涂鸦在前后
                        const side = Math.random() > 0.5 ? 1 : -1;
                        this.addGraffitiToWall(o.x, o.y, o.z + 0.1 * side, side > 0 ? 0 : Math.PI, 0.8);
                    } else {
                        // 深墙，涂鸦在左右
                        const side = Math.random() > 0.5 ? 1 : -1;
                        this.addGraffitiToWall(o.x + 0.1 * side, o.y, o.z, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0.8);
                    }
                }
            }
        }
        
        this.scene.background = new THREE.Color(mapConfig.skyColor);
        
        // 添加包点涂鸦和动画（爆破模式地图）
        if (mapConfig.bombSites) {
            this.createBombSiteMarkers(mapConfig.bombSites);
        }
        
        // 室内地图不需要雾效 - 统一移除所有地图的雾效
        this.scene.fog = null;
        
        return this.walls;
    }
    
    // 创建包点涂鸦和动画效果
    createBombSiteMarkers(bombSites) {
        // A点涂鸦
        if (bombSites.A) {
            this.createSiteGraffiti('A', bombSites.A.x, bombSites.A.z, '#ff6600');
            this.createBombSiteAnimation(bombSites.A.x, bombSites.A.z, bombSites.A.radius, '#ff6600');
        }
        
        // B点涂鸦
        if (bombSites.B) {
            this.createSiteGraffiti('B', bombSites.B.x, bombSites.B.z, '#ff6600');
            this.createBombSiteAnimation(bombSites.B.x, bombSites.B.z, bombSites.B.radius, '#ff6600');
        }
    }
    
    // 创建包点涂鸦
    createSiteGraffiti(siteName, x, z, color) {
        // 创建涂鸦纹理
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // 透明背景
        ctx.clearRect(0, 0, 256, 256);
        
        // 绘制大字母
        ctx.fillStyle = color;
        ctx.font = 'bold 180px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.fillText(siteName, 128, 128);
        
        // 添加边框效果
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeText(siteName, 128, 128);
        
        // 添加装饰圆圈
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(128, 128, 110, 0, Math.PI * 2);
        ctx.stroke();
        
        const texture = new THREE.CanvasTexture(canvas);
        
        // 创建地面涂鸦
        const graffitiGeom = new THREE.PlaneGeometry(30, 30);
        const graffitiMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const graffiti = new THREE.Mesh(graffitiGeom, graffitiMat);
        graffiti.position.set(x, 0.1, z);
        graffiti.rotation.x = -Math.PI / 2;
        this.scene.add(graffiti);
    }
    
    // 创建包点动画效果（脉冲圆环）
    createBombSiteAnimation(x, z, radius, color) {
        // 创建多个圆环
        const rings = [];
        for (let i = 0; i < 3; i++) {
            const ringGeom = new THREE.RingGeometry(radius * 0.8, radius, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.set(x, 0.05 + i * 0.02, z);
            ring.rotation.x = -Math.PI / 2;
            ring.userData.phase = i * (Math.PI * 2 / 3);
            ring.userData.baseOpacity = 0.3;
            this.scene.add(ring);
            rings.push(ring);
        }
        
        // 动画更新函数
        const animateRings = () => {
            const time = Date.now() / 1000;
            rings.forEach((ring, i) => {
                const phase = ring.userData.phase;
                const pulse = Math.sin(time * 2 + phase) * 0.5 + 0.5;
                ring.material.opacity = ring.userData.baseOpacity * (0.5 + pulse * 0.5);
                ring.scale.set(0.9 + pulse * 0.2, 0.9 + pulse * 0.2, 1);
            });
            requestAnimationFrame(animateRings);
        };
        animateRings();
        
        // 创建中心发光点
        const glowGeom = new THREE.CircleGeometry(5, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.set(x, 0.08, z);
        glow.rotation.x = -Math.PI / 2;
        this.scene.add(glow);
        
        // 发光点动画
        const animateGlow = () => {
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 3) * 0.5 + 0.5;
            glow.material.opacity = 0.3 + pulse * 0.4;
            glow.scale.set(1 + pulse * 0.3, 1 + pulse * 0.3, 1);
            requestAnimationFrame(animateGlow);
        };
        animateGlow();
    }
}

// 预加载所有地图资源
function preloadAllMaps(onProgress, onComplete) {
    const mapNames = Object.keys(MapConfigs);
    const totalMaps = mapNames.length;
    let loadedMaps = 0;
    
    console.log('🎮 开始预加载地图资源...');
    
    // 创建临时场景用于预加载
    const tempScene = new THREE.Scene();
    const tempBuilder = new MapBuilder(tempScene);
    
    // 预加载地板几何体
    if (!MapCache.geometries['floor']) {
        MapCache.geometries['floor'] = new THREE.PlaneGeometry(500, 500);
    }
    
    // 预加载每个地图的资源
    mapNames.forEach((mapName) => {
        const mapConfig = MapConfigs[mapName];
        
        // 预加载地板纹理
        tempBuilder.createFloorTexture(mapConfig.floorColor1, mapConfig.floorColor2);
        
        // 预加载边界墙资源
        tempBuilder.getGeometry(250, 30, 5);
        tempBuilder.getGeometry(5, 30, 250);
        tempBuilder.getMaterial(0x555555);
        
        // 预加载障碍物资源
        mapConfig.obstacles.forEach(o => {
            tempBuilder.getGeometry(o.w, o.h, o.d);
            if (o.color) tempBuilder.getMaterial(o.color);
        });
        
        loadedMaps++;
        const progress = Math.round((loadedMaps / totalMaps) * 100);
        console.log(`📦 预加载地图: ${mapName} (${progress}%)`);
        
        if (onProgress) {
            onProgress(progress, mapName);
        }
    });
    
    MapCache.isPreloaded = true;
    console.log('✅ 所有地图资源预加载完成!');
    console.log(`   - 纹理缓存: ${Object.keys(MapCache.textures).length} 个`);
    console.log(`   - 几何体缓存: ${Object.keys(MapCache.geometries).length} 个`);
    console.log(`   - 材质缓存: ${Object.keys(MapCache.materials).length} 个`);
    
    if (onComplete) {
        onComplete();
    }
}

// 检查是否已预加载
function isMapPreloaded() {
    return MapCache.isPreloaded;
}

// 获取指定游戏模式支持的地图列表
function getMapsForGameMode(gameMode) {
    const maps = [];
    for (const [mapId, config] of Object.entries(MapConfigs)) {
        if (config.gameMode && config.gameMode.includes(gameMode)) {
            maps.push({
                id: mapId,
                name: config.displayName || mapId
            });
        }
    }
    return maps;
}

// 动态更新地图选择下拉框
function updateMapSelect(selectElement, gameMode) {
    const maps = getMapsForGameMode(gameMode);
    selectElement.innerHTML = '';
    maps.forEach((map, index) => {
        const option = document.createElement('option');
        option.value = map.id;
        option.textContent = map.name;
        if (index === 0) option.selected = true;
        selectElement.appendChild(option);
    });
}

// 初始化地图选择（页面加载时调用）
function initMapSelect() {
    const mapSelect = document.getElementById('mapSelect');
    const gameModeSelect = document.getElementById('gameMode');
    
    if (mapSelect && gameModeSelect) {
        // 初始更新
        updateMapSelect(mapSelect, gameModeSelect.value);
        
        // 监听游戏模式变化
        gameModeSelect.addEventListener('change', () => {
            updateMapSelect(mapSelect, gameModeSelect.value);
        });
    }
}
