/**
 * ESA 边缘函数 - 统一入口
 * 处理所有 /api/* 请求
 */

const NAMESPACE = 'game-maps';
const SAVE_PASSWORD = process.env.SAVE_PASSWORD || '123'; // 优先使用环境变量，默认123

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

        // DELETE /api/maps/:id - 删除地图（已禁用）
        // if (method === 'DELETE') {
        //     return deleteMap(mapId);
        // }
    }

    // 未匹配的 API 路由
    return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: corsHeaders
    });
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
        
        // 验证密码 - 严格比较
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

export default {
    fetch: handleRequest
};
