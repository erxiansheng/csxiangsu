/**
 * ESA 边缘函数 - 统一入口
 * 处理所有 /api/* 请求
 */

const NAMESPACE = 'game-maps';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 处理 CORS 预检请求
    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // GET /api/maps - 获取地图列表
    if (path === '/api/maps' && method === 'GET') {
        return getMapList();
    }

    // POST /api/maps - 保存地图
    if (path === '/api/maps' && method === 'POST') {
        return saveMap(request);
    }

    // 匹配 /api/maps/:id
    const mapMatch = path.match(/^\/api\/maps\/([^\/]+)$/);
    if (mapMatch) {
        const mapId = decodeURIComponent(mapMatch[1]);

        // GET /api/maps/:id - 获取单个地图
        if (method === 'GET') {
            return getMap(mapId);
        }

        // DELETE /api/maps/:id - 删除地图
        if (method === 'DELETE') {
            return deleteMap(mapId);
        }
    }

    // 未匹配的 API 路由
    return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: corsHeaders
    });
}

// 获取地图列表
async function getMapList() {
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

// 获取单个地图
async function getMap(mapId) {
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

// 保存地图
async function saveMap(request) {
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

// 删除地图
async function deleteMap(mapId) {
    try {
        const edgeKV = new EdgeKV({ namespace: NAMESPACE });
        const result = await edgeKV.delete('map:' + mapId);

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

export default {
    fetch: handleRequest
};
