import React, { useMemo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export type WheelStyle = 'classic' | 'neon' | 'minimal' | 'luxury' | 'custom';

interface WheelProps {
  options: string[];
  onSpinStart?: () => void;
  onSpinEnd: (result: string, index: number) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  wheelStyle?: WheelStyle;
  bgImage?: string | null;
  winningIndex?: number | null;
  optionImages?: (string | null)[];
  fontColor?: string;
}

const STYLE_COLORS: Record<WheelStyle, string[]> = {
  classic: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA', '#F1948A', '#85C1E9'],
  neon: ['#FF00FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000', '#FF8000', '#8000FF', '#0000FF'],
  minimal: ['#F8FAFC', '#F1F5F9', '#E2E8F0', '#CBD5E1', '#94A3B8'],
  luxury: ['#1A1A1A', '#2D2D2D', '#C0C0C0', '#D4AF37', '#E5E4E2'],
  custom: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)']
};

export const Wheel: React.FC<WheelProps> = ({ 
  options, 
  onSpinStart,
  onSpinEnd, 
  isSpinning, 
  setIsSpinning,
  wheelStyle = 'classic',
  bgImage,
  winningIndex,
  optionImages = [],
  fontColor = '#ffffff'
}) => {
  const controls = useAnimation();
  const rotationRef = React.useRef(0);

  const colors = STYLE_COLORS[wheelStyle];

  const getSectorPath = (startAngle: number, endAngle: number, radius: number = 50) => {
    const points = [];
    points.push("50,50");
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + (endAngle - startAngle) * (i / steps);
      const x = 50 + radius * Math.cos((Math.PI * (a - 90)) / 180);
      const y = 50 + radius * Math.sin((Math.PI * (a - 90)) / 180);
      points.push(`${x},${y}`);
    }
    return `M ${points.join(" L ")} Z`;
  };

  const slices = useMemo(() => {
    const angle = 360 / options.length;
    return options.map((option, i) => {
      const startAngle = i * angle;
      const endAngle = (i + 1) * angle;
      
      const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
      const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
      const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
      const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      return {
        pathData,
        color: colors[i % colors.length],
        label: option,
        midAngle: startAngle + angle / 2,
        startAngle,
        endAngle
      };
    });
  }, [options, wheelStyle, colors]);

  const spin = async () => {
    if (isSpinning || options.length < 2) return;
    
    onSpinStart?.();
    setIsSpinning(true);
    const extraSpins = 12 + Math.random() * 8;
    const totalRotation = rotationRef.current + extraSpins * 360 + Math.random() * 360;
    
    await controls.start({
      rotate: totalRotation,
      transition: {
        duration: 7,
        ease: [0.1, 0, 0.1, 1]
      }
    });
    
    rotationRef.current = totalRotation;
    const normalizedRotation = totalRotation % 360;
    const winningAngle = (360 - normalizedRotation) % 360;
    const sliceAngle = 360 / options.length;
    const winningIndex = Math.floor(winningAngle / sliceAngle);
    
    onSpinEnd(options[winningIndex], winningIndex);
    setIsSpinning(false);
  };

  return (
    <div className="relative w-full max-w-[400px] aspect-square mx-auto group">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className={cn(
          "w-8 h-10 shadow-lg clip-path-pointer flex items-center justify-center",
          wheelStyle === 'luxury' ? "bg-yellow-500" : "bg-white"
        )}>
            <div className={cn(
              "w-4 h-6 clip-path-pointer",
              wheelStyle === 'neon' ? "bg-cyan-400 shadow-[0_0_10px_#22d3ee]" : "bg-red-500"
            )} />
        </div>
      </div>

      {/* Wheel Container */}
      <div
        className={cn(
          "w-full h-full rounded-full overflow-hidden relative border-8 isolate",
          wheelStyle === 'classic' && "border-white shadow-[0_0_50px_rgba(0,0,0,0.1)]",
          wheelStyle === 'neon' && "border-slate-900 shadow-[0_0_30px_rgba(34,211,238,0.3)] bg-slate-950",
          wheelStyle === 'minimal' && "border-slate-200 shadow-none bg-white",
          wheelStyle === 'luxury' && "border-yellow-600 shadow-[0_0_40px_rgba(202,138,4,0.2)] bg-slate-900",
          wheelStyle === 'custom' && "border-white shadow-[0_0_40px_rgba(0,0,0,0.1)] bg-slate-100"
        )}
      >
        {/* Background Image Layer (Expansion) */}
        <AnimatePresence>
          {bgImage && winningIndex !== null && slices[winningIndex] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-10 rounded-full overflow-hidden"
            >
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full"
                style={{ transform: `rotate(${rotationRef.current}deg)`, transformOrigin: 'center' }}
              >
                <defs>
                  <mask id="winner-mask">
                    <motion.path
                      initial={{ d: getSectorPath(slices[winningIndex].startAngle, slices[winningIndex].endAngle) }}
                      animate={{ d: getSectorPath(slices[winningIndex].startAngle, slices[winningIndex].startAngle + 360) }}
                      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                      fill="white"
                    />
                  </mask>
                </defs>
                <g mask="url(#winner-mask)">
                  <image
                    href={bgImage}
                    x="0" y="0" width="100" height="100"
                    preserveAspectRatio="xMidYMid slice"
                    transform={`rotate(${slices[winningIndex].midAngle} 50 50)`}
                  />
                </g>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rotating Wheel Layer */}
        <motion.div
          animate={controls}
          className="w-full h-full"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            {options.map((_, i) => (
              <clipPath key={`clip-${i}`} id={`slice-clip-${i}`}>
                <path d={slices[i].pathData} />
              </clipPath>
            ))}
          </defs>
          {slices.map((slice, i) => (
            <g key={i}>
              {wheelStyle === 'custom' && optionImages[i] ? (
                <g clipPath={`url(#slice-clip-${i})`}>
                  <image
                    href={optionImages[i]!}
                    x="0" y="0" width="100" height="100"
                    preserveAspectRatio="xMidYMid slice"
                    transform={`rotate(${slice.midAngle} 50 50)`}
                    className={bgImage ? "opacity-0" : "opacity-100"}
                  />
                </g>
              ) : (
                <path
                  d={slice.pathData}
                  fill={bgImage ? 'transparent' : slice.color}
                  stroke={bgImage ? 'rgba(255,255,255,0.2)' : (wheelStyle === 'neon' ? '#0f172a' : (wheelStyle === 'custom' ? 'rgba(255,255,255,0.3)' : 'white'))}
                  strokeWidth={wheelStyle === 'minimal' ? '0.2' : '0.5'}
                  className={cn(
                    wheelStyle === 'neon' && "opacity-80"
                  )}
                />
              )}
              {!bgImage && (
                <g transform={`rotate(${slice.midAngle} 50 50)`}>
                  <text
                    x="50"
                    y="15"
                    fill={fontColor}
                    fontSize="5"
                    fontWeight="900"
                    textAnchor="middle"
                    className={cn(
                      "select-none pointer-events-none",
                      (wheelStyle !== 'minimal' && wheelStyle !== 'custom') && "drop-shadow-sm",
                      wheelStyle === 'custom' && "drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
                    )}
                    transform="rotate(90 50 15)"
                  >
                    {slice.label.length > 8 ? slice.label.substring(0, 8) + '...' : slice.label}
                  </text>
                </g>
              )}
            </g>
          ))}
          {/* Center Circle */}
          {!bgImage && (
            <>
              <circle 
                cx="50" cy="50" r="4" 
                fill={wheelStyle === 'luxury' ? '#ca8a04' : (wheelStyle === 'custom' ? 'rgba(255,255,255,0.5)' : 'white')} 
                className="shadow-md" 
              />
              <circle 
                cx="50" cy="50" r="2" 
                fill={wheelStyle === 'neon' ? '#22d3ee' : (wheelStyle === 'custom' ? '#fff' : '#333')} 
              />
            </>
          )}
        </svg>
      </motion.div>
    </div>

      {/* Spin Button Overlay */}
      <button
        onClick={spin}
        disabled={isSpinning || options.length < 2}
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30",
          "w-20 h-20 rounded-full flex items-center justify-center font-bold transition-all duration-300",
          "hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
          bgImage && "opacity-40 hover:opacity-100",
          wheelStyle === 'classic' && "bg-white text-slate-800 shadow-xl border-4 border-slate-100",
          wheelStyle === 'neon' && "bg-slate-900 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] border-2 border-cyan-400",
          wheelStyle === 'minimal' && "bg-white text-slate-600 shadow-md border border-slate-200",
          wheelStyle === 'luxury' && "bg-slate-900 text-yellow-500 shadow-2xl border-2 border-yellow-600",
          wheelStyle === 'custom' && "bg-white/80 backdrop-blur-sm text-slate-800 shadow-xl border-2 border-white"
        )}
      >
        {isSpinning ? '...' : 'SPIN'}
      </button>

      <style>{`
        .clip-path-pointer {
          clip-path: polygon(50% 100%, 0 0, 100% 0);
        }
      `}</style>
    </div>
  );
};
