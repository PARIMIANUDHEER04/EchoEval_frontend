import { useEffect, useRef, useState } from "react";

export default function RadialProgress({ score, size = 80, strokeWidth = 6, className = "" }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score / 10, 0), 1);
  const offset = circumference - progress * circumference;

  const color = score >= 8 ? "#10b981" : score >= 6 ? "#f59e0b" : "#ef4444";
  const textColor = score >= 8 ? "text-emerald-600" : score >= 6 ? "text-amber-600" : "text-red-600";

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--track)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={visible ? offset : circumference}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-semibold leading-none ${textColor}`}>{score.toFixed(1)}</span>
      </div>
    </div>
  );
}
