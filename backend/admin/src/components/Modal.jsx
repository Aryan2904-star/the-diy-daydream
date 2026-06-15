// Centered modal dialog. Click outside (overlay) or × to close.
export default function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        style={wide ? { maxWidth: 680 } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
