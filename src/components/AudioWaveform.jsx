import { useEffect, useRef } from 'react';

const BAR_COUNT = 96;
const FFT_SIZE = 256;

export default function AudioWaveform({ stream, active = true, className = '' }) {
  const containerRef = useRef(null);
  const barsRef = useRef([]);

  useEffect(() => {
    if (!stream || !active) return undefined;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return undefined;

    const audioContext = new AudioContextCtor();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    let frameId = 0;

    const draw = () => {
      analyser.getByteFrequencyData(data);
      const bars = barsRef.current;
      const binStep = Math.max(1, Math.floor(data.length / BAR_COUNT));
      for (let i = 0; i < bars.length; i += 1) {
        const node = bars[i];
        if (!node) continue;
        const value = data[i * binStep] || 0;
        const scale = Math.max(0.04, value / 255);
        node.style.transform = `scaleY(${scale})`;
      }
      frameId = window.requestAnimationFrame(draw);
    };

    frameId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frameId);
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {
        // ignore disconnect errors
      }
      audioContext.close().catch(() => {});
    };
  }, [stream, active]);

  return (
    <div
      ref={containerRef}
      className={`flex h-10 w-full items-center justify-between gap-[2px] overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          ref={(node) => {
            barsRef.current[i] = node;
          }}
          className="block h-full w-[2px] origin-center rounded-full bg-ds-foreground-muted"
          style={{ transform: 'scaleY(0.04)', transition: 'transform 60ms linear' }}
        />
      ))}
    </div>
  );
}
