/**
 * ESA Pages 函数 - 单个地图 API
 * 路由: GET/DELETE /api/maps/:id
 * 使用 EdgeKV 边缘存储
 */

const NAMESPACE = 'game-maps';

// 获取单个地图
async function handleGet(mapId) {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const data = await edgeKV.get(`map:${mapId}`, { type: 'json' });

        if (data === undefined) {
            return new Response(JSON.stringify({ error: '地图不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: '获取地图失败: ' + e }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 删除地图
async function handleDelete(mapId) {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const result = await edgeKV.delete(`map:${mapId}`);

        if (result) {
            // 更新索引
            let indexData = await edgeKV.get('maps:index', { type: 'json' }) || [];
            indexData = indexData.filter(m => m.id !== mapId);
            await edgeKV.put('maps:index', JSON.stringify(indexData));

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ error: '删除失败' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: '删除失败: ' + e }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequest(context) {
    const mapId = context.params.id;

    if (!mapId) {
        return new Response(JSON.stringify({ error: '缺少地图ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const method = context.request.method;

    if (method === 'GET') {
        return handleGet(mapId);
    } else if (method === 'DELETE') {
        return handleDelete(mapId);
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
}
