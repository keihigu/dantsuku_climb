// レンダラー - ゲームの描画を担当（後でビジュアルを差し替え可能）
class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        
        // 画面スクロールのオフセット
        this.scrollOffset = 0;
        
        // 指の位置を追跡
        this.touchIndicator = { x: 0, y: 0, active: false };
    }
    
    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    // 背景を描画
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0f0f1e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // スクロールする背景のグリッド
        this.drawScrollingGrid();
    }
    
    // スクロールするグリッド背景
    drawScrollingGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        const offsetY = this.scrollOffset % gridSize;
        
        // 横線
        for (let y = -gridSize + offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // 縦線
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    // 壁を描画
    drawWalls(wallWidth) {
        const centerX = this.canvas.width / 2;
        const leftWallX = centerX - wallWidth / 2;
        const rightWallX = centerX + wallWidth / 2;
        
        // 左の壁
        this.ctx.fillStyle = '#2d3561';
        this.ctx.fillRect(0, 0, leftWallX, this.canvas.height);
        
        // 右の壁
        this.ctx.fillRect(rightWallX, 0, this.canvas.width - rightWallX, this.canvas.height);
        
        // 壁の境界線（立体感）
        this.ctx.strokeStyle = '#4a5899';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(leftWallX, 0);
        this.ctx.lineTo(leftWallX, this.canvas.height);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(rightWallX, 0);
        this.ctx.lineTo(rightWallX, this.canvas.height);
        this.ctx.stroke();
        
        // 壁のテクスチャ（横線）
        this.ctx.strokeStyle = 'rgba(74, 88, 153, 0.3)';
        this.ctx.lineWidth = 2;
        const lineSpacing = 30;
        const offsetY = this.scrollOffset % lineSpacing;
        
        for (let y = -lineSpacing + offsetY; y < this.canvas.height; y += lineSpacing) {
            // 左壁
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(leftWallX, y);
            this.ctx.stroke();
            
            // 右壁
            this.ctx.beginPath();
            this.ctx.moveTo(rightWallX, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    // プレイヤーを描画
    drawPlayer(position) {
        const centerX = this.canvas.width / 2;
        const playerY = this.canvas.height * 0.7; // 画面の70%の位置
        const playerX = centerX + (position * this.canvas.width * 0.15); // -1 to 1
        
        // プレイヤー本体（丸）
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 輪郭
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // 顔（シンプルな目）
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(playerX - 7, playerY - 5, 3, 0, Math.PI * 2);
        this.ctx.arc(playerX + 7, playerY - 5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(playerX, playerY + 25, 15, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // タッチインジケーターを描画
    drawTouchIndicator() {
        if (!this.touchIndicator.active) return;
        
        const x = this.touchIndicator.x;
        const y = this.touchIndicator.y;
        
        // 指の位置に小さな円を描画
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 中心点
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // スクロール速度を更新
    updateScroll(speed) {
        this.scrollOffset += speed;
    }
    
    // タッチインジケーターを更新
    updateTouchIndicator(x, y, active) {
        this.touchIndicator.x = x;
        this.touchIndicator.y = y;
        this.touchIndicator.active = active;
    }
    
    // メイン描画メソッド
    render(gameState) {
        // 背景
        this.drawBackground();
        
        // 壁
        this.drawWalls(gameState.wallWidth);
        
        // プレイヤー
        this.drawPlayer(gameState.playerPosition);
        
        // タッチインジケーター
        this.drawTouchIndicator();
    }
}
