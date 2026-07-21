# AeroBooth 📸
> **Powered by Razel Tech**

A premium, lightweight, and ultra-high-fidelity client-side digital photobooth application. **AeroBooth** operates entirely within the browser with **100% offline-capability and privacy protection**. Users can capture poses, apply realistic analog photo filters, customize layouts (vertical ticket strips, postcard grids, retro polaroids), stamp digital emojis with intuitive dragging controls, and compile animated looping GIFs or behind-the-scenes video timelapses.

---

## ✨ Features and Capabilities

### 1. 🎞️ Frame Layout Templates
*   **Classic Vertical Strip (2" x 6")**: Triggers a **4-pose session** resulting in the iconic retail vertical strip card.
*   **2x2 Postcard Grid (4" x 6")**: An elegant 4-pose grid card suitable for landscape sharing.
*   **Nostalgic Polaroid**: Takes a **single cinematic snapshot** with a wide bottom margin optimized for handwritten-style caption writing.
*   **Double Portrait Duo**: Takes **2 vertical snapshots** and prints them side-by-side.
*   **Cinematic Wide (16:9)**: Captures **3 widescreen panoramas** aligned in a premium vertical film slice layout.

### 2. 🎨 Realistic Analog Filters & Lab Adjustments
*   **Analog Presets**: Select from high-fidelity custom presets like *Retro Noir (Monochrome)*, *70s Sepia (Warm Aged Film)*, *Neon Glitch (Cyberpunk)*, *Nordic Ice (Crisp Blue)*, *VHS Tape (distressed chroma)*, *Tokyo Soft (Pastel)*, and *Classic Polaroid Faded Matte*.
*   **Custom Darkroom Adjustment Sliders**: Real-time filters and adjustments including:
    *   **Brightness** (70% to 130%)
    *   **Contrast** (70% to 130%)
    *   **Saturation** (0% to 180%)
    *   **Retro Vignette** (dark-corner vignette strength slider)
    *   **Organic Film Grain** (procedurally generates high-fidelity noise grains dynamically)

### 3. ✍️ Typography & Frame Borders
*   **Custom Caption Inputs**: Input custom event names or date timestamps.
*   **Chic Font Pairings**: Choose between *Space Grotesk (Modern Bold)*, *Playfair Display (Serif/Fashion italic)*, *Courier Prime (Typewriter)*, and *Caveat (Nostalgic Handwriting)*.
*   **Premium Frame Skins**: Custom border background options like *Snow White*, *Stealth Matte Black*, *Butter Cream*, *Sakura Pink*, *Retro Newsprint Grid*, and *Acid Neon Red Grid*.

### 4. 🧸 Interactive Sticker Stamps
*   Choose from a beautiful sticker deck of emojis, hearts, sparkles, retro labels, and headwear.
*   **Canva-Style Dragging & Controls**: Click stamps to select them directly on the canvas, then use touch-responsive pointer events to **drag, scale up/down, rotate, or delete them** instantly with real-time feedback.

### 5. ⚡ Animated GIF Synthesis (AeroLoop)
*   Utilizes a fast, client-side, zero-dependency frame-quantization engine powered by `gifenc` to package your captured snapshots into a looping animated digital flipbook.

### 6. 🎥 Behind-The-Scenes Video Export
*   Captures live timelapse footage of your preparation, laughter, and poses throughout the capture session using a high-performance WebRTC `MediaRecorder` stream, compiling a beautiful video export file on the fly.

### 7. 📤 Instant Native Sharing & Printing
*   **Web Share API Integration**: Triggers native sharing sheets on iOS, Android, and compatible desktops to share actual PNGs or GIFs directly to apps like Instagram Stories, WhatsApp, Discord, or iMessage.
*   **Formatted Printing Layouts**: Formats the photo strip correctly inside the system print manager to print direct hard-copies to any standard photobooth printer.

---

## 🛠️ Tech Stack & Architecture

*   **Runtime**: React 19 + TypeScript + Vite 6
*   **Styling**: Tailwind CSS V4
*   **Icons**: Lucide React
*   **GIF Compilation**: `gifenc` (zero-dependency, high-speed quantization)
*   **Audio Synthesis**: Web Audio API (Synthesizes mechanical shutter sound and warning beep frequencies dynamically without needing static media assets)
*   **Video Recording**: Web MediaRecorder API

### Code Directory Structure
```text
/src
 ├── types.ts                # TypeScript interfaces (Photos, Stickers, Filters)
 ├── App.tsx                 # Core state machine and stepper navigator
 ├── main.tsx                # Client-entry point
 ├── index.css               # Global Tailwind CSS and noise animations
 ├── utils/
 │    └── audio.ts           # Dynamic HTML5 Web Audio Synthesizer
 └── components/
      ├── Header.tsx         # Sleek navigation and step progress indicator
      ├── WelcomeView.tsx    # Immersive landing page and instruction set
      ├── LayoutSelector.tsx # Aspect ratio and frame template picker
      ├── CameraView.tsx     # Webcam stream binder and countdown flash
      ├── CustomizePanel.tsx # Darkroom filters, caption fonts, and draggable stickers
      └── ExportPanel.tsx    # High-resolution rendering canvas and Web Share manager
```

---

## ⚙️ Development & Deployment Instructions

### Installation

To set up the project locally, install dependencies using npm:

```bash
npm install
```

### Running the Dev Server

Start the local development server on port `3000`:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Building for Production

Compile a production-ready optimized build inside the `dist/` folder:

```bash
npm run build
```

---

## 🔒 Security, Privacy, and Performance

*   **100% Client-Side**: No image data, video frame, or audio capture is ever transmitted to a server. All canvas rendering, GIF quantization, and video packaging occur locally in the user's browser sandbox.
*   **Sub-Millisecond Rendering**: Rendering previews use optimized hardware-accelerated CSS filters rather than blocking the Javascript event loop with canvas redraws, keeping the editor running at a stable 60 FPS.
*   **Zero Asset Overhead**: Shutter clicks and warning sounds are synthesized mathematically on the fly via the browser's audio nodes, eliminating cold-load network latencies.
