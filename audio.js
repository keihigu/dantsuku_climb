// オーディオシステム - レトロなゲーム音を生成
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
    }
    
    // 初期化（ユーザーインタラクション後に呼ぶ）
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3; // 音量を調整
            this.masterGain.connect(this.audioContext.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }
    
    // 8bit風の音を再生
    playBeep(frequency, duration, type = 'square') {
        if (!this.initialized) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        // エンベロープ（ADSR）
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05); // Decay
        gainNode.gain.linearRampToValueAtTime(0.2, now + duration - 0.05); // Sustain
        gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    // ビート音を再生（リズムに合わせて）
    playBeat(beatType) {
        const beatSounds = {
            'dan': { freq: 220, duration: 0.15, type: 'square' },    // ダン (A3)
            'tsuku': { freq: 330, duration: 0.1, type: 'square' },   // ツク (E4)
            'pa': { freq: 277, duration: 0.15, type: 'square' },     // パー (C#4)
        };
        
        const sound = beatSounds[beatType];
        if (sound) {
            this.playBeep(sound.freq, sound.duration, sound.type);
        }
    }
    
    // 判定音を再生
    playJudgement(judgement) {
        const judgementSounds = {
            'perfect': { freq: 880, duration: 0.1, type: 'sine' },   // 高音
            'good': { freq: 440, duration: 0.1, type: 'sine' },      // 中音
            'miss': { freq: 110, duration: 0.15, type: 'sawtooth' }, // 低音・不協和音
        };
        
        const sound = judgementSounds[judgement];
        if (sound) {
            this.playBeep(sound.freq, sound.duration, sound.type);
        }
    }
    
    // ゲームオーバー音
    playGameOver() {
        if (!this.initialized) return;
        
        // 下降音階
        const notes = [440, 392, 349, 330];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playBeep(freq, 0.3, 'triangle');
            }, i * 200);
        });
    }
    
    // スタート音
    playStart() {
        if (!this.initialized) return;
        
        // 上昇音階
        const notes = [330, 392, 440, 523];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playBeep(freq, 0.1, 'square');
            }, i * 100);
        });
    }
}

// グローバルインスタンス
const audioSystem = new AudioSystem();
