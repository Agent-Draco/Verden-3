import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { useAuth } from "./hooks/useAuth";

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

function MainApp() {
  const { user, loading } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenType>("map");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setActiveScreen("auth");
      } else if (activeScreen === "auth") {
        setActiveScreen("map");
      }
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground">Loading Verden Maps…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
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
          onClose={() => {
            if (user) setActiveScreen("map");
          }}
          onSuccess={() => setActiveScreen("map")}
          onOpenScreen={(screen) => setActiveScreen(screen as ScreenType)}
        />
      )}

      {activeScreen === "privacy" && (
        <PrivacyModal
          onClose={() => setActiveScreen(user ? "map" : "auth")}
          onOpenScreen={(screen) => setActiveScreen(screen as ScreenType)}
        />
      )}

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MainApp />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
