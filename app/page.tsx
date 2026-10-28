import Link from "next/link";
import { Crown } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col justify-between px-6 py-16">
      <div className="flex items-center gap-2 text-[#B08D57]">
        <Crown size={18} />
        <p className="text-xs uppercase tracking-[0.3em]">Crowned</p>
      </div>

      <div className="flex flex-col gap-5">
        <h1 className="text-5xl font-semibold leading-tight">
          Every man is a king. Dress like one.
        </h1>
        <p className="text-[#5C5648]">
          Your outfit, sorted in 1 minute. For owambe, office, church and every moment in between.
        </p>
      </div>

      <Link
        href="/wardrobe"
        className="rounded-full bg-[#1F2A44] py-4 text-center font-medium text-[#F5F0E6]"
      >
        Start with my wardrobe
      </Link>
    </main>
  );

}
