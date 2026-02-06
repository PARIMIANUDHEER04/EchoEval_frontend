export default function GlowCard({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-edge rounded-xl hover:border-edge-hover hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
}
