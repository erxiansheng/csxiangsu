/**
 * ESA 边缘函数 - 统一入口
 * 处理所有 /api/* 请求
 */

const NAMESPACE = 'game-maps';
// 默认密码（作为后备值）
const DEFAULT_SAVE_PASSWORD = '123';
// 默认删除密码（作为后备值）
const DEFAULT_DELETE_PASSWORD = 'admin123';
// 默认公告（作为后备值）
const DEFAULT_ANNOUNCEMENTS = [
    {"date": "2025-12-28", "content": "🎉 欢迎来到 CS 1.6 像素版！"},
    {"date": "2025-12-28", "content": "🔫 新增武器：AK47、M4A1、AWP"}
];
// 默认 WebSocket 服务器地址（作为后备值）
const DEFAULT_WS_SERVER_URL = 'wss://cs16xs.188np.cn';
// 默认公开房间配置（作为后备值）
const DEFAULT_PUBLIC_ROOMS = [
    { id: 'DEFUSE01', mode: 'defuse', map: 'dust2' },
    { id: 'DEFUSE02', mode: 'defuse', map: 'dust2' },
    { id: 'DEFUSE03', mode: 'defuse', map: 'dust2' },
    { id: 'TEAM0001', mode: 'deathmatch', map: 'indoor' },
    { id: 'TEAM0002', mode: 'deathmatch', map: 'indoor' },
    { id: 'TEAM0003', mode: 'deathmatch', map: 'indoor' }
];

// 从 KV 读取保存密码
async function getSavePassword() {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const password = await edgeKV.get('SAVE_PASSWORD', { type: 'text' });
        // 清理可能的引号（如果 KV 中存储的是 JSON 字符串）
        if (password) {
            const cleanPassword = password.trim().replace(/^["']|["']$/g, '');
            return cleanPassword || DEFAULT_SAVE_PASSWORD;
        }
        return DEFAULT_SAVE_PASSWORD;
    } catch (e) {
        return DEFAULT_SAVE_PASSWORD;
    }
}

// 从 KV 读取删除密码
async function getDeletePassword() {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const password = await edgeKV.get('DELETE_PASSWORD', { type: 'text' });
        // 清理可能的引号
        if (password) {
            const cleanPassword = password.trim().replace(/^["']|["']$/g, '');
            return cleanPassword || DEFAULT_DELETE_PASSWORD;
        }
        return DEFAULT_DELETE_PASSWORD;
    } catch (e) {
        return DEFAULT_DELETE_PASSWORD;
    }
}

// 从 KV 读取游戏公告
async function getAnnouncements() {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const announcements = await edgeKV.get('ANNOUNCEMENTS', { type: 'json' });
        console.log('[ESA Function] 从 KV 读取的公告:', announcements);
        
        // 如果读取到的是数组，直接返回
        if (Array.isArray(announcements)) {
            return announcements;
        }
        
        // 如果读取失败或不是数组，返回默认值
        console.log('[ESA Function] 公告数据无效，使用默认值');
        return DEFAULT_ANNOUNCEMENTS;
    } catch (e) {
        console.error('[ESA Function] 读取公告失败:', e);
        return DEFAULT_ANNOUNCEMENTS;
    }
}

// 从 KV 读取默认 WebSocket 服务器地址
async function getDefaultWSServerURL() {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const url = await edgeKV.get('DEFAULT_WS_SERVER_URL', { type: 'text' });
        // 清理可能的引号（如果 KV 中存储的是 JSON 字符串）
        if (url) {
            const cleanUrl = url.trim().replace(/^["']|["']$/g, '');
            return cleanUrl || DEFAULT_WS_SERVER_URL;
        }
        return DEFAULT_WS_SERVER_URL;
    } catch (e) {
        return DEFAULT_WS_SERVER_URL;
    }
}

// 从 KV 读取公开房间配置
async function getPublicRooms() {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const rooms = await edgeKV.get('PUBLIC_ROOMS', { type: 'json' });
        console.log('[ESA Function] 从 KV 读取的公开房间:', rooms);
        
        // 如果读取到的是数组，直接返回
        if (Array.isArray(rooms)) {
            return rooms;
        }
        
        // 如果读取失败或不是数组，返回默认值
        console.log('[ESA Function] 公开房间数据无效，使用默认值');
        return DEFAULT_PUBLIC_ROOMS;
    } catch (e) {
        console.error('[ESA Function] 读取公开房间失败:', e);
        return DEFAULT_PUBLIC_ROOMS;
    }
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 处理 CORS 预检请求
    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // GET /api/config - 获取配置（服务器地址、公开房间）
    if (path === '/api/config' && method === 'GET') {
        return getConfigAPI();
    }

    // GET /api/announcements - 获取游戏公告
    if (path === '/api/announcements' && method === 'GET') {
        return getAnnouncementsAPI();
    }

    // GET /api/maps - 获取地图列表
    if (path === '/api/maps' && method === 'GET') {
        return getMapList();
    }

    // POST /api/maps - 保存地图
    if (path === '/api/maps' && method === 'POST') {
        return saveMap(request);
    }
    
    // POST /api/maps/like - 点赞地图
    if (path === '/api/maps/like' && method === 'POST') {
        return likeMap(request);
    }

    // 匹配 /api/maps/:id
    const mapMatch = path.match(/^\/api\/maps\/([^\/]+)$/);
    if (mapMatch) {
        const mapId = decodeURIComponent(mapMatch[1]);

        // GET /api/maps/:id - 获取单个地图
        if (method === 'GET') {
            return getMap(mapId);
        }

        // DELETE /api/maps/:id - 删除地图（需要管理员密码）
        if (method === 'DELETE') {
            return deleteMap(mapId, request);
        }
    }

    // 未匹配的 API 路由
    return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: corsHeaders
    });
}

// 获取配置 API
async function getConfigAPI() {
    try {
        const wsServerURL = await getDefaultWSServerURL();
        const publicRooms = await getPublicRooms();
        return new Response(JSON.stringify({ 
            wsServerURL: wsServerURL,
            publicRooms: publicRooms
        }), { headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify({ error: '获取配置失败: ' + e }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// 获取游戏公告 API
async function getAnnouncementsAPI() {
    try {
        const announcements = await getAnnouncements();
        return new Response(JSON.stringify(announcements), { headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify({ error: '获取公告失败: ' + e }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// 获取地图列表
async function getMapList() {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const value = await edgeKV.get('maps:index', { type: 'json' });
        
        // key 不存在时可能返回 undefined 或 null
        if (!value) {
            return new Response(JSON.stringify([]), { headers: corsHeaders });
        }

        const maps = value.sort((a, b) => {
            if (!a.updatedAt) return 1;
            if (!b.updatedAt) return -1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        return new Response(JSON.stringify(maps), { headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify({ error: '获取列表失败: ' + e }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// 获取单个地图
async function getMap(mapId) {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const value = await edgeKV.get('map:' + mapId, { type: 'json' });

        if (!value) {
            return new Response(JSON.stringify({ error: '地图不存在' }), {
                status: 404,
                headers: corsHeaders
            });
        }

        return new Response(JSON.stringify(value), { headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify({ error: '获取地图失败: ' + e }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// 点赞地图
async function likeMap(request) {
    try {
        const data = await request.json();
        const mapId = data.mapId;
        
        if (!mapId) {
            return new Response(JSON.stringify({ error: '缺少地图ID' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const mapData = await edgeKV.get('map:' + mapId, { type: 'json' });

        if (!mapData) {
            return new Response(JSON.stringify({ error: '地图不存在' }), {
                status: 404,
                headers: corsHeaders
            });
        }

        // 增加点赞数
        mapData.likes = (mapData.likes || 0) + 1;
        await edgeKV.put('map:' + mapId, JSON.stringify(mapData));

        // 更新索引中的点赞数
        let indexData = await edgeKV.get('maps:index', { type: 'json' });
        if (indexData && Array.isArray(indexData)) {
            const idx = indexData.findIndex(m => m.id === mapId);
            if (idx >= 0) {
                indexData[idx].likes = mapData.likes;
                await edgeKV.put('maps:index', JSON.stringify(indexData));
            }
        }

        return new Response(JSON.stringify({ success: true, likes: mapData.likes }), { headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify({ error: '点赞失败: ' + e }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// 保存地图
async function saveMap(request) {
    try {
        const mapData = await request.json();
        
        // 从 KV 读取密码并验证
        const SAVE_PASSWORD = await getSavePassword();
        if (!mapData.password || String(mapData.password).trim() !== SAVE_PASSWORD) {
            return new Response(JSON.stringify({ error: '密码错误' }), {
                status: 403,
                headers: corsHeaders
            });
        }

        if (!mapData.name) {
            return new Response(JSON.stringify({ error: '缺少地图名称' }), {
                status: 400,
                headers: corsHeaders
            });
        }
        
        // 校验地图ID格式（只允许字母、数字、下划线、中划线）
        const mapIdRegex = /^[a-zA-Z0-9_-]+$/;
        if (!mapIdRegex.test(mapData.name)) {
            return new Response(JSON.stringify({ error: '地图ID只能包含字母、数字、下划线和中划线' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const mapId = mapData.name;
        const now = new Date().toISOString();
        
        // 检查地图是否已存在
        let existingMap = null;
        try {
            existingMap = await edgeKV.get('map:' + mapId, { type: 'json' });
        } catch (e) {}
        
        // 如果地图已存在，返回错误（不允许覆盖）
        if (existingMap) {
            return new Response(JSON.stringify({ error: '地图ID已存在，请使用其他名称' }), {
                status: 409,
                headers: corsHeaders
            });
        }
        
        // 删除密码字段
        delete mapData.password;
        mapData.updatedAt = now;
        mapData.likes = 0;

        // 保存地图数据
        await edgeKV.put('map:' + mapId, JSON.stringify(mapData));

        // 更新索引
        let indexData = await edgeKV.get('maps:index', { type: 'json' });
        if (!indexData) {
            indexData = [];
        }
        
        const mapMeta = {
            id: mapId,
            name: mapId,
            displayName: mapData.displayName || mapId,
            updatedAt: now,
            likes: 0,
            thumbnail: mapData.thumbnail || null
        };

        indexData.push(mapMeta);
        await edgeKV.put('maps:index', JSON.stringify(indexData));

        return new Response(JSON.stringify({
            success: true,
            id: mapId,
            updatedAt: now
        }), { headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify({ error: '保存失败: ' + e }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// 删除地图
async function deleteMap(mapId, request) {
    try {
        // 从请求体读取密码
        const data = await request.json();
        
        // 从 KV 读取删除密码并验证
        const DELETE_PASSWORD = await getDeletePassword();
        if (!data.password || String(data.password).trim() !== DELETE_PASSWORD) {
            return new Response(JSON.stringify({ error: '管理员密码错误' }), {
                status: 403,
                headers: corsHeaders
            });
        }

        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        
        // 检查地图是否存在
        let existingMap = null;
        try {
            existingMap = await edgeKV.get('map:' + mapId, { type: 'json' });
        } catch (e) {}
        
        if (!existingMap) {
            return new Response(JSON.stringify({ error: '地图不存在' }), {
                status: 404,
                headers: corsHeaders
            });
        }
        
        // 删除地图数据
        await edgeKV.delete('map:' + mapId);

        // 从索引中移除
        let indexData = await edgeKV.get('maps:index', { type: 'json' });
        if (indexData && Array.isArray(indexData)) {
            indexData = indexData.filter(m => m.id !== mapId);
            await edgeKV.put('maps:index', JSON.stringify(indexData));
        }

        return new Response(JSON.stringify({
            success: true,
            message: '地图已删除'
        }), { headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify({ error: '删除失败: ' + e }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export default {
    fetch: handleRequest
};
