// 小地图模块

class Minimap {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.size = 180;
        this.playerSize = 6;
        this.init();
    }
    
    init() {
        // 创建小地图容器
        const container = document.createElement('div');
        container.id = 'minimap-container';
        container.innerHTML = `
            <canvas id="minimap-canvas" width="${this.size}" height="${this.size}"></canvas>
            <div id="minimap-labels">
                <span class="site-label" id="minimap-site-a">A</span>
                <span class="site-label" id="minimap-site-b">B</span>
            </div>
        `;
        document.getElementById('game').appendChild(container);
        
        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    // 世界坐标转小地图坐标（以地图中心为原点，固定北向上）
    worldToMinimap(worldX, worldZ) {
        const mapSize = this.game.selectedMap === 'dust2' ? 300 : 125;
        const centerOffset = this.size / 2;
        const scale = this.size / (mapSize * 2);
        
        // 直接映射：世界X -> 小地图X，世界Z -> 小地图Y（取反使北朝上）
        return {
            x: centerOffset + worldX * scale,
            y: centerOffset + worldZ * scale
        };
    }
    
    // 计算玩家在小地图上的朝向角度
    getMinimapAngle(yaw) {
        // yaw = 0 时玩家面朝 -Z 方向（北），在小地图上应该朝上
        // 小地图上：0度朝上，顺时针增加
        return -yaw - Math.PI / 2;
    }
    
    update() {
        if (!this.ctx || !this.game.camera) return;
        
        const ctx = this.ctx;
        const mapConfig = MapConfigs[this.game.selectedMap] || MapConfigs['dust2'];
        
        // 清空画布
        ctx.clearRect(0, 0, this.size, this.size);
        
        // 绘制背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.size, this.size);
        
        // 绘制边框
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.size, this.size);
        
        // 绘制障碍物（固定位置）
        ctx.fillStyle = 'rgba(139, 115, 85, 0.6)';
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.8)';
        ctx.lineWidth = 1;
        
        const mapSize = this.game.selectedMap === 'dust2' ? 300 : 125;
        const scale = this.size / (mapSize * 2);
        
        if (mapConfig.obstacles) {
            mapConfig.obstacles.forEach(o => {
                const pos = this.worldToMinimap(o.x, o.z);
                const w = o.w * scale;
                const d = o.d * scale;
                ctx.fillRect(pos.x - w/2, pos.y - d/2, w, d);
                ctx.strokeRect(pos.x - w/2, pos.y - d/2, w, d);
            });
        }
        
        // 绘制包点（爆破模式）
        if (this.game.isDefuseMode && mapConfig.bombSites) {
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 500) * 0.1;
            
            // A点
            if (mapConfig.bombSites.A) {
                const posA = this.worldToMinimap(mapConfig.bombSites.A.x, mapConfig.bombSites.A.z);
                const radius = mapConfig.bombSites.A.radius * scale;
                
                ctx.fillStyle = this.game.c4Site === 'A' ? '#ff0000' : '#ff6600';
                ctx.beginPath();
                ctx.arc(posA.x, posA.y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 更新A点标签位置
                const labelA = document.getElementById('minimap-site-a');
                if (labelA) {
                    labelA.style.left = (posA.x - 8) + 'px';
                    labelA.style.top = (posA.y - 8) + 'px';
                    labelA.style.display = 'block';
                }
            }
            
            // B点
            if (mapConfig.bombSites.B) {
                const posB = this.worldToMinimap(mapConfig.bombSites.B.x, mapConfig.bombSites.B.z);
                const radius = mapConfig.bombSites.B.radius * scale;
                
                ctx.fillStyle = this.game.c4Site === 'B' ? '#ff0000' : '#ff6600';
                ctx.beginPath();
                ctx.arc(posB.x, posB.y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 更新B点标签位置
                const labelB = document.getElementById('minimap-site-b');
                if (labelB) {
                    labelB.style.left = (posB.x - 8) + 'px';
                    labelB.style.top = (posB.y - 8) + 'px';
                    labelB.style.display = 'block';
                }
            }
            
            ctx.globalAlpha = 1;
        } else {
            // 非爆破模式隐藏包点标签
            const labelA = document.getElementById('minimap-site-a');
            const labelB = document.getElementById('minimap-site-b');
            if (labelA) labelA.style.display = 'none';
            if (labelB) labelB.style.display = 'none';
        }
        
        // 绘制C4位置（如果已安放）
        if (this.game.c4Planted && this.game.c4Position) {
            const c4Pos = this.worldToMinimap(this.game.c4Position.x, this.game.c4Position.z);
            const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
            
            ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + pulse * 0.5})`;
            ctx.beginPath();
            ctx.arc(c4Pos.x, c4Pos.y, 5 + pulse * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // C4图标
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', c4Pos.x, c4Pos.y);
        }
        
        // 绘制队友（不显示敌人）
        Object.entries(this.game.players).forEach(([id, player]) => {
            if (id === this.game.playerId) return; // 自己单独绘制
            if (!player.is_alive) return;
            
            const isTeammate = player.team === this.game.selectedTeam;
            
            // 只显示队友
            if (isTeammate) {
                const pos = this.worldToMinimap(player.x, player.y);
                const playerAngle = this.getMinimapAngle(player.angle || 0);
                
                // 队友用绿色
                ctx.fillStyle = '#00ff00';
                ctx.strokeStyle = '#00ff00';
                
                // 绘制玩家圆点
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, this.playerSize / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制方向指示线
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(
                    pos.x + Math.cos(playerAngle) * this.playerSize * 1.5,
                    pos.y + Math.sin(playerAngle) * this.playerSize * 1.5
                );
                ctx.stroke();
            }
        });
        
        // 绘制自己
        if (this.game.camera) {
            const myPos = this.worldToMinimap(this.game.camera.position.x, this.game.camera.position.z);
            const myAngle = this.getMinimapAngle(this.game.yaw);
            
            // 视野扇形
            ctx.fillStyle = 'rgba(255, 255, 0, 0.15)';
            ctx.beginPath();
            ctx.moveTo(myPos.x, myPos.y);
            const fovAngle = Math.PI / 6; // 30度
            ctx.arc(myPos.x, myPos.y, 35, myAngle - fovAngle, myAngle + fovAngle);
            ctx.closePath();
            ctx.fill();
            
            // 自己用黄色三角形
            ctx.fillStyle = '#ffff00';
            ctx.save();
            ctx.translate(myPos.x, myPos.y);
            ctx.rotate(myAngle + Math.PI / 2); // 三角形尖端朝向移动方向
            ctx.beginPath();
            ctx.moveTo(0, -this.playerSize);
            ctx.lineTo(-this.playerSize / 2, this.playerSize / 2);
            ctx.lineTo(this.playerSize / 2, this.playerSize / 2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }
    
    show() {
        const container = document.getElementById('minimap-container');
        if (container) container.style.display = 'block';
    }
    
    hide() {
        const container = document.getElementById('minimap-container');
        if (container) container.style.display = 'none';
    }
}
