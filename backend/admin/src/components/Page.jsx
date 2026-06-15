// Standard page wrapper: sticky topbar (title + optional actions) + content area.
export default function Page({ title, subtitle, actions, children }) {
  return (
    <>
      <div className="topbar">
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="sub">{subtitle}</div>}
        </div>
        {actions}
      </div>
      <div className="content">{children}</div>
    </>
  );
}
