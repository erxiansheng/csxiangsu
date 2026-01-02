/**
 * ESA Pages 函数 - 地图 API
 * 路由: GET/POST /api/maps
 */

const NAMESPACE = 'game-maps';

// 获取地图列表
async function handleGet() {
    try {
        // ESA 边缘函数使用全局 KV 对象，通过命名空间名称访问
        const kv = KV(NAMESPACE);
        const listResult = await kv.list({ prefix: 'map:' });
        const maps = [];

        if (listResult && listResult.keys) {
            for (const key of listResult.keys) {
                const mapData = await kv.get(key.name, { type: 'json' });
                if (mapData) {
                    maps.push({
                        id: key.name.replace('map:', ''),
                        name: mapData.name || key.name.replace('map:', ''),
                        displayName: mapData.displayName || '未命名地图',
                        updatedAt: mapData.updatedAt
                    });
                }
            }
        }

        maps.sort((a, b) => {
            if (!a.updatedAt) return 1;
            if (!b.updatedAt) return -1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        return new Response(JSON.stringify(maps), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: '获取列表失败: ' + err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
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
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const kv = KV(NAMESPACE);
        const mapId = mapData.name;
        const now = new Date().toISOString();
        mapData.updatedAt = now;

        await kv.put(`map:${mapId}`, JSON.stringify(mapData));

        return new Response(JSON.stringify({
            success: true,
            id: mapId,
            updatedAt: now
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: '保存失败: ' + err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequest(context) {
    const method = context.request.method;

    if (method === 'GET') {
        return handleGet();
    } else if (method === 'POST') {
        return handlePost(context.request);
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
}
