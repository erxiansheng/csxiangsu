/**
 * ESA Pages 函数 - 单个地图 API
 * 路由: GET/DELETE /api/maps/:id
 */

const NAMESPACE = 'game-maps';

// 获取单个地图
async function handleGet(mapId) {
    try {
        const kv = KV(NAMESPACE);
        const data = await kv.get(`map:${mapId}`, { type: 'json' });

        if (!data) {
            return new Response(JSON.stringify({ error: '地图不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: '获取地图失败: ' + err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 删除地图
async function handleDelete(mapId) {
    try {
        const kv = KV(NAMESPACE);
        await kv.delete(`map:${mapId}`);

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: '删除失败: ' + err.message }), {
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
