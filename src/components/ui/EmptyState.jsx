export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className = "" }) {
  return (
    <div className={`text-center py-16 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 bg-card-hover rounded-xl flex items-center justify-center mx-auto mb-4">
          <Icon className="text-fg-faint" size={24} />
        </div>
      )}
      <h3 className="text-base font-semibold text-fg mb-1">{title}</h3>
      <p className="text-sm text-fg-muted mb-5 max-w-xs mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="px-4 py-2 bg-accent text-fg-accent text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
