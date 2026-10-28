export default function WardrobePage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-12">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#B08D57]">Your collection</p>
        <h1 className="text-4xl font-semibold">Wardrobe</h1>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[#CFC4B0] px-6 py-16 text-center">
        <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
          Your wardrobe is empty.
        </p>
        <p className="text-sm text-[#5C5648]">
          Add 5 pieces you wear often, and we will style your first outfit.
        </p>
        <button className="mt-4 rounded-full bg-[#1F2A44] px-6 py-3 text-sm font-medium text-[#F5F0E6]">
          Add your first piece
        </button>
      </div>
    </main>
  );
}
