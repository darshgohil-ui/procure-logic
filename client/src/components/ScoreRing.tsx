import { useEffect, useState, useMemo } from "react";
import { motion, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { EASE_CINEMATIC } from "@/lib/motion";

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  context?: string;
  confidence?: string;
  className?: string;
}

export function ScoreRing({
  score,
  maxScore = 100,
  size = 148,
  strokeWidth = 7.5,
  label = "Weighted score",
  context = "Known evidence score",
  confidence = "94% confidence",
  className = "",
}: ScoreRingProps) {
  const shouldReduceMotion = useReducedMotion();
  const radius = (size - strokeWidth * 2.5) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetPercent = Math.min(Math.max(score / maxScore, 0), 1);

  // Precision spring with high damping for a calm, weighted instrument feel
  const springValue = useSpring(0, {
    stiffness: 42,
    damping: 20,
    mass: 0.9,
  });

  const displayScore = useTransform(springValue, (current) =>
    Math.round(current * maxScore)
  );

  const strokeDashoffset = useTransform(
    springValue,
    (current) => circumference * (1 - current)
  );

  // Compute tip position for the leading beacon dot
  const tipAngle = useTransform(springValue, (current) => current * 360 - 90);
  const tipX = useTransform(tipAngle, (angle) => {
    const rad = (angle * Math.PI) / 180;
    return size / 2 + radius * Math.cos(rad);
  });
  const tipY = useTransform(tipAngle, (angle) => {
    const rad = (angle * Math.PI) / 180;
    return size / 2 + radius * Math.sin(rad);
  });

  const [scoreText, setScoreText] = useState(0);

  useEffect(() => {
    springValue.set(shouldReduceMotion ? targetPercent : targetPercent);
  }, [targetPercent, springValue, shouldReduceMotion]);

  useEffect(() => {
    return displayScore.on("change", (latest) => {
      setScoreText(latest);
    });
  }, [displayScore]);

  // Generate 48 dial calibration tick marks around the ring
  const ticks = useMemo(() => {
    const count = 48;
    const tickRadius = radius - 8;
    const items = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      const isMajor = i % 12 === 0;
      const isMid = i % 4 === 0;
      const length = isMajor ? 5 : isMid ? 3.5 : 2;
      const x1 = size / 2 + (tickRadius - length) * Math.cos(rad);
      const y1 = size / 2 + (tickRadius - length) * Math.sin(rad);
      const x2 = size / 2 + tickRadius * Math.cos(rad);
      const y2 = size / 2 + tickRadius * Math.sin(rad);

      items.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        opacity: isMajor ? 0.35 : isMid ? 0.18 : 0.08,
        strokeWidth: isMajor ? 1.5 : 1,
      });
    }
    return items;
  }, [radius, size]);

  return (
    <motion.div
      className={`score-block-modern ${className}`}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE_CINEMATIC }}
    >
      <div className="score-ring-wrapper" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="score-svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="scoreEmeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Subtle Ambient Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + strokeWidth / 2 + 4}
            fill="none"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={1}
          />

          {/* Inner Calibration Dial Ticks */}
          <g className="score-ticks" aria-hidden="true">
            {ticks.map((tick) => (
              <line
                key={tick.id}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="#34d399"
                strokeOpacity={tick.opacity}
                strokeWidth={tick.strokeWidth}
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />

          {/* Animated Main Score Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#scoreEmeraldGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset,
              transformOrigin: "center",
              transform: "rotate(-90deg)",
              filter: "url(#emeraldGlow)",
            }}
          />

          {/* Leading Beacon Dot at Current Progress Tip */}
          {!shouldReduceMotion && score > 0 && (
            <motion.circle
              cx={tipX}
              cy={tipY}
              r={strokeWidth / 2 + 1}
              fill="#ecfdf5"
              stroke="#059669"
              strokeWidth={1.5}
              style={{
                filter: "drop-shadow(0 0 6px rgba(52, 211, 153, 0.9))",
              }}
            />
          )}
        </svg>

        {/* Center Editorial Score Readout */}
        <div className="score-center-content">
          <motion.span
            className="score-number"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.15, ease: EASE_CINEMATIC }}
          >
            {scoreText}
          </motion.span>
          <span className="score-denom">/{maxScore}</span>
        </div>
      </div>

      {/* Editorial Text Readout */}
      <div className="score-text-stack">
        <span className="score-caption-label">{label}</span>
        <span className="score-context-label">{context}</span>
        <span className="score-confidence-pill">
          <span className="confidence-dot" /> {confidence}
        </span>
      </div>
    </motion.div>
  );
}
