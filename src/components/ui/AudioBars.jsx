export default function AudioBars({ active = false, barCount = 5, className = "" }) {
  return (
    <div className={`flex items-end gap-[3px] h-6 ${className}`}>
      {[...Array(barCount)].map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all ${active ? "bg-red-500 animate-audio-bar" : "bg-edge h-1"}`}
          style={active ? { animationDelay: `${i * 0.12}s`, animationDuration: `${0.5 + Math.random() * 0.5}s` } : {}}
        />
      ))}
    </div>
  );
}
