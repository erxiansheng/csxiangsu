/**
 * ESA Pages 函数 - 单个地图 API
 * 路由: GET/DELETE /api/maps/:id
 * 使用 EdgeKV 边缘存储
 */

const NAMESPACE = 'game-maps';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

// 获取单个地图
async function handleGet(mapId) {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const data = await edgeKV.get(`map:${mapId}`, { type: 'json' });

        if (data === undefined) {
            return new Response(JSON.stringify({ error: '地图不存在' }), {
                status: 404,
                headers: corsHeaders
            });
        }

        return new Response(JSON.stringify(data), { headers: corsHeaders });
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
        
        // delete 成功返回 true，失败返回 false
        const result = await edgeKV.delete(`map:${mapId}`);

        if (result) {
            // 更新索引
            let indexData = await edgeKV.get('maps:index', { type: 'json' });
            if (indexData !== undefined) {
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

export async function onRequest(context) {
    const mapId = context.params.id;

    // 处理 CORS 预检请求
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (!mapId) {
        return new Response(JSON.stringify({ error: '缺少地图ID' }), {
            status: 400,
            headers: corsHeaders
        });
    }

    if (context.request.method === 'GET') {
        return handleGet(mapId);
    } else if (context.request.method === 'DELETE') {
        return handleDelete(mapId);
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: corsHeaders
    });
}
