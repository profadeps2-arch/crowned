import Avatar from "./Avatar";
import Crown from "./Crown";

// Whether to show this bar at all is decided by AppShell.
export default function TopAvatar() {
  return (
    <header className="flex items-center justify-between px-6 pt-[calc(1.25rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 text-xs font-bold tracking-[0.24em] text-navy">
        <Crown size={18} className="text-orange" strokeWidth={1.6} />
        CROWNED
      </div>
      <Avatar />
    </header>
  );
}
