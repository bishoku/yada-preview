# yada-preview

> **Interactive YADA Architecture Diagram Preview & Live Simulation Component for React.**

[![npm version](https://img.shields.io/npm/v/yada-preview.svg?style=flat-square)](https://www.npmjs.com/package/yada-preview)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![React 16.8 - 19](https://img.shields.io/badge/React-16.8%20|%2017%20|%2018%20|%2019-61dafb.svg?style=flat-square)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

`yada-preview` enables seamless embedding of [YADA](https://bishoku.github.io/yada/) architecture diagrams in any React project.

YADA diagrams export as portable PNG images containing embedded metadata (`tEXt` chunk) with full logical and visual simulation models. With `yada-preview`, your diagrams render instantly as high-fidelity static images, and with a single click on the play badge, transition into an interactive, live simulation inside an embedded YADA iframe.

---

## ✨ Features

- **🚀 Zero-Configuration**: Pass a PNG diagram URL, base64 data URI, `Blob`, or `File`, and it just works.
- **🔄 Live Interactive Simulation**: Seamlessly swaps the static image with an embedded YADA iframe running the live step-by-step sequence simulation.
- **📐 Zero Layout Shift (CLS)**: Automatically infers the diagram's natural aspect ratio, preventing visual layout jumps when switching between image and simulation modes.
- **✏️ Built-in Diagram Editor**: Optionally enable `editable={true}` to launch the full-featured YADA Diagram Editor modal and save modified diagrams with re-injected PNG metadata.
- **🎨 Deeply Customizable**:
  - Customizable play button position (`top-right`, `center`, `bottom-right`, etc.) or custom render functions.
  - Optional action toolbar with Play/Stop, Fullscreen Lightbox, Edit in YADA, and Download PNG.
  - Theme support (`light`, `dark`, `auto` with system preference detection).
  - Multi-language support (e.g. `en`, `tr`).
- **🪝 Headless Hook (`useYadaDiagram`)**: For developers who want complete control over their UI while utilizing robust diagram parsing and simulation state logic.
- **⚡ Broad React Compatibility**: Fully compatible with React **16.8+**, **17**, **18**, and **19**.
- **📦 Bundled LZ-String**: High-performance PNG metadata compression & decompression bundled directly with zero external runtime dependencies.
- **🛡️ Full TypeScript Support**: First-class type declarations included for ESM and CommonJS.

---

## 📦 Installation

```bash
npm install yada-preview
```

or with pnpm / yarn:

```bash
pnpm add yada-preview
# or
yarn add yada-preview
```

*(Optional) Import the default stylesheet in your root or entry file:*
```tsx
import 'yada-preview/style.css';
```
> *Note: `yada-preview` includes inline style fallbacks, so the component renders beautifully out-of-the-box even without importing the CSS file.*

---

## 🚀 Quick Start

```tsx
import React from 'react';
import { YadaPreview } from 'yada-preview';
import 'yada-preview/style.css';

export function ArchitectureView() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <YadaPreview
        src="/diagrams/system-architecture.png"
        alt="Microservices Architecture Diagram"
      />
    </div>
  );
}
```

---

## 💡 Usage Examples

### 1. Custom Play Button Placement

Place the play button in the center (video-player style), top-right, or bottom-right:

```tsx
<YadaPreview
  src="/diagrams/payment-flow.png"
  alt="Payment Gateway Flow"
  playButtonPosition="center"
/>
```

### 2. Action Toolbar & Fullscreen Lightbox

Enable the floating action toolbar to provide users with simulation playback, fullscreen modal viewing, and direct PNG downloading:

```tsx
<YadaPreview
  src="/diagrams/event-bus.png"
  alt="Event Bus Topology"
  showToolbar={true}
  allowFullscreen={true}
/>
```

### 3. Integrated Diagram Editor (`editable={true}`)

Allow users to edit the diagram directly inside YADA and capture the updated metadata and enriched PNG file:

```tsx
import React, { useState } from 'react';
import { YadaPreview, DiagramSavePayload } from 'yada-preview';

export function EditableDiagram() {
  const [diagramSrc, setDiagramSrc] = useState('/diagrams/auth-service.png');

  const handleSave = (payload: DiagramSavePayload) => {
    console.log('Updated Logical Data:', payload.logicalData);
    console.log('Updated Visual Data:', payload.visualData);

    if (payload.previewDataUri) {
      // previewDataUri contains the new PNG with embedded YADA metadata
      setDiagramSrc(payload.previewDataUri);
    }
  };

  return (
    <YadaPreview
      src={diagramSrc}
      alt="Auth Service Architecture"
      editable={true}
      showToolbar={true}
      onSave={handleSave}
    />
  );
}
```

### 4. Custom Dark/Light Theme and Language

Explicitly set dark mode or localize YADA to Turkish (`tr`) or English (`en`):

```tsx
<YadaPreview
  src="/diagrams/network-mesh.png"
  theme="dark"
  lang="tr"
/>
```

### 5. Custom Play Button Render Function

Completely customize the appearance of the trigger button using the `renderPlayButton` render prop:

```tsx
<YadaPreview
  src="/diagrams/cluster.png"
  renderPlayButton={({ isSimulating, toggle }) => (
    <button
      onClick={toggle}
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        padding: '8px 16px',
        backgroundColor: isSimulating ? '#dc2626' : '#2563eb',
        color: '#fff',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {isSimulating ? 'Stop Simulation' : 'Run Live Simulation'}
    </button>
  )}
/>
```

### 6. Modal / Lightbox Presentation Mode

In `'modal'` mode, clicking the play button keeps the inline image and opens a focused fullscreen lightbox dialog with the running simulation:

```tsx
<YadaPreview
  src="/diagrams/data-pipeline.png"
  mode="modal"
/>
```

### 7. Headless Hook (`useYadaDiagram`)

Need full control over the UI? Use the `useYadaDiagram` hook to manage binary loading, metadata extraction, and simulation states:

```tsx
import React from 'react';
import { useYadaDiagram } from 'yada-preview';

export function CustomDiagramPlayer({ src }: { src: string }) {
  const {
    imageUrl,
    embedUrl,
    isSimulating,
    isLoading,
    toggleSimulation,
  } = useYadaDiagram({ src });

  if (isLoading) return <div>Loading diagram...</div>;

  return (
    <div className="custom-card">
      <div className="custom-media">
        {isSimulating ? (
          <iframe src={embedUrl} title="Custom YADA Player" width="100%" height={500} />
        ) : (
          <img src={imageUrl!} alt="Diagram" width="100%" />
        )}
      </div>
      <button onClick={toggleSimulation}>
        {isSimulating ? 'Switch to Image' : 'Play Simulation'}
      </button>
    </div>
  );
}
```

---

## 📖 Component Props Reference

### `<YadaPreview />`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string \| Blob \| File \| Uint8Array \| ArrayBuffer` | `undefined` | PNG diagram source (URL, Data URI, File, or raw buffer). |
| `projectData` | `YadaDiagramData` | `undefined` | Direct diagram JSON payload (skips PNG metadata extraction if provided). |
| `alt` | `string` | `'YADA Architecture Diagram'` | Alternate text for the preview image. |
| `mode` | `'inline' \| 'modal'` | `'inline'` | Presentation mode for the simulation. |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme passed to YADA (detects system preference when `'auto'`). |
| `lang` | `string` | `'en'` | Language code for YADA (e.g., `'en'`, `'tr'`). |
| `yadaUrl` | `string` | `'https://bishoku.github.io/yada/'` | Base URL of the YADA host. |
| `autoPlay` | `boolean` | `false` | Automatically starts simulation once diagram data is loaded. |
| `isSimulating` | `boolean` | `undefined` | Controlled simulation state. |
| `onSimulationChange` | `(isSimulating: boolean) => void` | `undefined` | Callback fired when simulation state changes. |
| `editable` | `boolean` | `false` | Enables YADA diagram editor integration. |
| `showPlayButton` | `boolean` | `true` | Whether to display the play button badge. |
| `playButtonPosition` | `'top-right' \| 'bottom-right' \| 'center' \| 'top-left' \| 'bottom-left' \| 'none'` | `'top-right'` | Position of the play button. |
| `showToolbar` | `boolean` | `false` | Displays the floating action toolbar. |
| `allowFullscreen` | `boolean` | `true` | Allows expanding diagram into a fullscreen lightbox. |
| `aspectRatio` | `number \| string` | `auto` | Container aspect ratio (auto-inferred from natural image size). |
| `width` | `string \| number` | `'100%'` | Container width constraint. |
| `height` | `string \| number` | `'auto'` | Container height constraint. |
| `className` | `string` | `''` | Root container CSS class. |
| `style` | `CSSProperties` | `undefined` | Root container inline CSS. |
| `imageClassName` | `string` | `''` | CSS class for static `<img>` element. |
| `iframeClassName` | `string` | `''` | CSS class for simulation `<iframe>` element. |
| `renderPlayButton` | `(props: PlayButtonRenderProps) => ReactNode` | `undefined` | Custom play button render prop. |
| `renderToolbar` | `(props: ToolbarRenderProps) => ReactNode` | `undefined` | Custom toolbar render prop. |
| `loadingPlaceholder`| `ReactNode` | `undefined` | Custom loader while extracting metadata. |
| `errorPlaceholder` | `(error: Error) => ReactNode` | `undefined` | Custom error renderer. |
| `onSimulationStart`| `() => void` | `undefined` | Fired when simulation playback begins. |
| `onSimulationStop` | `() => void` | `undefined` | Fired when simulation playback stops. |
| `onSave` | `(payload: DiagramSavePayload) => void` | `undefined` | Fired when changes are saved in the editor. |
| `onMetadataExtracted` | `(data: YadaDiagramData) => void` | `undefined` | Fired when PNG metadata is loaded. |
| `onError` | `(error: Error) => void` | `undefined` | Fired on fetch or extraction failure. |
| `onLoad` | `() => void` | `undefined` | Fired when preview image loads. |

---

## 🛠️ Standalone Components & Utilities

`yada-preview` exports several standalone components and utilities for advanced use cases:

```tsx
import {
  // Components
  YadaPreview,
  YadaSimulationIframe,
  YadaEditorModal,
  YadaModalPreview,

  // Hook
  useYadaDiagram,

  // Utilities
  extractPngMetadata,
  injectPngMetadata,
  resolveBinaryBytes,
  buildYadaEmbedUrl,
  buildYadaEditorUrl,
} from 'yada-preview';
```

### Metadata Extraction & Injection:

```ts
import { extractPngMetadata, injectPngMetadata } from 'yada-preview';

// Extract metadata from a PNG ArrayBuffer or Uint8Array
const diagramData = extractPngMetadata(pngUint8Array);
console.log(diagramData.logicalData, diagramData.visualData);

// Inject updated metadata into a PNG buffer
const updatedPngBytes = injectPngMetadata(pngUint8Array, 'YADA_DIAGRAM', {
  logicalData: { ... },
  visualData: { ... },
});
```

---

## 🤝 React Compatibility

| React Version | Supported |
| :--- | :--- |
| **React 16.8+ / 17** | ✅ Fully supported (Standard React hooks) |
| **React 18** | ✅ Fully supported |
| **React 19** | ✅ Fully supported |
| **Next.js (App & Pages Router)** | ✅ Supported (`'use client'` compatible) |
| **Vite / Remix / CRA** | ✅ Supported |

---

## 📄 License

MIT © [barishoku](https://github.com/barishoku)
