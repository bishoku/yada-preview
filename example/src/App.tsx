import React, { useState } from 'react';
import { YadaPreview, useYadaDiagram, DiagramSavePayload } from 'yada-preview';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<'en' | 'tr'>('en');
  const [saveStatus, setSaveStatus] = useState<string>('');

  const sampleSrc = '/sample-diagram.png';

  const handleSave = (payload: DiagramSavePayload) => {
    setSaveStatus(`Saved diagram with ${payload.logicalData.nodes?.length || 0} nodes!`);
    setTimeout(() => setSaveStatus(''), 4000);
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 20px 80px' }}>
      <header style={{ marginBottom: 36, textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px', color: '#38bdf8' }}>
          yada-preview Showcase
        </h1>
        <p style={{ fontSize: 16, color: '#94a3b8', margin: 0 }}>
          Interactive preview & simulation player for YADA architecture diagrams in React.
        </p>

        {/* Global Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#f8fafc',
              cursor: 'pointer',
            }}
          >
            Theme: {theme.toUpperCase()}
          </button>
          <button
            onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#f8fafc',
              cursor: 'pointer',
            }}
          >
            Lang: {lang.toUpperCase()}
          </button>
        </div>
        {saveStatus && (
          <div
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#064e3b',
              color: '#6ee7b7',
              borderRadius: 8,
              display: 'inline-block',
            }}
          >
            {saveStatus}
          </div>
        )}
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {/* Section 1: Default Out-of-the-Box (Top-Right Badge) */}
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: '#e2e8f0' }}>
            1. Default Out-of-the-box (Top-Right Badge)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
            Click &ldquo;Run Simulation&rdquo; badge in top-right to start interactive simulation in place.
          </p>
          <YadaPreview
            src={sampleSrc}
            alt="Authentication Architecture"
            theme={theme}
            lang={lang}
            playButtonPosition="top-right"
          />
        </section>

        {/* Section 2: Action Toolbar with Edit Mode & Fullscreen */}
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: '#e2e8f0' }}>
            2. Toolbar Mode with Live Editor & Fullscreen Lightbox
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
            Hover top-right to reveal action toolbar: Play Simulation, Edit Diagram, Fullscreen, and Download PNG.
          </p>
          <YadaPreview
            src={sampleSrc}
            alt="Microservices Mesh"
            theme={theme}
            lang={lang}
            showToolbar={true}
            editable={true}
            allowFullscreen={true}
            onSave={handleSave}
          />
        </section>

        {/* Section 3: Center Play Overlay & Modal Mode */}
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: '#e2e8f0' }}>
            3. Center Play Button & Modal (Lightbox) Mode
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
            Plays the simulation directly inside a focused fullscreen modal without modifying inline layout.
          </p>
          <YadaPreview
            src={sampleSrc}
            alt="Order Processing Pipeline"
            theme={theme}
            lang={lang}
            mode="modal"
            playButtonPosition="center"
          />
        </section>

        {/* Section 4: Headless Hook usage */}
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: '#e2e8f0' }}>
            4. Headless Usage via <code>useYadaDiagram</code> Hook
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
            Completely custom UI leveraging the underlying hook state.
          </p>
          <HeadlessDemo src={sampleSrc} theme={theme} lang={lang} />
        </section>
      </div>
    </div>
  );
}

function HeadlessDemo({ src, theme, lang }: { src: string; theme: 'dark' | 'light'; lang: string }) {
  const {
    imageUrl,
    embedUrl,
    isSimulating,
    isLoading,
    toggleSimulation,
    projectData,
  } = useYadaDiagram({
    src,
    theme,
    lang,
  });

  return (
    <div
      style={{
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 20,
        background: '#1e293b',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <strong>Status:</strong> {isLoading ? 'Parsing PNG...' : isSimulating ? 'Simulating' : 'Static Image'}{' '}
          | <strong>Nodes:</strong> {projectData?.logicalData?.nodes?.length ?? 0}
        </div>
        <button
          onClick={toggleSimulation}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            background: isSimulating ? '#ef4444' : '#10b981',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isSimulating ? 'Stop Custom Player' : 'Launch Custom Player'}
        </button>
      </div>

      <div style={{ width: '100%', height: 360, background: '#090d16', borderRadius: 8, overflow: 'hidden' }}>
        {isSimulating ? (
          <iframe src={embedUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Headless Player" />
        ) : imageUrl ? (
          <img src={imageUrl} alt="Headless preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : null}
      </div>
    </div>
  );
}
