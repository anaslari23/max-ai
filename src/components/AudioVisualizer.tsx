
import React, { useEffect, useState, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive }) => {
  const [bars, setBars] = useState<number[]>(Array(20).fill(5));
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setBars(prev => prev.map(() => Math.floor(Math.random() * 35) + 5));
      }, 100);
    } else {
      setBars(Array(20).fill(5));
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  return (
    <div
      className={
        `flex items-end gap-[2px] h-6 w-40 rounded-md px-1 transition-all duration-300 ` +
        (isActive ? 'bg-gradient-to-r from-teal-500/10 via-cyan-400/10 to-blue-500/10 drop-shadow-[0_0_12px_rgba(45,212,191,0.35)]' : 'bg-transparent')
      }
    >
      {bars.map((height, index) => (
        <div
          key={index}
          className="w-[3px] rounded-sm"
          style={{
            height: `${height}px`,
            backgroundColor: isActive
              ? `rgba(${30 + index * 5}, ${136 + index * 3}, ${229 - index * 5}, 1)`
              : `rgba(${30 + index * 5}, ${136 + index * 3}, ${229 - index * 5}, 0.5)`,
            transition: 'height 0.2s ease, background-color 0.4s ease'
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
