/**
 * ESA Pages 函数 - 地图 API
 * 路由: GET/POST /api/maps
 */

const NAMESPACE = 'game-maps';

export async function onRequest(context) {
    const method = context.request.method;

    try {
        const kv = KV(NAMESPACE);

        if (method === 'GET') {
            // 获取地图列表
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
        }

        if (method === 'POST') {
            // 保存地图
            const mapData = await context.request.json();

            if (!mapData.name) {
                return new Response(JSON.stringify({ error: '缺少地图名称' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

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
        }

        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
