import { Suspense } from "react";
import TodayView from "./TodayView";

// The greeting and date depend on the visitor's clock, so the view streams in
// at request time instead of being frozen at build time.
export default function TodayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex animate-pulse flex-col gap-6 px-5 pt-4" aria-busy="true">
          <div className="flex flex-col gap-2">
            <div className="h-3 w-32 rounded bg-sand" />
            <div className="h-8 w-56 rounded bg-sand" />
          </div>
          <div className="h-44 rounded-[20px] bg-sand" />
        </main>
      }
    >
      <TodayView />
    </Suspense>
  );
}
