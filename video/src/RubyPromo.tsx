// Orchestrator — zero logic, only Sequence layout
import { AbsoluteFill, Sequence } from "remotion";
import { Cena1_Abertura } from "./Cena1_Abertura";
import { Cena2_Landing } from "./Cena2_Landing";
import { Cena3_Dashboard } from "./Cena3_Dashboard";
import { Cena4_FlowEditor } from "./Cena4_FlowEditor";
import { Cena5_Outro } from "./Cena5_Outro";

// 21s @ 30fps = 630 frames total
// Cena1: 0–90    (3s)  — Logo reveal
// Cena2: 90–240  (5s)  — Landing page
// Cena3: 240–390 (5s)  — Dashboard
// Cena4: 390–540 (5s)  — Flow Editor
// Cena5: 540–630 (3s)  — Outro/CTA

export const RubyPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={90} name="Abertura">
        <Cena1_Abertura />
      </Sequence>
      <Sequence from={90} durationInFrames={150} name="Landing">
        <Cena2_Landing />
      </Sequence>
      <Sequence from={240} durationInFrames={150} name="Dashboard">
        <Cena3_Dashboard />
      </Sequence>
      <Sequence from={390} durationInFrames={150} name="FlowEditor">
        <Cena4_FlowEditor />
      </Sequence>
      <Sequence from={540} durationInFrames={90} name="Outro">
        <Cena5_Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
