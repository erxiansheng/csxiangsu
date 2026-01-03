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
        
        if (value === undefined) {
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

        if (!mapData.name) {
            return new Response(JSON.stringify({ error: '缺少地图名称' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const mapId = mapData.name;
        const now = new Date().toISOString();
        mapData.updatedAt = now;

        // 保存地图数据
        await edgeKV.put('map:' + mapId, JSON.stringify(mapData));

        // 更新索引
        let indexData = await edgeKV.get('maps:index', { type: 'json' });
        if (indexData === undefined) {
            indexData = [];
        }
        
        const existingIndex = indexData.findIndex(m => m.id === mapId);
        const mapMeta = {
            id: mapId,
            name: mapId,
            displayName: mapData.displayName || mapId,
            updatedAt: now
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
