// Cena 1 — Abertura / Logo Reveal (0-3s, 90 frames relativo)
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, fontFamily, PARTICLES } from "./tokens";

export const Cena1_Abertura: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo scale: spring in from 0
  const logoScale = spring({ frame, fps, config: { mass: 1, damping: 20, stiffness: 120 } });
  // Logo opacity
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Glow ring pulse
  const ringScale = spring({ frame: Math.max(0, frame - 10), fps, config: { mass: 1, damping: 15, stiffness: 80 } });
  const ringOpacity = interpolate(frame, [10, 25, 70, 90], [0, 0.6, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Tagline typing effect: "Automação inteligente para seu negócio"
  const tagline = "Automação inteligente para seu negócio";
  const charsVisible = Math.floor(interpolate(frame, [30, 75], [0, tagline.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const taglineText = tagline.slice(0, charsVisible);
  const taglineOpacity = interpolate(frame, [28, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Particles fade in
  const particleOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Subtle radial glow behind logo
  const glowOpacity = interpolate(frame, [0, 20, 70, 90], [0, 0.4, 0.4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDark, fontFamily, overflow: "hidden" }}>
      {/* Particles */}
      {PARTICLES.map((p, i) => {
        const py = (p.y - frame * p.speed * 8 + 1920) % 1920;
        return (
          <div key={i} style={{
            position: "absolute", left: p.x, top: py,
            width: p.size, height: p.size, borderRadius: "50%",
            backgroundColor: p.color, opacity: p.opacity * particleOpacity,
          }} />
        );
      })}

      {/* Radial glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -55%)",
        width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.brand500}40 0%, transparent 70%)`,
        opacity: glowOpacity,
      }} />

      {/* Glow ring */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -55%) scale(${ringScale})`,
        width: 320, height: 320, borderRadius: "50%",
        border: `2px solid ${C.brand500}`,
        boxShadow: `0 0 40px ${C.brand500}60, inset 0 0 40px ${C.brand500}20`,
        opacity: ringOpacity,
      }} />

      {/* Logo */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -55%) scale(${logoScale})`,
        opacity: logoOpacity,
      }}>
        <Img src={staticFile("logo-icon.png")} style={{ width: 200, height: 200 }} />
      </div>

      {/* Tagline */}
      <div style={{
        position: "absolute", top: "58%", width: "100%",
        textAlign: "center", opacity: taglineOpacity,
      }}>
        <span style={{
          fontSize: 36, fontWeight: 600, color: C.white,
          letterSpacing: -0.5,
        }}>
          {taglineText}
        </span>
        {charsVisible < tagline.length && (
          <span style={{
            fontSize: 36, fontWeight: 600, color: C.brand500,
            opacity: frame % 16 < 8 ? 1 : 0,
          }}>|</span>
        )}
      </div>
    </AbsoluteFill>
  );
};
