/**
 * ESA 边缘函数 - 地图列表 API
 * 路由: GET/POST /api/maps
 */

const NAMESPACE = 'game-maps';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

// 从环境变量获取保存密码
function getSavePassword() {
    return process.env.SAVE_PASSWORD || '123';
}

async function handleRequest(request) {
    const method = request.method;

    // 处理 CORS 预检请求
    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
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

// 保存地图
async function handlePost(request) {
    try {
        const mapData = await request.json();

        // 验证密码（从环境变量获取）
        if (mapData.password !== getSavePassword()) {
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
