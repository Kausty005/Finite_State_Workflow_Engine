import React, { useEffect, useRef } from 'react';

interface MosaicBackgroundProps {
  className?: string;
}

export const MosaicBackground: React.FC<MosaicBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking for subtle interactive lighting
    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Tile configuration matching the mosaic design
    const tileSize = 20;
    const gap = 3;
    const step = tileSize + gap;
    const borderRadius = 2.5;

    let time = 0;

    const render = () => {
      time += 0.015;

      // Deep dark canvas background
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, width, height);

      const cols = Math.ceil(width / step) + 1;
      const rows = Math.ceil(height / step) + 1;
      const centerX = width * 0.5;
      const centerY = height * 0.35;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * step;
          const y = j * step;

          // Radial vignette lighting from top-center
          const dxCenter = (x - centerX) / (width * 0.55);
          const dyCenter = (y - centerY) / (height * 0.55);
          const distCenterSq = dxCenter * dxCenter + dyCenter * dyCenter;
          const vignette = Math.max(0, 1 - Math.sqrt(distCenterSq) * 0.85);

          // Multi-frequency gentle wave shimmer (continuous, smooth ambient fluid)
          const wave1 = Math.sin(x * 0.008 + y * 0.006 + time * 1.2);
          const wave2 = Math.cos(x * 0.012 - y * 0.009 + time * 0.8);
          const wave3 = Math.sin((x + y) * 0.005 + time * 0.5);
          const waveShimmer = (wave1 + wave2 + wave3) / 3;

          // Proximity glow to cursor
          const distToMouse = Math.hypot(x + tileSize / 2 - mouseX, y + tileSize / 2 - mouseY);
          const mouseGlow = Math.max(0, 1 - distToMouse / 220);

          // Combined luminosity (gentle, dark-navy & slate tones - no bright silver/white)
          let brightness = 0.03 + vignette * 0.10 + (waveShimmer + 1) * 0.04 + mouseGlow * 0.22;

          // Subtle cluster coherence (organic gentle pulse, smooth and harmonious)
          const clusterHash = Math.sin(i * 12.9898 + j * 78.233 + Math.floor(time * 0.35)) * 43758.5453;
          const clusterFactor = clusterHash - Math.floor(clusterHash);
          if (clusterFactor > 0.94 && vignette > 0.35) {
            brightness += 0.08 * Math.sin(time * 2.5 + i + j);
          }

          brightness = Math.min(Math.max(brightness, 0.02), 0.45);

          // Deep navy / slate-cyan palette (calm, dark, aesthetic - perfectly matching FlowState)
          const r = Math.round(12 + brightness * 90);
          const g = Math.round(18 + brightness * 130);
          const b = Math.round(32 + brightness * 170);
          const alpha = 0.35 + brightness * 0.55;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, tileSize, tileSize, borderRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, tileSize, tileSize);
          }

          // Very subtle highlight border on tiles
          if (brightness > 0.2) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${brightness * 0.25})`;
            ctx.lineWidth = 0.75;
            ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
          }
        }
      }

      // Smooth radial vignette overlay to blend seamlessly into UI cards
      const radialGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        width * 0.15,
        centerX,
        centerY,
        width * 0.75
      );
      radialGradient.addColorStop(0, 'rgba(5, 8, 17, 0.1)');
      radialGradient.addColorStop(0.5, 'rgba(5, 8, 17, 0.45)');
      radialGradient.addColorStop(1, 'rgba(5, 8, 17, 0.9)');

      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
