import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Composition,
} from "remotion";
import React from "react";

export const DashboardLoadingComposition = () => {
  return (
    <Composition
      id="DashboardLoading"
      component={DashboardLoadingVideo}
      durationInFrames={300} // 10 seconds at 30 fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

const DashboardLoadingVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Overall fade-in/out
  const opacity = interpolate(frame, [0, 15, 285, 300], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Calculate loading percentage
  const percent = Math.min(
    100,
    Math.round(
      interpolate(frame, [0, 270], [0, 100], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );

  // Sequences of technical console messages
  const getLogMessage = (f: number) => {
    if (f < 45) return "> Initializing Verden Maps Routing Engine...";
    if (f < 105) return "> Connecting to Google Maps Platform (TRAFFIC_AWARE_OPTIMAL)...";
    if (f < 165) return "> Querying local forestry data & tree canopy coverage...";
    if (f < 225) return "> Calculating Speed, Fuel, Green (Scenic), and Balanced paths...";
    if (f < 270) return "> Syncing eco credits and carbon footprint index...";
    return "> Sync complete! Launching dashboard...";
  };

  // Concentric radar rings rotations
  const ring1Rotation = interpolate(frame, [0, 300], [0, 360]);
  const ring2Rotation = interpolate(frame, [0, 300], [360, 0]);
  const ring3Rotation = interpolate(frame, [0, 300], [0, -720]);

  // Glow pulsing of the core node
  const glowScale = interpolate(
    Math.sin((frame / 30) * Math.PI * 2),
    [-1, 1],
    [0.9, 1.1]
  );

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle, #012017 0%, #000c08 100%)",
        color: "white",
        fontFamily: "'Courier New', Courier, monospace",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 100px",
        opacity,
        boxSizing: "border-box",
      }}
    >
      {/* HUD Background Tech Grid Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(16, 185, 129, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* LEFT SIDE: Console & Logs & Progress */}
      <div
        style={{
          width: "55%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          zIndex: 10,
        }}
      >
        <div style={{ color: "#34d399", fontSize: 20, fontWeight: "bold", letterSpacing: "1.5px", marginBottom: 10 }}>
          SYSTEM BOOTSTRAP TELEMETRY
        </div>
        <div
          style={{
            height: 220,
            background: "rgba(2, 44, 34, 0.4)",
            border: "1px solid rgba(16, 185, 129, 0.15)",
            borderRadius: 20,
            padding: 30,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {frame >= 0 && (
              <div style={{ color: "#a7f3d0", opacity: 0.5, fontSize: 16 }}>
                [OK] SECURE CONNECTION ESTABLISHED TO SUPABASE
              </div>
            )}
            {frame >= 45 && (
              <div style={{ color: "#a7f3d0", opacity: 0.7, fontSize: 16 }}>
                [OK] GOOGLE PLACES API: RADIAL 30KM BIAS ACTIVE
              </div>
            )}
            {frame >= 165 && (
              <div style={{ color: "#a7f3d0", opacity: 0.9, fontSize: 16 }}>
                [OK] PARKS DETECTED IN ROUTE VIEWPORT: 14 REGIONS FOUND
              </div>
            )}
          </div>

          <div
            style={{
              color: "#6ee7b7",
              fontSize: 18,
              fontWeight: "bold",
              textShadow: "0 0 8px rgba(110, 231, 183, 0.5)",
              animation: "pulse 1.5s infinite",
            }}
          >
            {getLogMessage(frame)}
          </div>
        </div>

        {/* Sleek green progress bar */}
        <div style={{ marginTop: 50 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <span style={{ color: "#34d399", fontSize: 18, fontWeight: "bold" }}>LOAD PROGRESS</span>
            <span style={{ color: "#34d399", fontSize: 24, fontWeight: "bold" }}>{percent}%</span>
          </div>
          <div
            style={{
              height: 24,
              width: "100%",
              background: "rgba(16, 185, 129, 0.05)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: 12,
              padding: 3,
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
                borderRadius: 8,
                boxShadow: "0 0 15px #10b981",
              }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Animated Radar Graphics */}
      <div
        style={{
          width: "40%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Ambient background glow behind radar */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Central Spinning Radar Ring 1 */}
        <svg
          style={{
            width: 480,
            height: 480,
            position: "absolute",
            transform: `rotate(${ring1Rotation}deg)`,
          }}
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="90" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="10, 40" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.5" />
          <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.5" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.5" />
        </svg>

        {/* Spinning Radar Ring 2 */}
        <svg
          style={{
            width: 380,
            height: 380,
            position: "absolute",
            transform: `rotate(${ring2Rotation}deg)`,
          }}
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(52, 211, 153, 0.2)" strokeWidth="1" strokeDasharray="1, 8" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(52, 211, 153, 0.08)" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="40, 20" />
        </svg>

        {/* Spinning Radar Ring 3 */}
        <svg
          style={{
            width: 280,
            height: 280,
            position: "absolute",
            transform: `rotate(${ring3Rotation}deg)`,
          }}
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="75" fill="none" stroke="#6ee7b7" strokeWidth="0.75" strokeDasharray="120, 240" />
        </svg>

        {/* Pulsing GPS Center Indicator */}
        <div
          style={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1.5px solid #10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)",
            transform: `scale(${glowScale})`,
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: "drop-shadow(0 0 6px #10b981)",
            }}
          >
            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>

        {/* Random Pulsing Tech Nodes */}
        {[
          { top: "25%", left: "30%", delay: 0 },
          { top: "68%", left: "20%", delay: 15 },
          { top: "35%", left: "75%", delay: 30 },
          { top: "72%", left: "70%", delay: 45 },
        ].map((node, i) => {
          const nodeFrame = (frame - node.delay) % 60;
          const nodeOpacity = interpolate(nodeFrame, [0, 15, 60], [0, 0.8, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const nodeScale = interpolate(nodeFrame, [0, 60], [0.6, 1.3], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: node.top,
                left: node.left,
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: "#10b981",
                opacity: nodeOpacity,
                transform: `scale(${nodeScale})`,
                boxShadow: "0 0 10px #34d399",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
