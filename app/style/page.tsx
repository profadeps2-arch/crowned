const occasions = [
  "Owambe",
  "Church",
  "Office",
  "Friday wear",
  "Aso ebi",
  "Date night",
  "Traditional wedding",
  "White wedding",
  "Interview",
  "Hangout",
  "Travel",
];

export default function StylePage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-12">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#B08D57]">Style Me</p>
        <h1 className="text-4xl font-semibold">Oya King, where are you going?</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        {occasions.map((occasion) => (
          <div
            key={occasion}
            className="rounded-full border border-[#E3DACB] bg-[#FBF8F2] px-5 py-3"
          >
            {occasion}
          </div>
        ))}
      </div>
    </main>
  );
}
