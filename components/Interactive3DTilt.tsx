'use client';

import { ReactNode, useRef, useState, MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface Interactive3DTiltProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number; // Maximum tilt rotation degrees
}

export function Interactive3DTilt({
  children,
  className = '',
  maxTilt = 12,
}: Interactive3DTiltProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Motion values to store relative X/Y coordinate ratios (-0.5 to 0.5)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Spring physics setup for ultra-smooth buttery-like movement without layout lag (60fps)
  const springConfig = { damping: 25, stiffness: 220, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), springConfig);

  // Shimmer specular highlight tracking
  const glareX = useSpring(useTransform(x, [0, 1], [0, 100]), springConfig);
  const glareY = useSpring(useTransform(y, [0, 1], [0, 100]), springConfig);
  const glareOpacity = useSpring(useTransform(x, [0, 1], [0.08, 0.22]), springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate fractional ratios (0 to 1) relative to container width/height
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;

    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    // Smoothly reset spring physics back to resting center position (0.5)
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none transform-gpu ${className}`}
      style={{
        perspective: '1000px', // Creates 3D depth field context
      }}
    >
      <motion.div
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="w-full h-full will-change-transform"
      >
        {/* Children element inside the 3D target */}
        <div style={{ transform: 'translateZ(0px)' }} className="w-full h-full relative z-10">
          {children}
        </div>

        {/* Realistic moving glass glare layer */}
        {hovered && (
          <motion.div
            style={{
              background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%)`,
              opacity: glareOpacity,
              transform: 'translateZ(25px)', // Place reflection slightly on top of the surface
            }}
            className="absolute inset-0 z-20 pointer-events-none rounded-[inherit] mix-blend-overlay transition-opacity duration-200"
          />
        )}
      </motion.div>
    </div>
  );
}
