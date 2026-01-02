/**
 * ESA Pages 函数 - 地图 API
 * 路由: GET/POST /api/maps
 * 使用 EdgeKV 边缘存储
 */

const NAMESPACE = 'game-maps';

// 获取地图列表
async function handleGet() {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        
        // 获取索引数据
        const indexData = await edgeKV.get('maps:index', { type: 'json' });
        
        if (indexData === undefined) {
            return new Response(JSON.stringify([]), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 按更新时间倒序排列
        const maps = indexData.sort((a, b) => {
            if (!a.updatedAt) return 1;
            if (!b.updatedAt) return -1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        return new Response(JSON.stringify(maps), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: '获取列表失败: ' + e }), {
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

        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const mapId = mapData.name;
        const now = new Date().toISOString();
        mapData.updatedAt = now;

        // 保存地图数据
        const putResult = await edgeKV.put(`map:${mapId}`, JSON.stringify(mapData));
        
        if (putResult !== undefined) {
            return new Response(JSON.stringify({ error: '保存地图数据失败' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 更新索引
        let indexData = await edgeKV.get('maps:index', { type: 'json' }) || [];
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
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: '保存失败: ' + e }), {
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
