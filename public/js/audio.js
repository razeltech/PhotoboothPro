/**
 * Authentic Mechanical Shutter Sound Synthesizer
 * Generates multi-phase physical camera shutter feedback:
 * 1. Mirror flip up
 * 2. High-speed curtain shutter snap
 * 3. Film winder tick
 */
class ShutterAudio {
    constructor() {
        this.audioCtx = null;
    }

    init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playShutterSound() {
        try {
            this.init();
            if (!this.audioCtx) return;

            const now = this.audioCtx.currentTime;

            // Phase 1: Mechanical Mirror Flip (Thump)
            const thumpOsc = this.audioCtx.createOscillator();
            const thumpGain = this.audioCtx.createGain();
            thumpOsc.type = 'sine';
            thumpOsc.frequency.setValueAtTime(140, now);
            thumpOsc.frequency.exponentialRampToValueAtTime(30, now + 0.04);
            thumpGain.gain.setValueAtTime(0.7, now);
            thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
            thumpOsc.connect(thumpGain);
            thumpGain.connect(this.audioCtx.destination);
            thumpOsc.start(now);
            thumpOsc.stop(now + 0.04);

            // Phase 2: Metallic Shutter Click (High Transient Snap)
            const clickOsc = this.audioCtx.createOscillator();
            const clickGain = this.audioCtx.createGain();
            clickOsc.type = 'square';
            clickOsc.frequency.setValueAtTime(1200, now + 0.02);
            clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.07);
            clickGain.gain.setValueAtTime(0.6, now + 0.02);
            clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
            clickOsc.connect(clickGain);
            clickGain.connect(this.audioCtx.destination);
            clickOsc.start(now + 0.02);
            clickOsc.stop(now + 0.07);

            // Phase 3: Mechanical Spring & Winder Tick (White Noise Burst)
            const bufferSize = this.audioCtx.sampleRate * 0.06;
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }
            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = this.audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.4, now + 0.05);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
            noise.connect(noiseGain);
            noiseGain.connect(this.audioCtx.destination);
            noise.start(now + 0.05);

        } catch (e) {
            console.warn("Shutter audio playback exception", e);
        }
    }
}

window.shutterAudio = new ShutterAudio();
