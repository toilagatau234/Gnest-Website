'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.6,
}: ScrollRevealProps) {
  // Define animation offsets based on direction
  const directions = {
    up: { y: 25, x: 0 },
    down: { y: -25, x: 0 },
    left: { y: 0, x: 25 },
    right: { y: 0, x: -25 },
    none: { y: 0, x: 0 },
  };

  const offset = directions[direction];

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...offset,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{ once: true, margin: '-100px 0px' }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.21, 1.02, 0.43, 1.01], // Slick hardware-accelerated feel
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
