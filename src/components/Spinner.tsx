// components/Spinner.tsx
import React from 'react';

interface SpinnerProps {
  size?: number;
  dotSize?: number;
  color?: string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 60,
  dotSize = 10,
  color = '#621E21',
  className = '',
}) => {
  const center = size / 2;
  const radius = size / 2 - dotSize / 2 - 2; // Radius for dot placement, -2 for a little padding

  // Calculate positions for 3 dots
  const dotPositions = [
    {
      cx: center + radius * Math.cos(0), // 0 degrees
      cy: center + radius * Math.sin(0),
      delay: '0s',
    },
    {
      cx: center + radius * Math.cos((2 * Math.PI) / 3), // 120 degrees
      cy: center + radius * Math.sin((2 * Math.PI) / 3),
      delay: '0.2s',
    },
    {
      cx: center + radius * Math.cos((4 * Math.PI) / 3), // 240 degrees
      cy: center + radius * Math.sin((4 * Math.PI) / 3),
      delay: '0.4s',
    },
  ];

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Loading content"
        role="status"
      >
        <style>
          {`
            @keyframes pulse {
              0%, 80%, 100% {
                transform: scale(0.5);
                opacity: 0.5;
              }
              40% {
                transform: scale(1);
                opacity: 1;
              }
            }
            .pulsing-dot {
              animation: pulse 1.2s infinite ease-in-out both;
              transform-origin: center center;
            }
          `}
        </style>
        <g fill={color}>
          {dotPositions.map((pos, i) => (
            <circle
              key={i}
              className="pulsing-dot"
              cx={pos.cx}
              cy={pos.cy}
              r={dotSize / 2}
              style={{ animationDelay: pos.delay }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default Spinner;
