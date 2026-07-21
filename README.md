# 📸 DigiSmile Photobooth Studio 📸

> **Capture Every Smile, Print Every Memory**  
> Powered by **Razel Tech** | Official Company Website: [https://razeltech.github.io](https://razeltech.github.io)

<p align="center">
  <img src="assets/logo.png" alt="DigiSmile Photobooth Logo" width="140" />
</p>

---

## ✨ Overview

**DigiSmile Photobooth Studio** is a high-performance, responsive web application and Progressive Web App (PWA) designed for creating vintage 35mm photo strips, single-shot portrait cards, 2x2 quad-box collages, and Polaroid-style photos directly inside your web browser. 

Built with zero framework build dependencies using native **Vanilla HTML5, CSS3, and ES6 JavaScript**, it is 100% optimized for instant 1-click deployment on **GitHub Pages**.

---

## 🚀 Key Features

- 📱 **2-Page Dynamic Architecture**:
  - **Home Page (`index.html`)**: Dynamic landing page featuring Hero Section, Feature Highlights, 100% Data Privacy Guarantee, Use Case Gallery, and Theme Previews.
  - **Photobooth Studio App (`booth.html`)**: Dedicated interactive photobooth studio workspace with live webcam feed, real-time filters, single frame retakes, and canvas stitching.
- 📲 **Native Progressive Web App (PWA)**:
  - Installable on iOS (Safari), Android (Chrome), and Desktop as a standalone native app (`manifest.json` + `sw.js`).
  - Includes a sleek floating **Bottom Install Banner Popup** for 1-tap mobile home screen installation.
- 🎛️ **Quick 1-Tap 3-Column Filter Grid**:
  - Adjustable grid below camera stream for instant 1-tap filter switching (**Silver B&W**, **Polaroid SX-70**, **Instax Color**, **Kodachrome**, **Sepia**, **35mm Color**).
- 📷 **Authentic Polaroid i-Type Proportions**:
  - Exact `3.5 × 4.2 in` print specifications with 1:1 square photo slot area and `0.9 in` bottom handwriting chin.
- 🎨 **Custom Color Palette Picker**:
  - Pick custom background paper colors and frame border edge colors with live real-time preview sync.
- 📱 **Native Web Share API File Integration**:
  - One-tap direct sharing to **WhatsApp, Instagram Stories, Telegram, Photos, or Messages** using native OS share sheets (`ShareEngine.shareCanvasFile()`).
- ⌨️ **Keyboard Accessibility Shortcuts**:
  - Press **`Spacebar`** to trigger shutter, **`Delete`/`Backspace`** to remove sticker props, and **`Escape`** to deselect.
- 👆 **Auto Countdown vs Manual Shutter Toggle**:
  - Switch between automatic timer countdown loops or manual click-to-shoot shutter mode per photo.
- 🔄 **Individual Frame Retake & Retake All**:
  - Hover over any captured photo slot to click **`🔄 Retake`** and re-capture *just that single photo* without re-taking the entire strip!
- 🎬 **Real-Time Live Viewfinder Shaders**:
  - Live webcam stream displays selected filters in real-time before taking photos:
    - **🎞️ Silver Gelatin Vintage B&W** (Authentic photobooth print)
    - **📸 Polaroid SX-70 Instant Film**
    - **🌸 Fujifilm Instax Color**
    - **☀️ 1970s Warm Kodachrome**
    - **🌾 Vintage Sepia Nostalgia**
    - **🎨 Vibrant 35mm Color**
- 🎛️ **Custom Filter Tuning Sliders**:
  - Real-time controls for Exposure / Brightness, Contrast Intensity, Warmth / Sepia Tint, and Color Saturation.
- 🖼️ **Paper Stock & Custom Background Uploads**:
  - Vintage Cardstock, 35mm Filmstrip sprocket holes, Teared Paper Cut Edges, Birthday Confetti, Valentine Hearts, or upload custom image patterns with opacity and blend mode controls.
- ✍️ **100% Pure Custom Text & Typography (Zero Hardcoded Text)**:
  - Custom Top Caption, Custom Bottom Tagline, Custom Timestamp Formatting (Date Only, Date & Time, Custom String, or Hide Timestamp), and separate font family choices (Cursive Handwriting, Bold Geometric, Retro Monospace, Serif).
- 🔊 **Authentic DSLR Mechanical Shutter Audio**:
  - Web Audio API synthesizer generating realistic camera feedback (mirror thump, shutter snap, and film advance winder tick).
- 🛡️ **100% In-Browser Data Privacy**:
  - Zero cloud servers. All video streams, image filters, custom uploads, and exports are processed 100% locally inside the user's browser.

---

## 📂 Repository Structure

```
PhotoboothPro/
├── index.html           # Dynamic Home Landing Page
├── booth.html           # Dedicated Photobooth Studio App
├── css/
│   └── style.css        # Master Design System, Dark Palette & Dropdowns
├── js/
│   ├── audio.js         # Web Audio API DSLR Shutter Synthesizer
│   ├── camera.js        # MediaStream Hardware Manager & Mirror Logic
│   ├── filters.js       # Emulsion Shader Engine & Custom Tuning Sliders
│   ├── strip.js         # Canvas Layout, Text & Stacking Engine
│   ├── pwa.js           # PWA Service Worker & Install Banner Popup
│   ├── share.js         # Native Web Share API File Integration
│   ├── gif.js           # Animated GIF Motion Exporter
│   └── app.js           # Master UI Controller & State Manager
├── assets/
│   ├── logo.png         # 35mm Film Wrapped RT Logo (512x512)
│   └── favicon.png      # High-Res Favicon Icon
├── manifest.json        # PWA Web Application Manifest
├── sw.js                # Service Worker for Offline Caching
├── LICENSE              # Strict Proprietary License (All Rights Reserved)
└── README.md            # Senior Developer Documentation
```

---

## ⚡ Deployment to GitHub Pages (3-Step Setup)

1. **Commit and push** all project files to your GitHub repository (`https://github.com/razeltech/PhotoboothPro`).
2. Navigate to your repository **Settings** > **Pages**.
3. Under **Branch**, select `main` (or `master`) and `/root`, then click **Save**.

Your live website will be accessible instantly at:  
👉 **`https://razeltech.github.io/PhotoboothPro/`**

---

## 📜 Copyright & License

Copyright (c) 2026 **Razel Tech** ([https://razeltech.github.io](https://razeltech.github.io)). **All Rights Reserved.**  
Licensed under the [Strict Proprietary License](LICENSE). Unauthorized copying, reproduction, or redistribution is strictly prohibited.
