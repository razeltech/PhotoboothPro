/**
 * In-Browser Animated GIF Motion Engine
 * Stitches captured canvas frames into an animated GIF motion strip
 */
class GifEngine {
    static async createAnimatedGif(framesArray, settings = {}, delayMs = 600) {
        if (!framesArray || framesArray.length === 0) return null;

        // Build sequence of canvases representing full styled photo strip frames
        const processedCanvases = [];

        // 1. Progressive Build-Up Frames (Frame 1 -> Frame 1+2 -> Frame 1+2+3 -> Full Strip)
        for (let i = 1; i <= framesArray.length; i++) {
            const partialFrames = framesArray.slice(0, i);
            const framedCanvas = window.StripEngine ? window.StripEngine.buildHighResCanvas(partialFrames, settings) : null;
            if (framedCanvas) processedCanvases.push(framedCanvas);
        }

        // 2. Add complete full strip canvas at the end for hold
        const fullCanvas = window.StripEngine ? window.StripEngine.buildHighResCanvas(framesArray, settings) : null;
        if (fullCanvas) {
            processedCanvases.push(fullCanvas);
            processedCanvases.push(fullCanvas); // Hold on full frame
        }

        if (processedCanvases.length === 0) return null;

        const width = processedCanvases[0].width;
        const height = processedCanvases[0].height;

        return new Promise((resolve) => {
            let currentIdx = 0;
            const animCanvas = document.createElement('canvas');
            animCanvas.width = width;
            animCanvas.height = height;
            const animCtx = animCanvas.getContext('2d');

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
                    const maxFrames = processedCanvases.length * 3; // Loop 3 cycles
                    const interval = setInterval(() => {
                        animCtx.clearRect(0, 0, width, height);
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

            // Fallback: Return complete full strip canvas DataURL
            resolve(fullCanvas ? fullCanvas.toDataURL('image/jpeg', 0.95) : null);
        });
    }
}

window.GifEngine = GifEngine;
