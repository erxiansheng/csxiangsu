/**
 * ESA 边缘函数 - 单个地图 API
 * 路由: GET/DELETE /api/maps/:id
 */

const NAMESPACE = 'game-maps';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

async function handleRequest(request) {
    const method = request.method;

    // 处理 CORS 预检请求
    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // 从 URL 中提取 mapId
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const mapId = decodeURIComponent(pathParts[pathParts.length - 1]);

    if (!mapId) {
        return new Response(JSON.stringify({ error: '缺少地图ID' }), {
            status: 400,
            headers: corsHeaders
        });
    }

    if (method === 'GET') {
        return handleGet(mapId);
    } else if (method === 'DELETE') {
        return handleDelete(mapId);
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: corsHeaders
    });
}

// 获取单个地图
async function handleGet(mapId) {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const value = await edgeKV.get('map:' + mapId, { type: 'json' });

        if (value === undefined) {
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

// 删除地图
async function handleDelete(mapId) {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const result = await edgeKV.delete('map:' + mapId);

        if (result) {
            // 更新索引
            let indexData = await edgeKV.get('maps:index', { type: 'json' });
            if (indexData && Array.isArray(indexData)) {
                indexData = indexData.filter(m => m.id !== mapId);
                await edgeKV.put('maps:index', JSON.stringify(indexData));
            }

            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } else {
            return new Response(JSON.stringify({ error: '地图不存在或删除失败' }), {
                status: 404,
                headers: corsHeaders
            });
        }
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
