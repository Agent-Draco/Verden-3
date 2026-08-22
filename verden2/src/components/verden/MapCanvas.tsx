/**
 * Hydration-safe wrapper for VerdenMap.
 */

import { Suspense, lazy, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import type { VerdenMapProps } from "./VerdenMap";

const VerdenMap = lazy(() => import("./VerdenMap"));

function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={`${className ?? "w-full h-full"} grid place-items-center bg-transparent`} />
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

  // On native platform, native Android MapView renders hardware-accelerated underneath
  if (Capacitor.isNativePlatform()) {
    return <div className={`${props.className ?? "w-full h-full"} bg-transparent pointer-events-none`} />;
  }

  return (
    <Suspense fallback={<MapSkeleton className={props.className} />}>
      <VerdenMap {...props} />
    </Suspense>
  );
}
