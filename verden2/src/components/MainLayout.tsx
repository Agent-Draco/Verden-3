import { useState } from "react";
import MapView from "./MapView";
import SettingsModal from "./SettingsModal";
import TripsModal from "./TripsModal";
import ConvoyModal from "./ConvoyModal";
import HomeModal from "./HomeModal";
import ProfileModal from "./ProfileModal";
import EcoMoovModal from "./EcoMoovModal";
import AuthModal from "./AuthModal";
import PrivacyModal from "./PrivacyModal";
import { Toaster } from "./ui/sonner";

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

export default function MainLayout() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>("map");

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent">
      {/* Map View remains persistent across all screens */}
      <MapView
        onOpenScreen={(screen) => setActiveScreen(screen)}
        activeScreen={activeScreen}
      />

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
  );
}
