"use client";

type RobotState = "idle" | "thinking" | "listening" | "speaking";

type Props = {
  state: RobotState;
  onOpen: () => void;
  onVoice: () => void;
};

export default function A1RobotWidget({ state, onOpen, onVoice }: Props) {
  const face = state === "thinking" ? "· ·" : state === "listening" ? "◉ ◉" : state === "speaking" ? "◡ ◡" : "• •";
  const label =
    state === "thinking" ? "စဉ်းစားနေတယ်…" :
    state === "listening" ? "နားထောင်နေတယ်" :
    state === "speaking" ? "ပြောနေတယ်" : "A1 နဲ့ပြောမယ်";

  return (
    <div className="robot-widget">
      <div className="robot-hint" aria-hidden="true">{label}</div>
      <button className={`robot-launcher robot-${state}`} onClick={onOpen} aria-label="A1 Assistant ဖွင့်ရန်">
        <span className="robot-aura" />
        <span className="robot-antenna"><i /></span>
        <span className="robot-head">
          <span className="robot-ear left" />
          <span className="robot-ear right" />
          <span className="robot-face">{face}</span>
          <span className="robot-mouth">{state === "speaking" ? "◡" : "·"}</span>
        </span>
        <span className="robot-body">
          <span className="robot-badge">A1</span>
          <span className="robot-arm left" />
          <span className="robot-arm right" />
        </span>
      </button>
      <button className="robot-mic" onClick={onVoice} aria-label="A1 voice input">🎙</button>
    </div>
  );
}
