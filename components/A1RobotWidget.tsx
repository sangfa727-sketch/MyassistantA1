"use client";

import { useState } from "react";

type RobotState = "idle" | "thinking" | "listening" | "speaking";
export type WidgetVariant = "glass" | "robot";

type Props = {
  state: RobotState;
  variant: WidgetVariant;
  onVariantChange: (variant: WidgetVariant) => void;
  onOpen: () => void;
  onVoice: () => void;
};

export default function A1RobotWidget({
  state,
  variant,
  onVariantChange,
  onOpen,
  onVoice,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const label =
    state === "thinking" ? "ခဏစဉ်းစားနေတယ်…" :
    state === "listening" ? "အာရုံစိုက်နားထောင်နေတယ် 💙" :
    state === "speaking" ? "မင်းနဲ့စကားပြောနေတယ် ✨" :
    "A1 နဲ့ပြောမယ် 💙";

  function choose(next: WidgetVariant) {
    onVariantChange(next);
    setPickerOpen(false);
  }

  if (variant === "glass") {
    return (
      <div className="a1-widget-shell">
        <div className={`widget-picker ${pickerOpen ? "open" : ""}`}>
          <button className="widget-settings" onClick={() => setPickerOpen(v => !v)} aria-label="Widget style ရွေးရန်" aria-expanded={pickerOpen}>⚙</button>
          {pickerOpen && (
            <div className="widget-picker-menu" role="menu">
              <button className="widget-option active" onClick={() => choose("glass")} role="menuitem">◇ <span>Glassmorphism</span><b>✓</b></button>
              <button className="widget-option" onClick={() => choose("robot")} role="menuitem">🤖 <span>Cute Robot</span></button>
            </div>
          )}
        </div>
        <div className="glass-widget-hint">{label}</div>
        <button className={`glass-widget glass-${state}`} onClick={onOpen} aria-label="A1 Assistant ဖွင့်ရန်">
          <span className="glass-orb">A1</span>
          <span className="glass-copy"><strong>A1</strong><small>{state === "thinking" ? "Thinking…" : "Assistant"}</small></span>
          <span className="glass-status" />
        </button>
        <button className="glass-mic" onClick={onVoice} aria-label="A1 voice input">🎙</button>
      </div>
    );
  }

  return (
    <div className="a1-widget-shell robot-shell">
      <div className={`widget-picker ${pickerOpen ? "open" : ""}`}>
        <button className="widget-settings" onClick={() => setPickerOpen(v => !v)} aria-label="Widget style ရွေးရန်" aria-expanded={pickerOpen}>⚙</button>
        {pickerOpen && (
          <div className="widget-picker-menu" role="menu">
            <button className="widget-option" onClick={() => choose("glass")} role="menuitem">◇ <span>Glassmorphism</span></button>
            <button className="widget-option active" onClick={() => choose("robot")} role="menuitem">🤖 <span>Cute Robot</span><b>✓</b></button>
          </div>
        )}
      </div>

      <div className={`robot-hint robot-hint-${state}`} aria-hidden="true">
        <span className="robot-hint-dot" />{label}
      </div>

      <button className={`robot-launcher robot-${state}`} onClick={onOpen} aria-label="A1 Assistant ဖွင့်ရန်">
        <span className="robot-aura" />
        <span className="robot-aura-ring" />
        <span className="robot-antenna left"><i /></span>
        <span className="robot-antenna right"><i /></span>

        <span className="robot-head">
          <span className="robot-ear left" />
          <span className="robot-ear right" />
          <span className="robot-face">
            <i className="robot-eye left" />
            <i className="robot-eye right" />
            <span className="robot-eye-glow" />
          </span>
          <span className="robot-mouth">{state === "speaking" ? "⌣" : state === "thinking" ? "…" : "•"}</span>
          <span className="robot-cheek left" />
          <span className="robot-cheek right" />
          <span className="robot-blush left" />
          <span className="robot-blush right" />
        </span>

        <span className="robot-body">
          <span className="robot-neck" />
          <span className="robot-badge">A1</span>
          <span className="robot-core" aria-hidden="true" />
          <span className="robot-heart">♥</span>
          <span className="robot-arm left" />
          <span className="robot-arm right" />
        </span>
      </button>

      <button className="robot-mic" onClick={onVoice} aria-label="A1 voice input">🎙</button>
    </div>
  );
}
