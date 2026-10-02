"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";

type RobotState = "idle" | "thinking" | "listening" | "speaking";
export type WidgetVariant = "glass" | "robot";

type Props = {
  state: RobotState;
  variant: WidgetVariant;
  onVariantChange: (variant: WidgetVariant) => void;
  onOpen: () => void;
  onVoice: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export default function A1RobotWidget({
  state,
  variant,
  onVariantChange,
  onOpen,
  onVoice,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bodyYaw, setBodyYaw] = useState(0);
  const [bodyPitch, setBodyPitch] = useState(0);
  const [headYaw, setHeadYaw] = useState(0);
  const [headPitch, setHeadPitch] = useState(0);
  const gestureStart = useRef<{ x: number; y: number; bodyYaw: number; bodyPitch: number; headYaw: number; headPitch: number } | null>(null);

  const label =
    state === "thinking" ? "ခဏစဉ်းစားနေတယ်…" :
    state === "listening" ? "အာရုံစိုက်နားထောင်နေတယ် 💙" :
    state === "speaking" ? "မင်းနဲ့စကားပြောနေတယ် ✨" :
    "A1 နဲ့ပြောမယ် 💙";

  function handleRobotPointerDown(event: PointerEvent<HTMLButtonElement>) {
    gestureStart.current = {
      x: event.clientX,
      y: event.clientY,
      bodyYaw,
      bodyPitch,
      headYaw,
      headPitch,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleRobotPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const start = gestureStart.current;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    // Horizontal drag = body left/right turn.
    const nextBodyYaw = clamp(start.bodyYaw + dx * 0.55, -55, 55);
    // Vertical drag = body lean forward/back + independent head look up/down.
    const nextBodyPitch = clamp(start.bodyPitch - dy * 0.20, -18, 18);
    const nextHeadYaw = clamp(start.headYaw + dx * 0.72, -45, 45);
    const nextHeadPitch = clamp(start.headPitch - dy * 0.34, -26, 26);

    setBodyYaw(nextBodyYaw);
    setBodyPitch(nextBodyPitch);
    setHeadYaw(nextHeadYaw);
    setHeadPitch(nextHeadPitch);
  }

  function finishRobotGesture(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const start = gestureStart.current;
    if (!start) return;

    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);

    if (cancelled) {
      setBodyYaw(start.bodyYaw);
      setBodyPitch(start.bodyPitch);
      setHeadYaw(start.headYaw);
      setHeadPitch(start.headPitch);
    } else if (moved < 8) {
      onOpen();
    } else {
      // Small release offsets settle naturally toward neutral.
      setBodyYaw(value => Math.abs(value) < 4 ? 0 : value);
      setBodyPitch(value => Math.abs(value) < 3 ? 0 : value);
      setHeadYaw(value => Math.abs(value) < 4 ? 0 : value);
      setHeadPitch(value => Math.abs(value) < 3 ? 0 : value);
    }

    gestureStart.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleRobotPointerUp(event: PointerEvent<HTMLButtonElement>) {
    finishRobotGesture(event);
  }

  function handleRobotPointerCancel(event: PointerEvent<HTMLButtonElement>) {
    finishRobotGesture(event, true);
  }

  function handleRobotPointerLostCapture() {
    gestureStart.current = null;
  }

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

  const bodyStyle = {
    "--robot-body-yaw": `${bodyYaw}deg`,
    "--robot-body-pitch": `${bodyPitch}deg`,
    "--robot-body-shadow-x": `${bodyYaw * -0.16}px`,
    "--robot-body-shadow-x-soft": `${bodyYaw * 0.11}px`,
  } as CSSProperties;

  const headStyle = {
    "--robot-head-yaw": `${headYaw}deg`,
    "--robot-head-pitch": `${headPitch}deg`,
    "--robot-shadow-x": `${headYaw * -0.12}px`,
    "--robot-shadow-x-soft": `${headYaw * 0.12}px`,
  } as CSSProperties;

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

      <button
        className={`robot-launcher robot-${state}`}
        onPointerDown={handleRobotPointerDown}
        onPointerMove={handleRobotPointerMove}
        onPointerUp={handleRobotPointerUp}
        onPointerCancel={handleRobotPointerCancel}
        onLostPointerCapture={handleRobotPointerLostCapture}
        aria-label="A1 Assistant ဖွင့်ရန် — ဘယ်ညာလှည့်၊ ရှေ့နောက်စောင်း၊ ခေါင်းငုံ့မော့ရန် drag လုပ်ပါ"
      >
        <span className="robot-aura" />
        <span className="robot-aura-ring" />
        <span className="robot-antenna left"><i /></span>
        <span className="robot-antenna right"><i /></span>

        <span className="robot-body" style={bodyStyle}>
          <span className="robot-neck" />
          <span className="robot-badge">A1</span>
          <span className="robot-core" aria-hidden="true" />
          <span className="robot-heart">♥</span>
          <span className="robot-arm left" />
          <span className="robot-arm right" />
        </span>

        <span className="robot-head" style={headStyle}>
          <span className="robot-ear left" />
          <span className="robot-ear right" />
          <span className="robot-face">
            <i className="robot-eye left" />
            <i className="robot-eye right" />
            <span className="robot-eye-glow" />
          </span>
          <span className="robot-eyebrow left" />
          <span className="robot-eyebrow right" />
          <span className="robot-mouth">
            {state === "speaking" ? "⌣" : state === "thinking" ? "…" : state === "listening" ? "ᴗ" : "•"}
          </span>
          <span className="robot-cheek left" />
          <span className="robot-cheek right" />
          <span className="robot-blush left" />
          <span className="robot-blush right" />
        </span>
      </button>

      <button className="robot-mic" onClick={onVoice} aria-label="A1 voice input">🎙</button>
    </div>
  );
}
