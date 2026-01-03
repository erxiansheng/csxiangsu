/**
 * ESA 边缘函数 - 地图点赞 API
 * 路由: POST /api/maps/like
 */

const NAMESPACE = 'game-maps';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

async function handleRequest(request) {
    const method = request.method;

    // 处理 CORS 预检请求
    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (method === 'POST') {
        return handleLike(request);
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: corsHeaders
    });
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

export default {
    fetch: handleRequest
};
