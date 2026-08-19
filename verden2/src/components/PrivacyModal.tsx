import { useState } from "react";
import {
  Leaf,
  Shield,
  Lock,
  Eye,
  Database,
  MapPin,
  Car,
  Users,
  Server,
  ArrowLeft,
  Search,
  CheckCircle2,
  Mail,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";

interface PrivacyModalProps {
  onClose: () => void;
  onOpenScreen?: (screen: string) => void;
}

const sections = [
  {
    id: "overview",
    title: "1. Overview & Commitment",
    icon: Shield,
    summary: "Our fundamental promise regarding your privacy and environmental tracking data.",
  },
  {
    id: "data-collected",
    title: "2. Information We Collect",
    icon: Database,
    summary: "Location coordinates, vehicle specs, profile details, and telemetry data.",
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Data",
    icon: Eye,
    summary: "Calculating green routes, CO₂ offsets, carpool matches, and vehicle garage rewards.",
  },
  {
    id: "location-privacy",
    title: "4. Location Telemetry & GPS Policy",
    icon: MapPin,
    summary:
      "Real-time navigation tracking, turn-by-turn processing, and background location rules.",
  },
  {
    id: "data-sharing",
    title: "5. Third-Party Services & Integrations",
    icon: Server,
    summary: "Mapbox GL platform, Supabase cloud infrastructure, and WebGL rendering engines.",
  },
  {
    id: "cookies-storage",
    title: "6. Cookies & Local Storage",
    icon: Lock,
    summary: "Session tokens, garage unlocks, and client-side preference persistence.",
  },
  {
    id: "user-rights",
    title: "7. Your Rights & Data Control",
    icon: Users,
    summary: "Exporting, updating, or permanently deleting your account and trip logs.",
  },
  {
    id: "contact",
    title: "8. Contact Our Privacy Officer",
    icon: Mail,
    summary: "How to reach our team with questions, privacy inquiries, or deletion requests.",
  },
];

export default function PrivacyModal({ onClose, onOpenScreen }: PrivacyModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("overview");

  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground font-sans overflow-y-auto animate-scaleIn">
      {/* Background Glows */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full glass border-b border-border/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              type="button"
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary transition text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="h-6 w-[1px] bg-border hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
                <Leaf size={22} />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg tracking-tight text-foreground leading-none">
                  Verden Maps
                </span>
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  Eco Navigation & Telemetry
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 size={14} />
              GDPR & CCPA Compliant
            </span>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 relative z-10 flex-1 w-full">
        {/* Banner Section */}
        <div className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-3xl p-8 sm:p-12 mb-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Shield size={240} className="text-primary" />
          </div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
              <Sparkles size={14} />
              Privacy & Data Transparency Guarantee
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Privacy Policy
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              At Verden Maps, we believe that navigating greener shouldn&apos;t come at the cost of
              your personal privacy. This document outlines how we process location telemetry,
              vehicle specifications, and user data to deliver precise CO₂ reduction routing.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-muted-foreground border-t border-border/60 pt-6">
              <div>
                <span className="font-semibold text-foreground">Effective Date:</span> July 20, 2026
              </div>
              <div>
                <span className="font-semibold text-foreground">Version:</span> 2.4.0
              </div>
              <div>
                <span className="font-semibold text-foreground">Applies to:</span> Web, WebGL, & API
                Services
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search & Layout Split */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-4 sticky top-28 space-y-6">
            {/* Search Box */}
            <div className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-2xl p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-muted-foreground" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search privacy topics..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:border-primary transition"
                  id="privacy-search-input"
                />
              </div>
            </div>

            {/* Table of Contents Navigation */}
            <nav className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-2xl p-4 shadow-sm space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 py-2">
                Table of Contents
              </h2>
              {filteredSections.map((s) => {
                const IconComponent = s.icon;
                const isActive = activeTab === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition duration-200 text-left cursor-pointer ${
                      isActive
                        ? "gradient-eco text-white shadow-eco"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent
                        size={16}
                        className={isActive ? "text-white" : "text-primary"}
                      />
                      <span className="truncate">{s.title}</span>
                    </div>
                    <ChevronRight size={14} className={isActive ? "opacity-100" : "opacity-40"} />
                  </button>
                );
              })}
            </nav>

            {/* Quick Contact Box */}
            <div className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-primary font-display font-bold text-sm">
                <Mail size={18} />
                <span>Need Data Clarification?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Contact our Data Protection Officer directly for assistance with your account data
                or privacy rights.
              </p>
              <a
                href="mailto:privacy@verdenmaps.com"
                className="inline-flex items-center justify-center w-full py-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition"
              >
                privacy@verdenmaps.com
              </a>
            </div>
          </aside>

          {/* Right Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1 */}
            <section
              id="overview"
              className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 scroll-mt-28"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    1. Overview & Commitment
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Our foundation of trust and transparency
                  </p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-3 text-xs sm:text-sm">
                <p>
                  Verden Maps (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to
                  protecting your personal information and providing transparent disclosure about
                  how your location telemetry, car specifications, and navigation preferences are
                  processed.
                </p>
                <p>
                  This Privacy Policy applies to the Verden Maps web application, WebGL vehicle
                  garages, EcoMoov community carpool tools, and associated API endpoints located at{" "}
                  <code>/api/*</code>.
                </p>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-medium space-y-1">
                  <span className="font-bold block">Key Principle:</span>
                  Location data collected during navigation is strictly used for real-time
                  turn-by-turn routing, CO₂ emission calculation, and greenery proximity scoring. We
                  never sell your raw location logs to third-party data brokers.
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section
              id="data-collected"
              className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 scroll-mt-28"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground shadow-sm">
                  <Database size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    2. Information We Collect
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Data points required to calculate green routes
                  </p>
                </div>
              </div>
              <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <p>
                  We collect information in three main categories to deliver optimized eco-routing:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-border/80 bg-card/60 space-y-2">
                    <div className="flex items-center gap-2 font-display font-semibold text-foreground text-xs sm:text-sm">
                      <MapPin size={16} className="text-primary" />
                      Location & Telemetry Data
                    </div>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>Real-time GPS coordinates during active navigation</li>
                      <li>Travel heading, velocity, and arrival timestamps</li>
                      <li>Origin & destination search queries</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl border border-border/80 bg-card/60 space-y-2">
                    <div className="flex items-center gap-2 font-display font-semibold text-foreground text-xs sm:text-sm">
                      <Car size={16} className="text-primary" />
                      Vehicle Specifications
                    </div>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>Custom mileage rating (km/L or MPG)</li>
                      <li>Fuel type (Petrol, Diesel, Hybrid, Electric)</li>
                      <li>Unlocked WebGL vehicle garage models</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl border border-border/80 bg-card/60 space-y-2">
                    <div className="flex items-center gap-2 font-display font-semibold text-foreground text-xs sm:text-sm">
                      <Users size={16} className="text-primary" />
                      Account & EcoMoov Details
                    </div>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>Full name and authentication email address</li>
                      <li>Joined carpool groups & coordination messages</li>
                      <li>Earned green credits & route completion badges</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl border border-border/80 bg-card/60 space-y-2">
                    <div className="flex items-center gap-2 font-display font-semibold text-foreground text-xs sm:text-sm">
                      <Server size={16} className="text-primary" />
                      Technical & System Logs
                    </div>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>Browser type, user agent, and screen resolution</li>
                      <li>WebGL 3D GPU context capabilities</li>
                      <li>API request telemetry and diagnostic error reports</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section
              id="how-we-use"
              className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 scroll-mt-28"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
                  <Eye size={20} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    3. How We Use Your Data
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Powering algorithms, offsets, and community features
                  </p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-3 text-xs sm:text-sm">
                <p>Your data is processed strictly for the following functional purposes:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/60 bg-background/50">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-foreground">
                        Multi-Lens Eco Navigation & Greenery Scoring
                      </h4>
                      <p className="text-xs mt-0.5">
                        We score every route alternative across the Verden lenses (Fastest, Eco,
                        Scenic, Shade, Sun, Battery-saver) by combining your coordinates with
                        Mapbox route geometry and green-space data.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/60 bg-background/50">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-foreground">
                        Custom CO₂ Math & Fuel Multipliers
                      </h4>
                      <p className="text-xs mt-0.5">
                        Your mileage and fuel type parameters in Profile allow us to compute exact
                        tailpipe CO₂ savings compared to baseline combustion vehicles.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/60 bg-background/50">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-foreground">
                        EcoMoov Carpool Matching
                      </h4>
                      <p className="text-xs mt-0.5">
                        When you opt into EcoMoov, overlapping trip trajectories are matched to
                        suggest commute partners and display group coordination channels.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/60 bg-background/50">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                      4
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-foreground">
                        3D WebGL Vehicle Unlocks & Karts
                      </h4>
                      <p className="text-xs mt-0.5">
                        Proximity checks (&lt;35 meters) to collectible karts along routes trigger
                        car unlocks stored in your account garage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section
              id="location-privacy"
              className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 scroll-mt-28"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground shadow-sm">
                  <MapPin size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    4. Location Telemetry & GPS Policy
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Strict handling of real-time spatial positioning
                  </p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Location access is requested exclusively via the standard Browser HTML5
                  Geolocation API (<code>navigator.geolocation.watchPosition</code>).
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border border-border/60 bg-card/40">
                    <h5 className="font-display font-bold text-xs text-foreground mb-1">
                      During Active Navigation
                    </h5>
                    <p className="text-xs">
                      Coordinates are transmitted over encrypted TLS channels to query route
                      updates, update your 3D vehicle orientation on map overlays, and verify route
                      arrival.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border/60 bg-card/40">
                    <h5 className="font-display font-bold text-xs text-foreground mb-1">
                      When Navigation Ends
                    </h5>
                    <p className="text-xs">
                      GPS tracking is immediately disabled. Only the overall trip distance, route
                      polyline string, green score, and timestamp are saved to your profile trip
                      history.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section
              id="data-sharing"
              className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 scroll-mt-28"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
                  <Server size={20} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    5. Third-Party Services & Integrations
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Trusted partners enabling core map features
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <p>
                  We rely on audited infrastructure providers to serve maps, authentication, and
                  database features:
                </p>
                <div className="border border-border/60 rounded-2xl divide-y divide-border/60 overflow-hidden bg-card/30">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-display font-bold text-foreground text-xs sm:text-sm">
                        Mapbox GL Platform
                      </span>
                      <p className="text-xs">
                        Used for vector tiles, 3D terrain, WebGL overlays, geocoding, directions,
                        and isochrone discovery queries.
                      </p>
                    </div>
                    <a
                      href="https://www.mapbox.com/legal/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-semibold hover:underline shrink-0"
                    >
                      Mapbox Privacy →
                    </a>
                  </div>

                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-display font-bold text-foreground text-xs sm:text-sm">
                        Supabase Cloud Infrastructure
                      </span>
                      <p className="text-xs">
                        Provides PostgreSQL database storage with Row-Level Security (RLS) and OAuth
                        token auth.
                      </p>
                    </div>
                    <a
                      href="https://supabase.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-semibold hover:underline shrink-0"
                    >
                      Supabase Privacy →
                    </a>
                  </div>

                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-display font-bold text-foreground text-xs sm:text-sm">
                        Three.js WebGL Engine
                      </span>
                      <p className="text-xs">
                        Client-side 3D graphics rendering library operating strictly inside your
                        local browser memory.
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      Client-Side Only
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section
              id="cookies-storage"
              className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 scroll-mt-28"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground shadow-sm">
                  <Lock size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    6. Cookies & Local Storage
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    How we manage browser state and offline persistence
                  </p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Verden Maps uses standard browser <code>localStorage</code> and session cookies
                  strictly for essential app operation:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
                  <li>
                    <strong>Auth Sessions:</strong> Secure tokens maintaining your logged-in state
                    across page reloads.
                  </li>
                  <li>
                    <strong>Unlocked Garages:</strong> Local caching of 3D car models unlocked via
                    route collectibles.
                  </li>
                  <li>
                    <strong>EcoMoov Chats:</strong> Active carpool channel chat histories saved
                    locally for fast offline access.
                  </li>
                  <li>
                    <strong>Map Preferences:</strong> Selected default navigation mode (Speed, Fuel,
                    Green, or Balance).
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section
              id="user-rights"
              className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 scroll-mt-28"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    7. Your Rights & Data Control
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Full ownership over your data and trip records
                  </p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Under global data privacy laws (including GDPR and CCPA), you hold full rights
                  over your data:
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-border/60 bg-card/40 space-y-1">
                    <h5 className="font-display font-bold text-xs text-foreground">
                      Right to Access
                    </h5>
                    <p className="text-xs">
                      View all recorded trips, CO₂ calculations, and vehicle profiles directly in
                      the app.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border/60 bg-card/40 space-y-1">
                    <h5 className="font-display font-bold text-xs text-foreground">
                      Right to Rectify
                    </h5>
                    <p className="text-xs">
                      Update your mileage, fuel type, full name, or profile settings anytime.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border/60 bg-card/40 space-y-1">
                    <h5 className="font-display font-bold text-xs text-foreground">
                      Right to Erasure
                    </h5>
                    <p className="text-xs">
                      Request permanent deletion of your account and all associated trip logs from
                      our servers.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section
              id="contact"
              className="glass bg-white/80 dark:bg-card/80 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 scroll-mt-28"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground shadow-sm">
                  <Mail size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    8. Contact Our Privacy Officer
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Inquiries, rights enforcement, and privacy support
                  </p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  If you have questions, feedback, or formal data deletion requests regarding this
                  Privacy Policy, please reach out to our team:
                </p>
                <div className="p-5 rounded-2xl border border-border/60 bg-background/60 space-y-2 font-mono text-xs text-foreground">
                  <div>
                    <strong>Email:</strong> privacy@verdenmaps.com
                  </div>
                  <div>
                    <strong>Address:</strong> Verden Maps Privacy Office, Eco Technology Tower,
                    Suite 400
                  </div>
                  <div>
                    <strong>Response Time:</strong> Within 2 business days
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg gradient-eco flex items-center justify-center text-white">
              <Leaf size={14} />
            </div>
            <span className="font-display font-semibold text-foreground">Verden Maps</span>
            <span>© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onOpenScreen?.("home")}
              className="hover:text-foreground transition cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => onOpenScreen?.("map")}
              className="hover:text-foreground transition cursor-pointer"
            >
              Navigate
            </button>
            <button
              onClick={() => onOpenScreen?.("auth")}
              className="hover:text-foreground transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
