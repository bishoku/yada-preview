import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { YadaPreview } from '../components/YadaPreview';
import { injectPngMetadata, DEFAULT_YADA_KEYWORD } from '../utils/pngMetadata';
import { getMinimalPngBytes, sampleYadaPayload } from './fixtures/samplePng';

describe('<YadaPreview /> component', () => {
  const getEnrichedBytes = () => {
    const raw = getMinimalPngBytes();
    return injectPngMetadata(raw, DEFAULT_YADA_KEYWORD, sampleYadaPayload);
  };

  it('renders static image and default top-right play button', async () => {
    const bytes = getEnrichedBytes();
    render(<YadaPreview src={bytes} alt="Test Architecture" />);

    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Test Architecture' });
      expect(img).toBeInTheDocument();
    });

    const playBtn = screen.getByRole('button', { name: /Start Live Simulation/i });
    expect(playBtn).toBeInTheDocument();
    expect(playBtn.className).toContain('yada-preview-pos-top-right');
  });

  it('respects different play button positions', async () => {
    const bytes = getEnrichedBytes();
    const { rerender } = render(
      <YadaPreview src={bytes} playButtonPosition="bottom-right" />
    );

    let playBtn = screen.getByRole('button', { name: /Start Live Simulation/i });
    expect(playBtn.className).toContain('yada-preview-pos-bottom-right');

    rerender(<YadaPreview src={bytes} playButtonPosition="center" />);
    playBtn = screen.getByRole('button', { name: /Start Live Simulation/i });
    expect(playBtn.className).toContain('yada-preview-pos-center');
  });

  it('transitions from image to simulation iframe when play button is clicked', async () => {
    const bytes = getEnrichedBytes();
    const onSimulationStart = vi.fn();
    const onSimulationStop = vi.fn();

    render(
      <YadaPreview
        src={bytes}
        alt="Sim Test"
        onSimulationStart={onSimulationStart}
        onSimulationStop={onSimulationStop}
      />
    );

    // Wait for binary to resolve and image to render
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Sim Test' })).toBeInTheDocument();
    });

    const playBtn = screen.getByRole('button', { name: /Start Live Simulation/i });
    act(() => {
      fireEvent.click(playBtn);
    });

    expect(onSimulationStart).toHaveBeenCalledTimes(1);

    // Iframe should now be rendered with embed and share hash
    const iframe = screen.getByTitle('Sim Test');
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toContain('embed=true');
    expect(iframe.getAttribute('src')).toContain('#share=');

    // Button should now allow stopping simulation
    const stopBtn = screen.getByRole('button', { name: /Stop Live Simulation/i });
    expect(stopBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(stopBtn);
    });
    expect(onSimulationStop).toHaveBeenCalledTimes(1);

    // Should return to image
    await waitFor(() => {
      expect(screen.queryByTitle('Sim Test')).not.toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Sim Test' })).toBeInTheDocument();
    });
  });

  it('starts simulation and opens iframe in modal mode when play button is clicked', async () => {
    const bytes = getEnrichedBytes();
    const onSimulationStart = vi.fn();
    const onSimulationStop = vi.fn();

    render(
      <YadaPreview
        src={bytes}
        alt="Modal Diagram"
        mode="modal"
        onSimulationStart={onSimulationStart}
        onSimulationStop={onSimulationStop}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Modal Diagram' })).toBeInTheDocument();
    });

    const playBtn = screen.getByRole('button', { name: /Start Live Simulation/i });
    act(() => {
      fireEvent.click(playBtn);
    });

    expect(onSimulationStart).toHaveBeenCalledTimes(1);

    // Modal should be open with simulation iframe
    await waitFor(() => {
      const modalCloseBtn = screen.getByTitle('Close Fullscreen');
      expect(modalCloseBtn).toBeInTheDocument();
    });

    const iframe = screen.getByTitle('Modal Diagram');
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toContain('#share=');

    // Inside modal, clicking toggle button switches to static image
    const modalToggleBtn = screen.getByRole('button', { name: /Static View/i });
    expect(modalToggleBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(modalToggleBtn);
    });
    expect(onSimulationStop).toHaveBeenCalledTimes(1);

    // Modal toggle button should now offer to Run Simulation again
    const modalRunBtn = screen.getByRole('button', { name: /Run Simulation/i });
    expect(modalRunBtn).toBeInTheDocument();

    // Clicking Run Simulation inside modal resumes simulation
    act(() => {
      fireEvent.click(modalRunBtn);
    });
    expect(onSimulationStart).toHaveBeenCalledTimes(2);

    // Closing modal stops simulation
    const closeBtn = screen.getByTitle('Close Fullscreen');
    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(onSimulationStop).toHaveBeenCalledTimes(2);
  });

  it('opens YADA editor modal in mode=modal when edit button is clicked', async () => {
    const bytes = getEnrichedBytes();
    render(
      <YadaPreview
        src={bytes}
        alt="Editable Diagram"
        showToolbar={true}
        editable={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Editable Diagram' })).toBeInTheDocument();
    });

    const editBtn = screen.getByTitle(/Edit Diagram in YADA/i);
    act(() => {
      fireEvent.click(editBtn);
    });

    // Editor modal should open with mode=modal and without #share= (which would trigger playback)
    await waitFor(() => {
      const editorIframe = screen.getByTitle('Edit Editable Diagram');
      expect(editorIframe).toBeInTheDocument();
      expect(editorIframe.getAttribute('src')).toContain('mode=modal');
      expect(editorIframe.getAttribute('src')).not.toContain('#share=');
    });
  });

  it('supports custom renderPlayButton', async () => {
    const bytes = getEnrichedBytes();
    render(
      <YadaPreview
        src={bytes}
        renderPlayButton={({ isSimulating, toggle }) => (
          <button data-testid="custom-play" onClick={toggle}>
            {isSimulating ? 'Custom Stop' : 'Custom Play'}
          </button>
        )}
      />
    );

    const customBtn = screen.getByTestId('custom-play');
    expect(customBtn).toHaveTextContent('Custom Play');

    act(() => {
      fireEvent.click(customBtn);
    });
    expect(customBtn).toHaveTextContent('Custom Stop');
  });

  it('renders toolbar with simulation, fullscreen, and download buttons', async () => {
    const bytes = getEnrichedBytes();
    render(<YadaPreview src={bytes} showToolbar={true} editable={true} />);

    await waitFor(() => {
      expect(screen.getByTitle(/Start Live Simulation/i)).toBeInTheDocument();
    });

    expect(screen.getByTitle(/Edit Diagram in YADA/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Fullscreen Lightbox View/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Download Diagram PNG/i)).toBeInTheDocument();
  });

  it('supports controlled simulation state via isSimulating prop', async () => {
    const bytes = getEnrichedBytes();
    const { rerender } = render(
      <YadaPreview src={bytes} alt="Controlled Diag" isSimulating={false} />
    );

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Controlled Diag' })).toBeInTheDocument();
    });
    expect(screen.queryByTitle('Controlled Diag')).not.toBeInTheDocument();

    rerender(<YadaPreview src={bytes} alt="Controlled Diag" isSimulating={true} />);

    expect(screen.getByTitle('Controlled Diag')).toBeInTheDocument();
  });

  it('renders custom error placeholder on load failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    render(
      <YadaPreview
        src="https://non-existent-server/diagram.png"
        errorPlaceholder={(err) => <div data-testid="custom-error">{err.message}</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    });
  });
});
