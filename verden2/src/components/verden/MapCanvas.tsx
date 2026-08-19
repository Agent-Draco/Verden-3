/**
 * Hydration-safe wrapper for VerdenMap. mapbox-gl touches window at import
 * time, so the module is only ever imported in the browser.
 */

import { Suspense, lazy, useEffect, useState } from "react";
import type { VerdenMapProps } from "./VerdenMap";

const VerdenMap = lazy(() => import("./VerdenMap"));

function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={`${className ?? "w-full h-full"} grid place-items-center bg-secondary`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
        Loading map…
      </div>
    </div>
  );
}

export default function MapCanvas(props: VerdenMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === "undefined") {
    return <MapSkeleton className={props.className} />;
  }

  return (
    <Suspense fallback={<MapSkeleton className={props.className} />}>
      <VerdenMap {...props} />
    </Suspense>
  );
}

