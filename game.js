// メインゲームロジック
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new GameRenderer(this.canvas);
        
        // ゲーム状態
        this.gameState = {
            playerPosition: 0,        // -1 (左) to 1 (右)
            wallWidth: 300,           // 壁の幅（ピクセル）
            height: 0,                // 登った高さ
            climbSpeed: 0,            // 現在の上昇速度
            bpm: 120,                 // リズムのテンポ
        };
        
        // リズムシステム
        this.rhythm = {
            pattern: ['dan', 'tsuku', 'pa', 'tsuku'], // ダン、ツク、パー、ツク
            currentBeat: 0,
            nextBeatTime: 0,
            beatInterval: 0,
            expectedDirection: 'left', // 'left' or 'right'
        };
        
        // タッチ入力
        this.touch = {
            lastX: null,
            lastY: null,
            startX: null,
            currentX: null,
            isActive: false,
        };
        
        // タイマー
        this.gameTime = 60; // 60秒
        this.startTime = null;
        this.lastFrameTime = null;
        
        // ゲーム進行
        this.isPlaying = false;
        this.animationId = null;
        this.wallChangeTimer = 0;
        this.wallChangeInterval = 10000; // 10秒ごとに壁の幅を変更
        
        // UI要素
        this.ui = {
            scoreValue: document.getElementById('scoreValue'),
            timerValue: document.getElementById('timerValue'),
            startScreen: document.getElementById('startScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            finalScore: document.getElementById('finalScore'),
            judgement: document.getElementById('judgement'),
            beatIndicators: [
                document.getElementById('beat1'),
                document.getElementById('beat2'),
                document.getElementById('beat3'),
                document.getElementById('beat4'),
            ],
        };
        
        this.init();
    }
    
    init() {
        // イベントリスナー
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('retryButton').addEventListener('click', () => this.resetGame());
        
        // タッチイベント
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // マウスイベント（デバッグ用）
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // リサイズ
        window.addEventListener('resize', () => this.renderer.resize());
        
        // 初期描画
        this.renderer.render(this.gameState);
    }
    
    startGame() {
        // オーディオを初期化
        audioSystem.init();
        audioSystem.playStart();
        
        // 画面を隠す
        this.ui.startScreen.classList.add('hidden');
        this.ui.gameOverScreen.classList.add('hidden');
        
        // ゲームをリセット
        this.gameState.height = 0;
        this.gameState.climbSpeed = 0;
        this.gameState.playerPosition = 0;
        this.gameState.bpm = 120;
        this.gameState.wallWidth = 300;
        
        this.gameTime = 60;
        this.wallChangeTimer = 0;
        this.startTime = Date.now();
        this.lastFrameTime = Date.now();
        
        // リズムを初期化
        this.rhythm.currentBeat = 0;
        this.updateBeatInterval();
        this.rhythm.nextBeatTime = Date.now() + this.rhythm.beatInterval;
        this.updateExpectedDirection();
        
        this.isPlaying = true;
        this.gameLoop();
    }
    
    resetGame() {
        this.ui.gameOverScreen.classList.add('hidden');
        this.ui.startScreen.classList.remove('hidden');
        
        // 状態をリセット
        this.gameState.playerPosition = 0;
        this.gameState.height = 0;
        this.gameState.climbSpeed = 0;
        this.renderer.scrollOffset = 0;
        this.renderer.render(this.gameState);
    }
    
    updateBeatInterval() {
        // BPMから1拍の間隔を計算（ミリ秒）
        this.rhythm.beatInterval = (60000 / this.gameState.bpm);
    }
    
    updateExpectedDirection() {
        const beatType = this.rhythm.pattern[this.rhythm.currentBeat];
        // ダン(左)、ツク(右)、パー(左)、ツク(右)
        this.rhythm.expectedDirection = (beatType === 'dan' || beatType === 'pa') ? 'left' : 'right';
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // 秒単位
        this.lastFrameTime = now;
        
        // タイマー更新
        const elapsed = (now - this.startTime) / 1000;
        this.gameTime = Math.max(0, 60 - elapsed);
        this.ui.timerValue.textContent = Math.ceil(this.gameTime);
        
        // ゲーム終了判定
        if (this.gameTime <= 0) {
            this.endGame();
            return;
        }
        
        // ビートチェック
        if (now >= this.rhythm.nextBeatTime) {
            this.onBeat();
        }
        
        // 壁の幅変更
        this.wallChangeTimer += deltaTime * 1000;
        if (this.wallChangeTimer >= this.wallChangeInterval) {
            this.changeWallWidth();
            this.wallChangeTimer = 0;
        }
        
        // 上昇速度を適用
        this.gameState.height += this.gameState.climbSpeed * deltaTime;
        this.renderer.updateScroll(this.gameState.climbSpeed * deltaTime * 2); // スクロール速度
        
        // 上昇速度を徐々に減衰
        this.gameState.climbSpeed *= 0.98;
        
        // スコア更新
        this.ui.scoreValue.textContent = Math.floor(this.gameState.height);
        
        // ビートインジケーターを更新
        this.updateBeatIndicators();
        
        // プレイヤーの位置をスムーズに中央に戻す
        this.gameState.playerPosition *= 0.9;
        
        // 描画
        this.renderer.render(this.gameState);
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    onBeat() {
        const beatType = this.rhythm.pattern[this.rhythm.currentBeat];
        
        // ビート音を再生
        audioSystem.playBeat(beatType);
        
        // 次のビートへ
        this.rhythm.currentBeat = (this.rhythm.currentBeat + 1) % this.rhythm.pattern.length;
        this.rhythm.nextBeatTime += this.rhythm.beatInterval;
        this.updateExpectedDirection();
    }
    
    updateBeatIndicators() {
        this.ui.beatIndicators.forEach((indicator, index) => {
            indicator.classList.remove('active', 'hit');
            if (index === this.rhythm.currentBeat) {
                indicator.classList.add('active');
            }
        });
    }
    
    changeWallWidth() {
        // ランダムに壁の幅を変更
        const widths = [250, 300, 350];
        const bpms = [140, 120, 100];
        const index = Math.floor(Math.random() * widths.length);
        
        this.gameState.wallWidth = widths[index];
        this.gameState.bpm = bpms[index];
        this.updateBeatInterval();
        
        console.log(`壁の幅: ${this.gameState.wallWidth}px, BPM: ${this.gameState.bpm}`);
    }
    
    // タッチイベント処理
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touch.startX = touch.clientX;
        this.touch.lastX = touch.clientX;
        this.touch.currentX = touch.clientX;
        this.touch.isActive = true;
        
        this.renderer.updateTouchIndicator(touch.clientX, touch.clientY, true);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touch.isActive) return;
        
        const touch = e.touches[0];
        this.touch.currentX = touch.clientX;
        
        this.renderer.updateTouchIndicator(touch.clientX, touch.clientY, true);
        
        // 相対的な移動量を計算
        const deltaX = this.touch.currentX - this.touch.lastX;
        
        // 一定以上の移動があったら入力として認識
        if (Math.abs(deltaX) > 30) {
            const direction = deltaX > 0 ? 'right' : 'left';
            this.handleInput(direction);
            this.touch.lastX = this.touch.currentX;
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.touch.isActive = false;
        this.touch.startX = null;
        this.touch.lastX = null;
        this.touch.currentX = null;
        
        this.renderer.updateTouchIndicator(0, 0, false);
    }
    
    // マウスイベント（デバッグ用）
    handleMouseDown(e) {
        this.touch.startX = e.clientX;
        this.touch.lastX = e.clientX;
        this.touch.currentX = e.clientX;
        this.touch.isActive = true;
        
        this.renderer.updateTouchIndicator(e.clientX, e.clientY, true);
    }
    
    handleMouseMove(e) {
        if (!this.touch.isActive) return;
        
        this.touch.currentX = e.clientX;
        this.renderer.updateTouchIndicator(e.clientX, e.clientY, true);
        
        const deltaX = this.touch.currentX - this.touch.lastX;
        
        if (Math.abs(deltaX) > 30) {
            const direction = deltaX > 0 ? 'right' : 'left';
            this.handleInput(direction);
            this.touch.lastX = this.touch.currentX;
        }
    }
    
    handleMouseUp(e) {
        this.touch.isActive = false;
        this.touch.startX = null;
        this.touch.lastX = null;
        this.touch.currentX = null;
        
        this.renderer.updateTouchIndicator(0, 0, false);
    }
    
    // 入力処理とタイミング判定
    handleInput(direction) {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        const timeDiff = Math.abs(now - this.rhythm.nextBeatTime);
        
        // タイミングウィンドウ
        const perfectWindow = 150;  // ±150ms
        const goodWindow = 300;     // ±300ms
        
        let judgement = 'miss';
        let speedBonus = -50; // ミスの場合は速度減少
        
        // 方向が正しいかチェック
        if (direction === this.rhythm.expectedDirection) {
            if (timeDiff < perfectWindow) {
                judgement = 'perfect';
                speedBonus = 100;
            } else if (timeDiff < goodWindow) {
                judgement = 'good';
                speedBonus = 50;
            }
        }
        
        // 判定を適用
        this.gameState.climbSpeed = Math.max(0, this.gameState.climbSpeed + speedBonus);
        
        // プレイヤーの位置を更新
        this.gameState.playerPosition = direction === 'left' ? -1 : 1;
        
        // UI更新
        this.showJudgement(judgement);
        
        // ビートインジケーターをハイライト
        this.ui.beatIndicators[this.rhythm.currentBeat].classList.add('hit');
        
        // サウンド再生
        audioSystem.playJudgement(judgement);
        
        console.log(`入力: ${direction}, 期待: ${this.rhythm.expectedDirection}, 判定: ${judgement}, タイミング差: ${timeDiff}ms`);
    }
    
    showJudgement(judgement) {
        const judgementEl = this.ui.judgement;
        judgementEl.textContent = judgement === 'perfect' ? 'PERFECT!' : 
                                  judgement === 'good' ? 'GOOD!' : 'MISS...';
        judgementEl.className = 'show ' + judgement;
        
        setTimeout(() => {
            judgementEl.classList.remove('show');
        }, 500);
    }
    
    endGame() {
        this.isPlaying = false;
        cancelAnimationFrame(this.animationId);
        
        // 最終スコアを表示
        this.ui.finalScore.textContent = Math.floor(this.gameState.height);
        this.ui.gameOverScreen.classList.remove('hidden');
        
        // ゲームオーバー音
        audioSystem.playGameOver();
    }
}

// ゲーム開始
window.addEventListener('load', () => {
    const game = new Game();
});
