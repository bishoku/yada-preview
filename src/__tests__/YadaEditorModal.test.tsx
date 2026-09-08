import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { YadaEditorModal } from '../components/YadaEditorModal';
import { getMinimalPngBytes } from './fixtures/samplePng';

describe('<YadaEditorModal /> component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <YadaEditorModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog and iframe when isOpen is true', () => {
    render(
      <YadaEditorModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        title="Custom Architecture Editor"
      />
    );

    expect(screen.getByText('Custom Architecture Editor')).toBeInTheDocument();
    expect(screen.getByTitle('Custom Architecture Editor')).toBeInTheDocument();
  });

  it('handles postMessage protocol: READY -> LOAD_DIAGRAM', async () => {
    const postMessageSpy = vi.fn();

    render(
      <YadaEditorModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialMetadata={{
          logicalData: { nodes: [{ id: 'test', name: 'Test Node' }] },
          visualData: { canvas: { zoom: 1 } },
        }}
      />
    );

    const iframe = screen.getByTitle('YADA Diagram Editor') as HTMLIFrameElement;
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage: postMessageSpy },
      writable: true,
    });

    // Simulate iframe sending READY
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'READY' },
      })
    );

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'LOAD_DIAGRAM',
        payload: expect.objectContaining({
          logicalJson: expect.stringContaining('Test Node'),
        }),
      }),
      '*'
    );
  });

  it('handles postMessage protocol: SAVE_DIAGRAM', async () => {
    const onSave = vi.fn();
    const sourceBytes = getMinimalPngBytes();

    render(
      <YadaEditorModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        sourceBytes={sourceBytes}
      />
    );

    // Simulate iframe sending SAVE_DIAGRAM
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'SAVE_DIAGRAM',
          payload: {
            logicalJson: JSON.stringify({ nodes: [{ id: 'saved-node' }] }),
            visualJson: JSON.stringify({ canvas: { zoom: 2 } }),
          },
        },
      })
    );

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        logicalData: { nodes: [{ id: 'saved-node' }] },
        visualData: { canvas: { zoom: 2 } },
        pngBlob: expect.any(Blob),
      })
    );
  });

  it('handles postMessage protocol: CLOSE_DIAGRAM', () => {
    const onClose = vi.fn();
    render(<YadaEditorModal isOpen={true} onClose={onClose} onSave={vi.fn()} />);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'CLOSE_DIAGRAM' },
      })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal on Escape key press', () => {
    const onClose = vi.fn();
    render(<YadaEditorModal isOpen={true} onClose={onClose} onSave={vi.fn()} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
