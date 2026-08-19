import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Composition,
} from "remotion";
import React from "react";

export const IntroComposition = () => {
  return (
    <Composition
      id="Intro"
      component={IntroVideo}
      durationInFrames={150} // 5 seconds at 30 fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

const IntroVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background fade-in / fade-out
  const opacity = interpolate(frame, [0, 15, 135, 150], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Spring animation for the logo container
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
    delay: 10,
  });

  // SVG dash offset for circular outline drawing
  const circleOffset = interpolate(frame, [15, 45], [314, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slide up and fade in for text
  const textY = interpolate(frame, [30, 50], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle slide and fade
  const subY = interpolate(frame, [45, 65], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sparkles/particles floating
  const particleProgress = interpolate(frame, [0, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle, #022c22 0%, #010f0a 100%)",
        color: "white",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      {/* Decorative ambient light */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(60px)",
        }}
      />

      {/* Floating eco particles */}
      {[...Array(12)].map((_, i) => {
        const seed = i * 23.4;
        const xStart = (seed % 100) - 50; // -50% to 50%
        const yStart = ((seed * 7) % 100) + 50; // 50% to 150%
        const size = (seed % 8) + 4; // 4 to 12px
        const speed = (seed % 2) + 0.5;
        const currentY = yStart - particleProgress * 300 * speed;
        const pOpacity = interpolate(currentY, [0, 100, 1000], [0, 0.6, 0.6]);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: "#34d399",
              boxShadow: "0 0 8px #10b981",
              left: `calc(50% + ${xStart}vw)`,
              top: `${currentY}vh`,
              opacity: pOpacity,
            }}
          />
        );
      })}

      {/* Logo container */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "32px",
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(20px)",
            border: "1px rgba(255, 255, 255, 0.08) solid",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3), 0 0 30px rgba(16, 185, 129, 0.2)",
            position: "relative",
          }}
        >
          {/* Drawing circle outer border */}
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transform: "rotate(-90deg)",
            }}
            viewBox="0 0 120 120"
          >
            <rect
              x="5"
              y="5"
              width="110"
              height="110"
              rx="28"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray="440"
              strokeDashoffset={circleOffset * 1.4}
              style={{
                filter: "drop-shadow(0 0 6px #10b981)",
              }}
            />
          </svg>

          {/* Leaf Icon SVG */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34d399"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: "drop-shadow(0 0 10px rgba(52, 211, 153, 0.5))",
            }}
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 0 9.5a7 7 0 0 1-8 8.5z" />
            <path d="M19 2c-2.26 9.04-8 10-14 14" />
          </svg>
        </div>
      </div>

      {/* App Name */}
      <h1
        style={{
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
          fontSize: 84,
          fontWeight: 800,
          margin: 0,
          background: "linear-gradient(to right, #ffffff, #a7f3d0)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-2px",
          textAlign: "center",
        }}
      >
        Verden Maps
      </h1>

      {/* Subtitle */}
      <p
        style={{
          transform: `translateY(${subY}px)`,
          opacity: subOpacity,
          fontSize: 28,
          color: "#a7f3d0",
          opacity: subOpacity * 0.75,
          fontWeight: 500,
          margin: "15px 0 0 0",
          letterSpacing: "0.5px",
          textAlign: "center",
        }}
      >
        Navigate the world. Save the planet.
      </p>
    </AbsoluteFill>
  );
};
