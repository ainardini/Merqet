export default function SafetyNudge() {
  return (
    <div
      style={{
        border: "1px dashed var(--border)",
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 12.5,
        color: "var(--text-soft)",
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <span>🛡️</span>
      <span>
        Meet in a public, well-lit spot on campus — the library or student center are good picks. Bring a friend if you can, and trust your gut if something feels off.
      </span>
    </div>
  );
}
