// 音效系统模块
class AudioSystem {
    constructor() {
        this.audioCtx = null;
        this.lastFootstep = 0;
        this.footstepInterval = 400;
        this.masterVolume = 1.0;
        
        // 预加载音效文件
        this.sounds = {};
        this.soundsLoaded = false;
    }
    
    init() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.audioCtx.destination);
        // 立即开始加载音效，不阻塞游戏启动
        this.loadSounds();
    }
    
    setVolume(volume) {
        this.masterVolume = volume;
        if (this.masterGain) {
            this.masterGain.gain.value = volume;
        }
    }
    
    async loadSounds() {
        const soundFiles = {
            // AK47 音效
            'ak47_1': 'yinxiao/weapons/ak47-1.wav',
            'ak47_2': 'yinxiao/weapons/ak47-2.wav',
            'ak47_clipin': 'yinxiao/weapons/ak47_clipin.wav',
            'ak47_clipout': 'yinxiao/weapons/ak47_clipout.wav',
            'ak47_boltpull': 'yinxiao/weapons/ak47_boltpull.wav',
            // M4A1 音效
            'm4a1_1': 'yinxiao/weapons/m4a1-1.wav',
            'm4a1_unsil_1': 'yinxiao/weapons/m4a1_unsil-1.wav',
            'm4a1_unsil_2': 'yinxiao/weapons/m4a1_unsil-2.wav',
            'm4a1_clipin': 'yinxiao/weapons/m4a1_clipin.wav',
            'm4a1_clipout': 'yinxiao/weapons/m4a1_clipout.wav',
            'm4a1_boltpull': 'yinxiao/weapons/m4a1_boltpull.wav',
            'm4a1_deploy': 'yinxiao/weapons/m4a1_deploy.wav',
            // AWP 音效
            'awp_1': 'yinxiao/weapons/awp1.wav',
            'awp_clipin': 'yinxiao/weapons/awp_clipin.wav',
            'awp_clipout': 'yinxiao/weapons/awp_clipout.wav',
            'awp_deploy': 'yinxiao/weapons/awp_deploy.wav',
            'awp_zoom': 'yinxiao/weapons/zoom.wav',
            // USP 手枪音效
            'usp_1': 'yinxiao/weapons/usp1.wav',
            'usp_2': 'yinxiao/weapons/usp2.wav',
            'usp_unsil': 'yinxiao/weapons/usp_unsil-1.wav',
            'usp_clipin': 'yinxiao/weapons/usp_clipin.wav',
            'usp_clipout': 'yinxiao/weapons/usp_clipout.wav',
            'usp_slideback': 'yinxiao/weapons/usp_slideback.wav',
            'usp_sliderelease': 'yinxiao/weapons/usp_sliderelease.wav',
            // 刀 音效
            'knife_deploy': 'yinxiao/weapons/knife_deploy1.wav',
            'knife_slash1': 'yinxiao/weapons/knife_slash1.wav',
            'knife_slash2': 'yinxiao/weapons/knife_slash2.wav',
            'knife_hit1': 'yinxiao/weapons/knife_hit1.wav',
            'knife_hit2': 'yinxiao/weapons/knife_hit2.wav',
            'knife_hitwall': 'yinxiao/weapons/knife_hitwall1.wav',
            'knife_stab': 'yinxiao/weapons/knife_stab.wav',
            // 手雷 音效
            'pinpull': 'yinxiao/weapons/pinpull.wav',
            'grenade_hit1': 'yinxiao/weapons/grenade_hit1.wav',
            'grenade_hit2': 'yinxiao/weapons/grenade_hit2.wav',
            'he_bounce': 'yinxiao/weapons/he_bounce-1.wav',
            'explosion1': 'yinxiao/weapons/hegrenade-1.wav',
            'explosion2': 'yinxiao/weapons/hegrenade-2.wav',
            'c4_explode': 'yinxiao/weapons/c4_explode1.wav',
            // 击中音效
            'headshot': 'yinxiao/weapons/headshot2.wav',
            // 连杀音效
            'headshot_gr': 'yinxiao/liansha/Headshot_GR.wav',
            'knifekill': 'yinxiao/liansha/Knifekill_GR.wav',
            'multikill_2': 'yinxiao/liansha/MultiKill_2_GR.wav',
            'multikill_3': 'yinxiao/liansha/MultiKill_3_GR.wav',
            'multikill_4': 'yinxiao/liansha/MultiKill_4_GR.wav',
            'multikill_5': 'yinxiao/liansha/MultiKill_5_GR.wav',
            'multikill_6': 'yinxiao/liansha/MultiKill_6_GR.wav',
            'multikill_7': 'yinxiao/liansha/MultiKill_7_GR.wav',
            'multikill_8': 'yinxiao/liansha/MultiKill_8_GR.wav',
            // 通用音效
            'dryfire_rifle': 'yinxiao/weapons/dryfire_rifle.wav',
            'dryfire_pistol': 'yinxiao/weapons/dryfire_pistol.wav'
        };
        
        // 并行加载所有音效文件
        const loadPromises = Object.entries(soundFiles).map(async ([name, path]) => {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    console.warn(`Sound file not found: ${path}`);
                    return;
                }
                const arrayBuffer = await response.arrayBuffer();
                this.sounds[name] = await this.audioCtx.decodeAudioData(arrayBuffer);
                console.log(`Loaded sound: ${name}`);
            } catch (e) {
                console.warn(`Failed to load sound: ${path}`, e);
            }
        });
        
        await Promise.all(loadPromises);
        this.soundsLoaded = true;
        console.log('Sound loading complete. Loaded:', Object.keys(this.sounds));
    }
    
    playSound(name, volume = 1.0) {
        if (!this.audioCtx || !this.sounds[name]) return;
        const source = this.audioCtx.createBufferSource();
        source.buffer = this.sounds[name];
        const gain = this.audioCtx.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        // 连接到主音量控制节点，确保音量设置生效
        gain.connect(this.masterGain);
        source.start();
    }
    
    playAK47Sound() {
        // 优先使用真实音效
        if (this.sounds['ak47_1'] && this.sounds['ak47_2']) {
            const soundName = Math.random() > 0.5 ? 'ak47_1' : 'ak47_2';
            this.playSound(soundName, 0.6);
            return;
        }
        if (this.sounds['ak47_1']) {
            this.playSound('ak47_1', 0.6);
            return;
        }
        if (this.sounds['ak47_2']) {
            this.playSound('ak47_2', 0.6);
            return;
        }
        // 备用合成音效
        this.playAK47SoundSynth();
    }
    
    playAK47SoundSynth() {
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const duration = 0.15;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const noise = Math.random() * 2 - 1;
            const lowFreq = Math.sin(2 * Math.PI * 150 * t / ctx.sampleRate);
            data[i] = (noise * 0.7 + lowFreq * 0.3) * Math.exp(-t * 20) * 1.5;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 2000;
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 100;
        const gain = ctx.createGain();
        gain.gain.value = 1.5;
        source.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }
    
    playM4A1Sound() {
        // 优先使用真实音效 - m4a1-1.wav 是带消音器的
        if (this.sounds['m4a1_1']) {
            this.playSound('m4a1_1', 0.6);
            return;
        }
        // 备选：无消音器版本
        if (this.sounds['m4a1_unsil_1'] && this.sounds['m4a1_unsil_2']) {
            const soundName = Math.random() > 0.5 ? 'm4a1_unsil_1' : 'm4a1_unsil_2';
            this.playSound(soundName, 0.6);
            return;
        }
        if (this.sounds['m4a1_unsil_1']) {
            this.playSound('m4a1_unsil_1', 0.6);
            return;
        }
        if (this.sounds['m4a1_unsil_2']) {
            this.playSound('m4a1_unsil_2', 0.6);
            return;
        }
        // 备用合成音效
        this.playM4A1SoundSynth();
    }
    
    playM4A1SoundSynth() {
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const duration = 0.12;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const noise = Math.random() * 2 - 1;
            const click = Math.sin(2 * Math.PI * 2000 * t / ctx.sampleRate) * Math.exp(-t * 50);
            data[i] = (noise * 0.6 + click * 0.4) * Math.exp(-t * 25) * 1.2;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 1;
        const gain = ctx.createGain();
        gain.gain.value = 1.3;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }
    
    playAK47ReloadSound() {
        // 播放换弹音效序列
        if (this.sounds['ak47_clipout']) {
            this.playSound('ak47_clipout', 0.5);
        }
        setTimeout(() => {
            if (this.sounds['ak47_clipin']) {
                this.playSound('ak47_clipin', 0.5);
            }
        }, 600);
        setTimeout(() => {
            if (this.sounds['ak47_boltpull']) {
                this.playSound('ak47_boltpull', 0.5);
            }
        }, 1200);
    }
    
    playM4A1ReloadSound() {
        if (this.sounds['m4a1_clipout']) {
            this.playSound('m4a1_clipout', 0.5);
        }
        setTimeout(() => {
            if (this.sounds['m4a1_clipin']) {
                this.playSound('m4a1_clipin', 0.5);
            }
        }, 600);
        setTimeout(() => {
            if (this.sounds['m4a1_boltpull']) {
                this.playSound('m4a1_boltpull', 0.5);
            }
        }, 1200);
    }

    playAWPSound() {
        // 优先使用真实音效
        if (this.sounds['awp_1']) {
            this.playSound('awp_1', 0.7);
            return;
        }
        // 备用合成音效
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const duration = 0.5;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const boom = Math.sin(2 * Math.PI * 60 * t / ctx.sampleRate);
            const crack = Math.random() * 2 - 1;
            data[i] = (boom * 0.6 + crack * 0.4) * Math.exp(-t * 8) * 2;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 800;
        const gain = ctx.createGain();
        gain.gain.value = 2;
        source.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }
    
    playAWPReloadSound() {
        if (this.sounds['awp_clipout']) {
            this.playSound('awp_clipout', 0.5);
        }
        setTimeout(() => {
            if (this.sounds['awp_clipin']) {
                this.playSound('awp_clipin', 0.5);
            }
        }, 800);
    }
    
    playZoomSound() {
        if (this.sounds['awp_zoom']) {
            this.playSound('awp_zoom', 0.4);
        }
    }
    
    playPistolSound() {
        // 优先使用真实音效
        if (this.sounds['usp_1'] && this.sounds['usp_2']) {
            const soundName = Math.random() > 0.5 ? 'usp_1' : 'usp_2';
            this.playSound(soundName, 0.6);
            return;
        }
        if (this.sounds['usp_1']) {
            this.playSound('usp_1', 0.6);
            return;
        }
        if (this.sounds['usp_unsil']) {
            this.playSound('usp_unsil', 0.6);
            return;
        }
        // 备用合成音效
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const duration = 0.1;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const snap = Math.sin(2 * Math.PI * 800 * t / ctx.sampleRate);
            data[i] = (Math.random() * 0.5 + snap * 0.5) * Math.exp(-t * 35);
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = 0.9;
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }
    
    playPistolReloadSound() {
        if (this.sounds['usp_clipout']) {
            this.playSound('usp_clipout', 0.5);
        }
        setTimeout(() => {
            if (this.sounds['usp_clipin']) {
                this.playSound('usp_clipin', 0.5);
            }
        }, 400);
        setTimeout(() => {
            if (this.sounds['usp_slideback']) {
                this.playSound('usp_slideback', 0.5);
            }
        }, 800);
        setTimeout(() => {
            if (this.sounds['usp_sliderelease']) {
                this.playSound('usp_sliderelease', 0.5);
            }
        }, 1000);
    }
    
    playGunSound(weapon) {
        switch(weapon) {
            case 'ak47': this.playAK47Sound(); break;
            case 'm4a1': this.playM4A1Sound(); break;
            case 'awp': this.playAWPSound(); break;
            case 'pistol': this.playPistolSound(); break;
        }
    }
    
    // 播放远程玩家的开枪声音（带距离衰减）
    playRemoteGunSound(weapon, volume = 0.5) {
        if (!this.audioCtx) return;
        
        // 根据武器类型选择音效
        let soundName = null;
        switch(weapon) {
            case 'ak47':
                soundName = this.sounds['ak47_1'] ? 'ak47_1' : (this.sounds['ak47_2'] ? 'ak47_2' : null);
                break;
            case 'm4a1':
                soundName = this.sounds['m4a1_1'] ? 'm4a1_1' : (this.sounds['m4a1_unsil_1'] ? 'm4a1_unsil_1' : null);
                break;
            case 'awp':
                soundName = this.sounds['awp_1'] ? 'awp_1' : null;
                break;
            case 'pistol':
                soundName = this.sounds['usp_1'] ? 'usp_1' : (this.sounds['usp_2'] ? 'usp_2' : null);
                break;
            case 'knife':
                soundName = this.sounds['knife_slash1'] ? 'knife_slash1' : null;
                break;
        }
        
        if (soundName && this.sounds[soundName]) {
            this.playSound(soundName, volume);
        } else {
            // 备用：使用合成音效
            this.playRemoteGunSoundSynth(weapon, volume);
        }
    }
    
    // 合成远程开枪声音
    playRemoteGunSoundSynth(weapon, volume = 0.5) {
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        
        let duration, freq;
        switch(weapon) {
            case 'awp':
                duration = 0.3;
                freq = 60;
                break;
            case 'pistol':
                duration = 0.08;
                freq = 400;
                break;
            default: // ak47, m4a1
                duration = 0.12;
                freq = 150;
        }
        
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const noise = Math.random() * 2 - 1;
            const lowFreq = Math.sin(2 * Math.PI * freq * t / ctx.sampleRate);
            data[i] = (noise * 0.6 + lowFreq * 0.4) * Math.exp(-t * 15) * volume;
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 1500;
        
        const gain = ctx.createGain();
        gain.gain.value = volume;
        
        source.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }
    
    playFootstep() {
        if (!this.audioCtx) return;
        const now = Date.now();
        if (now - this.lastFootstep < this.footstepInterval) return;
        this.lastFootstep = now;
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 80 + Math.random() * 40;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }
    
    playReloadSound(weapon = 'ak47') {
        // 根据武器播放对应的换弹音效
        if (weapon === 'ak47' && this.sounds['ak47_clipout']) {
            this.playAK47ReloadSound();
            return;
        }
        if (weapon === 'm4a1' && this.sounds['m4a1_clipout']) {
            this.playM4A1ReloadSound();
            return;
        }
        if (weapon === 'awp' && this.sounds['awp_clipout']) {
            this.playAWPReloadSound();
            return;
        }
        if (weapon === 'pistol' && this.sounds['usp_clipout']) {
            this.playPistolReloadSound();
            return;
        }
        
        // 备用合成音效
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const masterGain = this.masterGain;
        setTimeout(() => {
            const bufferSize = ctx.sampleRate * 0.1;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 10) * 0.3;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(masterGain);
            source.start();
        }, 200);
        setTimeout(() => {
            const bufferSize = ctx.sampleRate * 0.15;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const t = i / bufferSize;
                data[i] = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 15) * 0.4;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(masterGain);
            source.start();
        }, 800);
    }
    
    playHitSound() {
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 800;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }
    
    playWeaponSwitchSound() {
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            data[i] = (Math.random() * 0.3 + Math.sin(2 * Math.PI * 300 * t) * 0.2) * Math.exp(-t * 12);
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.masterGain);
        source.start();
    }
    
    playGrenadeThrowSound() {
        // 拉环音效
        if (this.sounds['pinpull']) {
            this.playSound('pinpull', 0.5);
        } else {
            if (!this.audioCtx) return;
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        }
    }
    
    playGrenadeBounceSound() {
        if (this.sounds['he_bounce']) {
            this.playSound('he_bounce', 0.4);
        } else if (this.sounds['grenade_hit1']) {
            this.playSound('grenade_hit1', 0.4);
        }
    }
    
    playHeadshotSound() {
        if (this.sounds['headshot']) {
            this.playSound('headshot', 0.7);
        }
    }
    
    // 播放爆头语音
    playHeadshotVoice() {
        if (this.sounds['headshot_gr']) {
            this.playSound('headshot_gr', 0.8);
        }
    }
    
    // 播放刀杀语音
    playKnifeKillVoice() {
        if (this.sounds['knifekill']) {
            this.playSound('knifekill', 0.8);
        }
    }
    
    // 播放连杀语音 (killStreak: 2-8)
    playMultiKillVoice(killStreak) {
        const streak = Math.min(Math.max(killStreak, 2), 8);
        const soundName = `multikill_${streak}`;
        if (this.sounds[soundName]) {
            this.playSound(soundName, 0.9);
        }
    }
    
    playKnifeSound() {
        // 优先使用真实音效
        if (this.sounds['knife_slash1'] && this.sounds['knife_slash2']) {
            const soundName = Math.random() > 0.5 ? 'knife_slash1' : 'knife_slash2';
            this.playSound(soundName, 0.6);
            return;
        }
        if (this.sounds['knife_slash1']) {
            this.playSound('knife_slash1', 0.6);
            return;
        }
        // 备用合成音效
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    }
    
    playKnifeHitSound() {
        if (this.sounds['knife_hit1'] && this.sounds['knife_hit2']) {
            const soundName = Math.random() > 0.5 ? 'knife_hit1' : 'knife_hit2';
            this.playSound(soundName, 0.6);
            return;
        }
        if (this.sounds['knife_hit1']) {
            this.playSound('knife_hit1', 0.6);
        }
    }
    
    playKnifeStabSound() {
        if (this.sounds['knife_stab']) {
            this.playSound('knife_stab', 0.6);
        }
    }
    
    playKnifeDeploySound() {
        if (this.sounds['knife_deploy']) {
            this.playSound('knife_deploy', 0.5);
        }
    }
    
    playExplosionSound() {
        // 优先使用真实音效
        if (this.sounds['explosion1'] && this.sounds['explosion2']) {
            const soundName = Math.random() > 0.5 ? 'explosion1' : 'explosion2';
            this.playSound(soundName, 0.8);
            return;
        }
        if (this.sounds['explosion1']) {
            this.playSound('explosion1', 0.8);
            return;
        }
        if (this.sounds['c4_explode']) {
            this.playSound('c4_explode', 0.8);
            return;
        }
        // 备用合成音效
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const duration = 0.8;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const boom = Math.sin(2 * Math.PI * 40 * t) * Math.exp(-t * 3);
            const impact = Math.sin(2 * Math.PI * 120 * t) * Math.exp(-t * 6);
            const debris = (Math.random() * 2 - 1) * Math.exp(-t * 10);
            data[i] = (boom * 0.5 + impact * 0.3 + debris * 0.2) * 2.5;
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 500;
        
        const gain = ctx.createGain();
        gain.gain.value = 2.5;
        
        source.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }
}
