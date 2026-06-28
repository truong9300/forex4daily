# AI Photo Editor

A powerful, browser-based AI photo editor built with React + TypeScript — inspired by Adobe Photoshop.

## Features

### Editing Tools
- **Select** — Move and select elements
- **Crop** — Crop image to custom dimensions
- **Brush** — Paint with custom size, color, and opacity
- **Eraser** — Erase parts of the image
- **Heal** — Heal blemishes and imperfections
- **Clone Stamp** — Clone areas of the image
- **Text** — Add text overlays
- **Shape** — Draw shapes
- **Eyedropper** — Sample colors
- **Zoom & Pan** — Navigate the canvas

### Adjustments (16 sliders)
- Light: Exposure, Brightness, Contrast, Highlights, Shadows, Whites, Blacks
- Color: Temperature, Tint, Saturation, Vibrance, Hue
- Detail: Sharpness, Clarity, Noise Reduction
- Effects: Vignette

### Filters (11 presets)
Original, Vivid, Warm, Cool, Sepia, B&W, Vintage, Noir, Fade, Chrome, Lomo

### AI Features
- **Remove Background** — AI-powered background removal
- **Auto Enhance** — Smart one-click enhancement
- **AI Upscale** — 2x resolution upscaling
- **Denoise** — Noise reduction
- **Colorize** — Add color to B&W photos

### Layer Support
- Multiple layers with visibility toggle
- Blend modes
- Opacity control

### Export
- PNG, JPEG, WebP formats
- Flip horizontal/vertical
- Rotate 90° CW/CCW

## Tech Stack
- **React 19** + **TypeScript**
- **Vite 8** — Fast build tooling
- **TensorFlow.js** — Browser-based AI (no server required)
- Canvas API for pixel-perfect image processing

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start editing!

## Usage
1. Drag & drop an image or use **File → Open Image**
2. Use the left toolbar to select tools
3. Adjust with the right panel (Adjustments, Filters, Layers, AI)
4. Export via **File → Export as PNG/JPEG/WebP**

All processing happens **locally in your browser** — no images are uploaded.
