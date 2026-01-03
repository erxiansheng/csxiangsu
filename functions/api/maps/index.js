/**
 * ESA 边缘函数 - 地图列表 API
 * 路由: GET/POST /api/maps
 * 
 * 环境变量:
 * - SAVE_PASSWORD: 保存地图的密码（在ESA控制台配置）
 */

const NAMESPACE = 'game-maps';

// 从环境变量获取保存密码，默认值为 '123'（内测阶段）
const SAVE_PASSWORD = process.env.SAVE_PASSWORD || '123';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

async function handleRequest(request) {
    const method = request.method;

    // 处理 CORS 预检请求
    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // 检查是否是点赞请求 (POST /api/maps/like)
    const url = new URL(request.url);
    if (method === 'POST' && url.pathname.endsWith('/like')) {
        return handleLike(request);
    }

    if (method === 'GET') {
        return handleGet();
    } else if (method === 'POST') {
        return handlePost(request);
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: corsHeaders
    });
}

// 获取地图列表
async function handleGet() {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const value = await edgeKV.get('maps:index', { type: 'json' });
        
        if (!value || !Array.isArray(value)) {
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

// 点赞地图
async function handleLike(request) {
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
async function handlePost(request) {
    try {
        const mapData = await request.json();

        // 验证密码
        if (!mapData.password || mapData.password !== SAVE_PASSWORD) {
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
        
        // 获取现有地图数据以保留点赞数
        let existingMap = null;
        try {
            existingMap = await edgeKV.get('map:' + mapId, { type: 'json' });
        } catch (e) {}
        
        // 保留点赞数，删除密码字段
        delete mapData.password;
        mapData.updatedAt = now;
        mapData.likes = existingMap?.likes || 0;

        // 保存地图数据
        await edgeKV.put('map:' + mapId, JSON.stringify(mapData));

        // 更新索引
        let indexData = await edgeKV.get('maps:index', { type: 'json' });
        if (!indexData || !Array.isArray(indexData)) {
            indexData = [];
        }
        
        const existingIndex = indexData.findIndex(m => m.id === mapId);
        const mapMeta = {
            id: mapId,
            name: mapId,
            displayName: mapData.displayName || mapId,
            updatedAt: now,
            likes: mapData.likes || 0,
            thumbnail: mapData.thumbnail || null
        };

        if (existingIndex >= 0) {
            indexData[existingIndex] = mapMeta;
        } else {
            indexData.push(mapMeta);
        }

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
