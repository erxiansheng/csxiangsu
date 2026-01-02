// 地图云存储服务 - 阿里云 ESA KV 存储
const MapCloudService = {
    // API 基础路径（同域部署，使用相对路径）
    basePath: '/api/maps',

    // 获取所有云端地图列表
    async listMaps() {
        try {
            const res = await fetch(this.basePath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('获取地图列表失败:', err);
            throw new Error('无法连接到云端服务');
        }
    },

    // 获取单个地图数据
    async getMap(mapId) {
        try {
            const res = await fetch(`${this.basePath}/${encodeURIComponent(mapId)}`);
            if (res.status === 404) throw new Error('地图不存在');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('获取地图失败:', err);
            throw err;
        }
    },

    // 保存地图到云端
    async saveMap(mapData) {
        try {
            const res = await fetch(this.basePath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mapData)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('保存地图失败:', err);
            throw new Error('保存失败，请检查网络连接');
        }
    },

    // 删除云端地图
    async deleteMap(mapId) {
        try {
            const res = await fetch(`${this.basePath}/${encodeURIComponent(mapId)}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('删除地图失败:', err);
            throw new Error('删除失败，请检查网络连接');
        }
    }
};

// 导出供其他模块使用
if (typeof window !== 'undefined') {
    window.MapCloudService = MapCloudService;
}
