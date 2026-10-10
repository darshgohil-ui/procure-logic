import { lazy, Suspense } from "react";

const ComposeDemo = lazy(() => import("@/components/ui/compose-demo"));

export default function ComposeDemoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[560px] w-full items-center justify-center bg-zinc-50 text-[13px] text-zinc-500 dark:bg-zinc-950">
          Loading Compose preview…
        </div>
      }
    >
      <ComposeDemo />
    </Suspense>
  );
}
