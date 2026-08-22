import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MapView from "./components/MapView";
import SettingsModal from "./components/SettingsModal";
import TripsModal from "./components/TripsModal";
import ConvoyModal from "./components/ConvoyModal";
import HomeModal from "./components/HomeModal";
import ProfileModal from "./components/ProfileModal";
import EcoMoovModal from "./components/EcoMoovModal";
import AuthModal from "./components/AuthModal";
import PrivacyModal from "./components/PrivacyModal";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";

export type ScreenType =
  | "map"
  | "settings"
  | "trips"
  | "convoy"
  | "saved"
  | "home"
  | "profile"
  | "ecomoov"
  | "auth"
  | "privacy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>("map");

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent">
      {/* Map View remains persistent across all screens once authenticated */}
      {user && (
        <MapView
          onOpenScreen={(screen) => setActiveScreen(screen)}
          activeScreen={activeScreen}
        />
      )}

          {/* Overlays / Pages */}
          {activeScreen === "settings" && (
            <SettingsModal onClose={() => setActiveScreen("map")} />
          )}

          {activeScreen === "trips" && (
            <TripsModal onClose={() => setActiveScreen("map")} />
          )}

          {activeScreen === "convoy" && (
            <ConvoyModal
              onClose={() => setActiveScreen("map")}
              onOpenScreen={(screen) => setActiveScreen(screen as ScreenType)}
            />
          )}

          {activeScreen === "home" && (
            <HomeModal
              onClose={() => setActiveScreen("map")}
              onOpenScreen={(screen) => setActiveScreen(screen as ScreenType)}
            />
          )}

          {activeScreen === "profile" && (
            <ProfileModal
              onClose={() => setActiveScreen("map")}
              onOpenScreen={(screen) => setActiveScreen(screen as ScreenType)}
            />
          )}

          {activeScreen === "ecomoov" && (
            <EcoMoovModal
              onClose={() => setActiveScreen("map")}
              onOpenScreen={(screen) => setActiveScreen(screen as ScreenType)}
            />
          )}

          {activeScreen === "auth" && (
            <AuthModal
              onClose={() => setActiveScreen("map")}
              onSuccess={() => setActiveScreen("home")}
              onOpenScreen={(screen) => setActiveScreen(screen as ScreenType)}
            />
          )}

          {activeScreen === "privacy" && (
            <PrivacyModal
              onClose={() => setActiveScreen("map")}
              onOpenScreen={(screen) => setActiveScreen(screen as ScreenType)}
            />
          )}

          <Toaster />
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
