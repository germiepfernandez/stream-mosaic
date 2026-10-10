import { Suspense } from "react";
import { ViewerApp } from "@/components/viewer/viewer-app";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-zinc-950 text-sm text-zinc-500">
          Loading viewer…
        </div>
      }
    >
      <ViewerApp />
    </Suspense>
  );
}
