// Re-mounts on every navigation, giving each screen a short fade-in.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-in">{children}</div>;
}
