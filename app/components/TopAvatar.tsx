import Avatar from "./Avatar";
import Crown from "./Crown";
import SoundToggle from "./SoundToggle";

// Whether to show this bar at all is decided by AppShell.
export default function TopAvatar() {
  return (
    <header className="bar sticky top-0 z-30 flex items-center justify-between px-5 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.2em] text-navy">
        <Crown size={18} className="text-orange" strokeWidth={1.6} />
        CROWNED
      </div>
      <div className="flex items-center gap-3">
        <SoundToggle />
        <Avatar />
      </div>
    </header>
  );
}
