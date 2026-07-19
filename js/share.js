/**
 * Native Web Share API File Engine
 * Shares image files directly to WhatsApp, Instagram, Messages, or system apps
 */
class ShareEngine {
    static async shareCanvasFile(canvas, title = 'Photo Strip', filename = 'razel-tech-strip.jpg') {
        if (!canvas) return false;

        return new Promise((resolve) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    resolve(false);
                    return;
                }

                const file = new File([blob], filename, { type: 'image/jpeg' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: title,
                            text: 'Check out my vintage photo strip captured with Razel Tech Photo Booth Pro! 🇮🇳'
                        });
                        resolve(true);
                        return;
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            console.warn('File share failed, falling back', err);
                        }
                    }
                }

                // Fallback for browsers without native file share API
                const text = encodeURIComponent("Check out my vintage photo strip captured with Razel Tech Photo Booth Pro! 🇮🇳");
                const waUrl = `https://api.whatsapp.com/send?text=${text}`;
                window.open(waUrl, '_blank');
                resolve(true);
            }, 'image/jpeg', 0.95);
        });
    }
}

window.ShareEngine = ShareEngine;
