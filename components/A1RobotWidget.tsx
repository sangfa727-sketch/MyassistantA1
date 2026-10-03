"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import A1Robot3D from "./A1Robot3D";

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
  const [robotReaction, setRobotReaction] = useState<"" | "?" | "!">("");
  const gestureStart = useRef<{ x: number; y: number; bodyYaw: number; bodyPitch: number; headYaw: number; headPitch: number } | null>(null);
  const settleFrameRef = useRef<number | null>(null);

  function stopSettleAnimation() {
    if (settleFrameRef.current !== null) {
      cancelAnimationFrame(settleFrameRef.current);
      settleFrameRef.current = null;
    }
  }

  function settleBackToAutonomous() {
    stopSettleAnimation();
    const from = { bodyYaw, bodyPitch, headYaw, headPitch };
    const startedAt = performance.now();
    const duration = 720;

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setBodyYaw(from.bodyYaw * (1 - eased));
      setBodyPitch(from.bodyPitch * (1 - eased));
      setHeadYaw(from.headYaw * (1 - eased));
      setHeadPitch(from.headPitch * (1 - eased));

      if (t < 1) {
        settleFrameRef.current = requestAnimationFrame(step);
      } else {
        settleFrameRef.current = null;
        setBodyYaw(0);
        setBodyPitch(0);
        setHeadYaw(0);
        setHeadPitch(0);
      }
    };
    settleFrameRef.current = requestAnimationFrame(step);
  }


  const label =
    state === "thinking" ? "ခဏစဉ်းစားနေတယ်…" :
    state === "listening" ? "အာရုံစိုက်နားထောင်နေတယ် 💙" :
    state === "speaking" ? "မင်းနဲ့စကားပြောနေတယ် ✨" :
    "A1 နဲ့ပြောမယ် 💙";

  function handleRobotHover(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.querySelector(".a1-robot-3d-stage")?.dispatchEvent(new CustomEvent("a1:hover", {
      detail: { clientX: event.clientX, clientY: event.clientY },
    }));
  }

  function handleRobotLeave(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.querySelector(".a1-robot-3d-stage")?.dispatchEvent(new CustomEvent("a1:leave"));
  }

  function handleRobotPointerDown(event: PointerEvent<HTMLButtonElement>) {
    stopSettleAnimation();
    setRobotReaction("?");
    gestureStart.current = {
      x: event.clientX,
      y: event.clientY,
      bodyYaw,
      bodyPitch,
      headYaw,
      headPitch,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.querySelector(".a1-robot-3d-stage")?.dispatchEvent(new CustomEvent("a1:dragstart"));
  }

  function handleRobotPointerMove(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.querySelector(".a1-robot-3d-stage")?.dispatchEvent(new CustomEvent("a1:pointermove", {
      detail: { clientX: event.clientX, clientY: event.clientY },
    }));
    const start = gestureStart.current;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const moved = Math.hypot(dx, dy);
    if (moved > 72) setRobotReaction("!");

    // Horizontal drag = the character looks first; the body follows gently instead of feeling like a 3D model viewer.
    const nextBodyYaw = clamp(start.bodyYaw + dx * 0.58, -180, 180);
    // Vertical drag follows natural hand direction: mouse up = look up, mouse down = look down.
    const nextBodyPitch = clamp(start.bodyPitch + dy * 0.08, -12, 12);
    const nextHeadYaw = clamp(start.headYaw + dx * 0.78, -55, 55);
    const nextHeadPitch = clamp(start.headPitch + dy * 0.48, -30, 30);

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
    setRobotReaction("");
    event.currentTarget.querySelector(".a1-robot-3d-stage")?.dispatchEvent(new CustomEvent("a1:dragend"));
    if (!cancelled && moved >= 8) settleBackToAutonomous();
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

  function handleRobotPointerLostCapture(event: PointerEvent<HTMLButtonElement>) {
    if (!gestureStart.current) return;
    gestureStart.current = null;
    setRobotReaction("");
    event.currentTarget.querySelector(".a1-robot-3d-stage")?.dispatchEvent(new CustomEvent("a1:dragend"));
    settleBackToAutonomous();
  }

  useEffect(() => () => stopSettleAnimation(), []);

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

      <button
        className={`robot-launcher robot-${state}`}
        onPointerEnter={handleRobotHover}
        onPointerLeave={handleRobotLeave}
        onPointerDown={handleRobotPointerDown}
        onPointerMove={handleRobotPointerMove}
        onPointerUp={handleRobotPointerUp}
        onPointerCancel={handleRobotPointerCancel}
        onLostPointerCapture={handleRobotPointerLostCapture}
        aria-label="A1 Assistant ဖွင့်ရန် — robot ကို သဘာဝကျကျ လှည့်ကြည့်ရန် drag လုပ်ပါ"
      >
        <span className={`robot-reaction ${robotReaction ? "show" : ""}`} aria-hidden="true">{robotReaction}</span>
        <A1Robot3D
          state={state}
          bodyYaw={bodyYaw}
          bodyPitch={bodyPitch}
          headYaw={headYaw}
          headPitch={headPitch}
        />
      </button>

      <button className="robot-mic" onClick={onVoice} aria-label="A1 voice input">🎙</button>
    </div>
  );
}
