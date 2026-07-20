/**
 * In-Browser Animated GIF Motion Engine
 * Stitches captured canvas frames into an animated GIF motion strip
 */
class GifEngine {
    static async createAnimatedGif(framesArray, delayMs = 500) {
        if (!framesArray || framesArray.length === 0) return null;

        // Upgrade motion resolution to High Definition 1280x960 (4:3 HD ratio)
        const width = 1280;
        const height = 960;

        // Build composite canvas sequence with HD quality rendering
        const processedCanvases = framesArray.map(frame => {
            const c = document.createElement('canvas');
            c.width = width;
            c.height = height;
            const ctx = c.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Smart cover-crop to fit 1280x960 HD frame without stretching
            const srcW = frame.width;
            const srcH = frame.height;
            const srcAspect = srcW / srcH;
            const targetAspect = width / height;

            let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;
            if (srcAspect > targetAspect) {
                cropW = srcH * targetAspect;
                cropX = (srcW - cropW) / 2;
            } else {
                cropH = srcW / targetAspect;
                cropY = (srcH - cropH) / 2;
            }

            ctx.drawImage(frame, cropX, cropY, cropW, cropH, 0, 0, width, height);

            // Clean badge overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(20, height - 50, 320, 36);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText('✨ MOTION BOOTH // 35MM REEL', 30, height - 26);

            return c;
        });

        // Generate Data URL / Blob array representing HD motion loop
        return new Promise((resolve) => {
            let currentIdx = 0;
            const animCanvas = document.createElement('canvas');
            animCanvas.width = width;
            animCanvas.height = height;
            const animCtx = animCanvas.getContext('2d');
            animCtx.imageSmoothingEnabled = true;
            animCtx.imageSmoothingQuality = 'high';

            // High Quality WebM / MP4 MediaRecorder Exporter
            if (window.MediaRecorder && animCanvas.captureStream) {
                const stream = animCanvas.captureStream(30);
                let mediaRecorder;
                const recorderOptions = { videoBitsPerSecond: 5000000 }; // 5 Mbps HD Bitrate

                try {
                    mediaRecorder = new MediaRecorder(stream, { ...recorderOptions, mimeType: 'video/webm;codecs=vp8' });
                } catch (e) {
                    try {
                        mediaRecorder = new MediaRecorder(stream, { ...recorderOptions, mimeType: 'video/mp4' });
                    } catch (e2) {
                        try { mediaRecorder = new MediaRecorder(stream); } catch (e3) {}
                    }
                }

                if (mediaRecorder) {
                    const chunks = [];
                    mediaRecorder.ondataavailable = e => chunks.push(e.data);
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
                        resolve(URL.createObjectURL(blob));
                    };

                    mediaRecorder.start();

                    let frameCount = 0;
                    const maxFrames = processedCanvases.length * 4; // Loop 4 times
                    const interval = setInterval(() => {
                        animCtx.drawImage(processedCanvases[currentIdx], 0, 0);
                        currentIdx = (currentIdx + 1) % processedCanvases.length;
                        frameCount++;
                        if (frameCount >= maxFrames) {
                            clearInterval(interval);
                            mediaRecorder.stop();
                        }
                    }, delayMs);

                    return;
                }
            }

            // Fallback: Return first frame DataURL
            resolve(processedCanvases[0].toDataURL('image/jpeg', 0.95));
        });
    }
}

window.GifEngine = GifEngine;
