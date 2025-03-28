
import React, { useEffect, useState, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive }) => {
  const [bars, setBars] = useState<number[]>(Array(20).fill(5));
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      // Generate random heights for bars when active
      intervalRef.current = window.setInterval(() => {
        const newBars = bars.map(() => 
          isActive ? Math.floor(Math.random() * 35) + 5 : 5
        );
        setBars(newBars);
      }, 100);
    } else {
      // Reset to minimal height when inactive
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
    <div className="audio-wave-container">
      {bars.map((height, index) => (
        <div
          key={index}
          className="audio-wave-bar"
          style={{ 
            height: `${height}px`,
            backgroundColor: `rgba(${30 + index * 5}, ${136 + index * 3}, ${229 - index * 5}, ${isActive ? 1 : 0.5})`,
            transition: 'height 0.2s ease, background-color 0.5s ease'
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
