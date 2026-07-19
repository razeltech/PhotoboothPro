/**
 * In-Browser Animated GIF Motion Engine
 * Stitches captured canvas frames into an animated GIF motion strip
 */
class GifEngine {
    static async createAnimatedGif(framesArray, delayMs = 500) {
        if (!framesArray || framesArray.length === 0) return null;

        const width = framesArray[0].width || 600;
        const height = framesArray[0].height || 450;

        // Build composite canvas sequence with watermark stamp
        const processedCanvases = framesArray.map(frame => {
            const c = document.createElement('canvas');
            c.width = width;
            c.height = height;
            const ctx = c.getContext('2d');
            ctx.drawImage(frame, 0, 0, width, height);

            // Watermark overlay badge
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(10, height - 35, 230, 25);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('✨ MOTION BOOTH // RAZEL TECH 🇮🇳', 15, height - 18);

            return c;
        });

        // Generate Data URL array representing frames animation loop
        return new Promise((resolve) => {
            let currentIdx = 0;
            const animCanvas = document.createElement('canvas');
            animCanvas.width = width;
            animCanvas.height = height;
            const animCtx = animCanvas.getContext('2d');

            // Simple WebM / Animation Stream Exporter or Canvas Exporter
            if (window.MediaRecorder && animCanvas.captureStream) {
                const stream = animCanvas.captureStream(30);
                let mediaRecorder;
                try {
                    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
                } catch (e) {
                    try { mediaRecorder = new MediaRecorder(stream); } catch (e2) {}
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
