import { Suspense } from "react";
import CustomizeView from "./CustomizeView";

// Reads the occasion Today passes in the address, so it renders at request time.
export default function CustomizePage() {
  return (
    <Suspense
      fallback={
        <main className="flex animate-pulse flex-col gap-6 px-5 pt-4" aria-busy="true">
          <div className="h-8 w-56 rounded bg-sand" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-[20px] bg-sand" />
            ))}
          </div>
        </main>
      }
    >
      <CustomizeView />
    </Suspense>
  );
}
