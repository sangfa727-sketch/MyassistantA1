"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
// Three.js ships JavaScript runtime modules; the project keeps a lightweight local shim for this client-only renderer.
// @ts-ignore TS7016: runtime package is intentionally consumed without the full optional type bundle.
import * as THREE from "three";
// @ts-ignore TS7016: addon is a runtime geometry module.
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

type RobotState = "idle" | "thinking" | "listening" | "speaking";

type Props = {
  state: RobotState;
  bodyYaw: number;
  bodyPitch: number;
  headYaw: number;
  headPitch: number;
};

function roundedBox(width: number, height: number, depth: number, radius: number, smoothness = 5) {
  return new RoundedBoxGeometry(width, height, depth, smoothness, radius);
}

export default function A1Robot3D({ state, bodyYaw, bodyPitch, headYaw, headPitch }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<any>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftElbowRef = useRef<THREE.Group>(null);
  const rightElbowRef = useRef<THREE.Group>(null);
  const leftWristRef = useRef<THREE.Group>(null);
  const rightWristRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<any>(null);
  const eyeRRef = useRef<any>(null);
  const mouthRef = useRef<any>(null);
  const stateRef = useRef(state);
  const headYawRef = useRef(headYaw);
  const headPitchRef = useRef(headPitch);
  const hoverRef = useRef(false);
  const draggingRef = useRef(false);
  const pointerLookRef = useRef({ x: 0, y: 0 });
  const pointerLookSmoothRef = useRef({ x: 0, y: 0 });
  stateRef.current = state;
  headYawRef.current = headYaw;
  headPitchRef.current = headPitch;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0.62, 4.9);
    camera.lookAt(0, 0.28, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    // Mobile/desktop both render at the device pixel density, with a safe upper
    // bound to keep high-DPI phones crisp without turning the companion into a
    // battery-heavy 4x render target.
    const getPixelRatio = () => {
      const dpr = window.devicePixelRatio || 1;
      const mobile = window.matchMedia("(max-width: 620px)").matches;
      return Math.min(Math.max(dpr, 1), mobile ? 4 : 4);
    };
    renderer.setPixelRatio(getPixelRatio());
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(220, 260, false);
    renderer.shadowMap.enabled = true;
    // Hard shadow filtering avoids extra softness around the mascot silhouette.
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    host.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0x9fc9ff, 0x07101f, 2.2);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 3.1);
    key.position.set(-3.5, 4.5, 5.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const rim = new THREE.PointLight(0x38a9ff, 18, 8, 2);
    rim.position.set(3, 1.8, -1.8);
    scene.add(rim);

    const warm = new THREE.PointLight(0x7dd3fc, 9, 6, 2);
    warm.position.set(-2.5, 0.8, 2.8);
    scene.add(warm);

    const root = new THREE.Group();
    root.position.y = -0.18;
    root.rotation.y = THREE.MathUtils.degToRad(-8);
    scene.add(root);

    const body = new THREE.Group();
    bodyRef.current = body;
    body.position.y = 0;
    root.add(body);

    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x9aa4ad, metalness: 0.86, roughness: 0.26 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xd7dde2, metalness: 0.82, roughness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x20262b, metalness: 0.9, roughness: 0.18 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe9f7ff, metalness: 0.15, roughness: 0.18 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0xc9f5ff, emissive: 0x54d9ff, emissiveIntensity: 1.8, metalness: 0.25, roughness: 0.12 });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff8fcf, emissive: 0xff3f9f, emissiveIntensity: 1.2, metalness: 0.1, roughness: 0.25 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 0.72, 12, 40), torsoMat);
    torso.scale.set(1.03, 1.04, 1.12);
    torso.position.y = 0.02;
    torso.castShadow = true;
    torso.receiveShadow = true;
    // Opaque torso shell: the body must occlude opposite-side limbs and rear
    // hardware instead of allowing a see-through silhouette from side/front views.
    torso.renderOrder = 2;
    torso.material.depthWrite = true;
    torso.material.depthTest = true;
    body.add(torso);

    // Rear hardware makes the back a real modeled surface, not an empty reverse side.
    const backPanel = new THREE.Mesh(roundedBox(0.70, 0.68, 0.10, 0.13), darkMat);
    backPanel.position.set(0, 0.08, -0.57);
    backPanel.castShadow = true;
    body.add(backPanel);

    const backCore = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 24), cyanMat);
    backCore.rotation.x = Math.PI / 2;
    backCore.position.set(0, 0.08, -0.65);
    body.add(backCore);

    const spine = new THREE.Mesh(roundedBox(0.12, 0.44, 0.07, 0.035), trimMat);
    spine.position.set(0, -0.27, -0.64);
    body.add(spine);

    const chest = new THREE.Mesh(roundedBox(0.70, 0.66, 0.075, 0.14), darkMat);
    chest.position.set(0, 0.1, 0.45);
    body.add(chest);

    // The round chest core is intentional and interactive. Keep it intact;
    // only the unwanted rectangular badge below it is removed.
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 20), cyanMat);
    core.position.set(0, 0.08, 0.52);
    core.castShadow = true;
    body.add(core);

    const shoulderGeo = new THREE.SphereGeometry(0.24, 24, 16);
    const upperArmGeo = new THREE.CapsuleGeometry(0.13, 0.36, 8, 16);
    const forearmGeo = new THREE.CapsuleGeometry(0.12, 0.34, 8, 16);
    const elbowGeo = new THREE.SphereGeometry(0.15, 20, 14);

    function addArm(side: number, ref: MutableRefObject<any>) {
      const g = new THREE.Group();
      ref.current = g;
      // Keep the shoulder mount slightly outside the torso shell. This gives
      // the arm a real clearance envelope so rotations cannot visually sink
      // the forearm/hand into the chest.
      g.position.set(side * 0.96, 0.35, 0.16);
      body.add(g);

      const shoulder = new THREE.Mesh(shoulderGeo, trimMat);
      shoulder.castShadow = true;
      g.add(shoulder);

      // Compact servo housing: a rounded side shell with a real circular motor
      // face/axle, rather than a block crossing the arm at an unnatural angle.
      const shoulderHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.16, 40),
        darkMat
      );
      shoulderHousing.rotation.z = Math.PI / 2;
      shoulderHousing.position.set(0, -0.02, 0.03);
      shoulderHousing.castShadow = true;
      g.add(shoulderHousing);

      const shoulderCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.045, 40),
        trimMat
      );
      shoulderCap.rotation.z = Math.PI / 2;
      shoulderCap.position.set(side * 0.125, -0.02, 0.03);
      g.add(shoulderCap);

      const shoulderAxle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, 0.05, 28),
        cyanMat
      );
      shoulderAxle.rotation.z = Math.PI / 2;
      shoulderAxle.position.set(side * 0.155, -0.02, 0.03);
      g.add(shoulderAxle);

      // Real two-segment arm: the elbow is an actual joint, so A1 can
      // lift the hand above shoulder height instead of only swinging one
      // rigid capsule from the shoulder.
      const upper = new THREE.Mesh(upperArmGeo, torsoMat);
      upper.position.set(0, -0.24, 0.02);
      upper.castShadow = true;
      g.add(upper);

      const elbow = new THREE.Group();
      elbow.position.y = -0.49;
      if (side < 0) leftElbowRef.current = elbow;
      else rightElbowRef.current = elbow;
      g.add(elbow);

      // The elbow is a compact circular servo pod. The dark housing is the
      // motor body, the blue ring is its visible side cap, and the cyan axle
      // gives the joint a believable mechanical center.
      const elbowHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.22, 32),
        darkMat
      );
      elbowHousing.rotation.z = Math.PI / 2;
      elbowHousing.castShadow = true;
      elbow.add(elbowHousing);

      const elbowCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.115, 0.035, 32),
        trimMat
      );
      elbowCap.rotation.z = Math.PI / 2;
      elbowCap.position.x = side * 0.125;
      elbow.add(elbowCap);

      const elbowAxle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.038, 0.045, 24),
        cyanMat
      );
      elbowAxle.rotation.z = Math.PI / 2;
      elbowAxle.position.x = side * 0.155;
      elbow.add(elbowAxle);

      const elbowJoint = new THREE.Mesh(elbowGeo, trimMat);
      elbowJoint.scale.set(0.92, 0.92, 0.92);
      elbow.add(elbowJoint);

      const forearm = new THREE.Mesh(forearmGeo, torsoMat);
      // Neutral arm points down. A 180° elbow rotation folds the forearm
      // upward through a natural hinge, while this small outward offset keeps
      // the forearm from disappearing inside the torso during interaction.
      forearm.position.set(0, -0.22, 0.075);
      forearm.castShadow = true;
      elbow.add(forearm);

      const wrist = new THREE.Group();
      wrist.position.set(0, -0.52, 0.13);
      if (side < 0) leftWristRef.current = wrist;
      else rightWristRef.current = wrist;
      elbow.add(wrist);

      const wristRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.105, 0.022, 10, 24),
        trimMat
      );
      wristRing.rotation.x = Math.PI / 2;
      wrist.add(wristRing);

      // Cute articulated hand: a small palm plus four rounded fingers and a
      // thumb. Fingers are separate children so the hand reads as a mascot
      // hand rather than a featureless ball.
      const palm = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 24, 18),
        whiteMat
      );
      palm.position.set(0, -0.13, 0.01);
      palm.scale.set(1.05, 0.78, 0.78);
      palm.castShadow = true;
      wrist.add(palm);

      const fingerGeo = new THREE.CapsuleGeometry(0.045, 0.105, 6, 12);
      const fingerX = [-0.105, -0.035, 0.035, 0.105];
      fingerX.forEach((x, index) => {
        const finger = new THREE.Mesh(fingerGeo, whiteMat);
        finger.position.set(x, -0.275, 0.025);
        finger.rotation.z = (index - 1.5) * 0.055;
        finger.scale.set(0.9, 0.9 + (index === 1 || index === 2 ? 0.08 : 0), 0.9);
        finger.castShadow = true;
        wrist.add(finger);
      });

      const thumb = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.052, 0.11, 6, 12),
        whiteMat
      );
      thumb.position.set(side * 0.15, -0.18, 0.045);
      thumb.rotation.z = side * -0.72;
      thumb.rotation.x = -0.18;
      thumb.castShadow = true;
      wrist.add(thumb);
    }
    addArm(-1, leftArmRef);
    addArm(1, rightArmRef);

    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.58, 28, 20), darkMat);
    hip.scale.set(1.0, 0.48, 0.72);
    hip.position.y = -0.78;
    body.add(hip);

    const legGeo = new THREE.CapsuleGeometry(0.16, 0.58, 8, 16);
    const footGeo = roundedBox(0.42, 0.22, 0.7, 0.09);

    function addLeg(side: number, ref: React.MutableRefObject<THREE.Group | null>) {
      const g = new THREE.Group();
      ref.current = g;
      g.position.set(side * 0.34, -1.15, 0);
      body.add(g);
      const leg = new THREE.Mesh(legGeo, torsoMat);
      leg.position.y = -0.25;
      leg.castShadow = true;
      g.add(leg);
      // Chubby child-shoe silhouette: rounded toe, padded upper and a
      // slightly wider soft sole keep the mascot proportions cute and grounded.
      const shoe = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 28, 20),
        darkMat
      );
      shoe.scale.set(0.78, 0.46, 1.12);
      shoe.position.set(0, -0.66, 0.18);
      shoe.castShadow = true;
      g.add(shoe);

      const shoeToe = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 24, 18),
        trimMat
      );
      shoeToe.scale.set(0.92, 0.42, 0.82);
      shoeToe.position.set(0, -0.65, 0.39);
      shoeToe.castShadow = true;
      g.add(shoeToe);

      const sole = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 24, 16),
        darkMat
      );
      sole.scale.set(0.86, 0.14, 1.02);
      sole.position.set(0, -0.82, 0.2);
      g.add(sole);

      const shoeAccent = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.025, 8, 24),
        cyanMat
      );
      shoeAccent.rotation.x = Math.PI / 2;
      shoeAccent.scale.set(0.8, 1, 1.15);
      shoeAccent.position.set(0, -0.69, 0.42);
      g.add(shoeAccent);
    }
    addLeg(-1, leftLegRef);
    addLeg(1, rightLegRef);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.27, 0.26, 24), darkMat);
    neck.position.y = 0.8;
    body.add(neck);

    const head = new THREE.Group();
    headRef.current = head;
    head.position.set(0, 1.3, 0.03);
    body.add(head);

    const headShell = new THREE.Mesh(new THREE.SphereGeometry(0.92, 40, 28), torsoMat);
    headShell.scale.set(1.0, 0.94, 0.82);
    headShell.castShadow = true;
    head.add(headShell);

    // Premium rear head design: a layered curved shell, central service
    // ring, twin vent details and a small lower neck cover make the 180° view
    // feel intentionally designed rather than like the back of a sphere.
    const rearHeadCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 36, 24),
      darkMat
    );
    rearHeadCap.scale.set(1.0, 0.76, 0.22);
    rearHeadCap.position.set(0, 0.02, -0.64);
    rearHeadCap.castShadow = true;
    head.add(rearHeadCap);

    const rearTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.035, 10, 36),
      trimMat
    );
    rearTrim.rotation.x = Math.PI / 2;
    rearTrim.position.set(0, 0.03, -0.865);
    rearTrim.scale.set(1, 0.88, 1);
    head.add(rearTrim);

    const rearHeadCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 20, 14),
      cyanMat
    );
    rearHeadCore.position.set(0, 0.03, -0.91);
    head.add(rearHeadCore);

    const rearVentGeo = roundedBox(0.13, 0.045, 0.035, 0.018);
    [-0.24, 0.24].forEach((x) => {
      const vent = new THREE.Mesh(rearVentGeo, trimMat);
      vent.position.set(x, -0.30, -0.83);
      vent.rotation.z = x < 0 ? -0.18 : 0.18;
      head.add(vent);
    });

    const rearLowerCover = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 16),
      trimMat
    );
    rearLowerCover.scale.set(1.25, 0.34, 0.18);
    rearLowerCover.position.set(0, -0.53, -0.62);
    head.add(rearLowerCover);

    // Deep, curved face visor: keep real thickness so side/back turns reveal volume.
    const facePlate = new THREE.Mesh(new THREE.SphereGeometry(0.67, 40, 28), new THREE.MeshStandardMaterial({ color: 0x090d11, metalness: 0.38, roughness: 0.12, emissive: 0x05080b, emissiveIntensity: 0.35 }));
    facePlate.scale.set(1.0, 0.70, 0.34);
    facePlate.position.set(0, -0.01, 0.61);
    facePlate.castShadow = true;
    head.add(facePlate);

    const faceInner = new THREE.Mesh(new THREE.SphereGeometry(0.51, 32, 22), new THREE.MeshStandardMaterial({ color: 0x111820, metalness: 0.3, roughness: 0.1, emissive: 0x07121a, emissiveIntensity: 0.55 }));
    faceInner.scale.set(1.0, 0.72, 0.26);
    faceInner.position.set(0, -0.01, 0.82);
    head.add(faceInner);

    // Screen-native facial UI: flat display layers placed just above the
    // curved inner visor. CircleGeometry keeps the eyes/cheeks genuinely round
    // without giving them physical 3D volume that can protrude from the screen.
    const eyeGeo = new THREE.CircleGeometry(0.125, 48);
    const eyeL = new THREE.Mesh(eyeGeo, cyanMat);
    const eyeR = new THREE.Mesh(eyeGeo, cyanMat);
    // Facial pixels must win the depth test against the curved visor. Without
    // this, small head rotations can make the lower half of a circular eye
    // disappear inside the display shell.
    eyeL.renderOrder = 20;
    eyeR.renderOrder = 20;
    eyeL.material.depthTest = false;
    eyeR.material.depthTest = false;
    eyeLRef.current = eyeL;
    eyeRRef.current = eyeR;
    eyeL.position.set(-0.27, 0.04, 0.958);
    eyeR.position.set(0.27, 0.04, 0.958);
    head.add(eyeL, eyeR);

    // The lower display curves away quickly, so the cheeks are brought inward
    // and placed directly on that surface rather than at the visor edge.
    const cheekGeo = new THREE.CircleGeometry(0.072, 40);
    const cheekL = new THREE.Mesh(cheekGeo, pinkMat);
    const cheekR = new THREE.Mesh(cheekGeo, pinkMat);
    cheekL.renderOrder = 20;
    cheekR.renderOrder = 20;
    cheekL.material.depthTest = false;
    cheekR.material.depthTest = false;
    cheekL.position.set(-0.34, -0.16, 0.948);
    cheekR.position.set(0.34, -0.16, 0.948);
    head.add(cheekL, cheekR);

    // Ultra-thin mouth glyph: no raised block and much closer to the display.
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.026), whiteMat);
    mouthRef.current = mouth;
    mouth.renderOrder = 21;
    mouth.material.depthTest = false;
    mouth.position.set(0, -0.28, 0.922);
    head.add(mouth);

    const earGeo = new THREE.SphereGeometry(0.27, 20, 14);
    const earL = new THREE.Mesh(earGeo, trimMat);
    const earR = earL.clone();
    earL.position.set(-0.84, 0.02, 0.02);
    earR.position.set(0.84, 0.02, 0.02);
    earL.scale.set(0.5, 1, 0.7);
    earR.scale.set(0.5, 1, 0.7);
    head.add(earL, earR);

    // Ear-mounted antennae are children of the head, so the entire mast + tip
    // follows the head rotation as one rigid assembly instead of leaving a piece behind.
    const antennaMat = new THREE.MeshStandardMaterial({
      color: 0x5bdcff,
      emissive: 0x0b6fa8,
      emissiveIntensity: 0.75,
      metalness: 0.55,
      roughness: 0.2,
    });
    const antennaMastGeo = new THREE.CylinderGeometry(0.035, 0.055, 0.42, 18);
    const antennaTipGeo = new THREE.SphereGeometry(0.105, 24, 16);

    function addEarAntenna(side: number) {
      const assembly = new THREE.Group();
      assembly.position.set(side * 0.82, 0.12, 0.02);
      assembly.rotation.z = side * -0.24;
      head.add(assembly);

      const base = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), trimMat);
      base.position.y = 0.02;
      base.castShadow = true;
      assembly.add(base);

      const mast = new THREE.Mesh(antennaMastGeo, antennaMat);
      mast.position.y = 0.23;
      mast.castShadow = true;
      assembly.add(mast);

      const tip = new THREE.Mesh(antennaTipGeo, cyanMat);
      tip.position.y = 0.45;
      tip.castShadow = true;
      assembly.add(tip);
    }

    addEarAntenna(-1);
    addEarAntenna(1);

    let animationId = 0;
    const clock = new THREE.Clock();
    let last = 0;
    let hoverUntil = 0;

    const onHover = (event: Event) => {
      const detail = (event as CustomEvent<{ clientX: number; clientY: number }>).detail;
      if (detail) {
        const rect = host.getBoundingClientRect();
        pointerLookRef.current.x = THREE.MathUtils.clamp((detail.clientX - rect.left) / Math.max(1, rect.width) * 2 - 1, -1, 1);
        pointerLookRef.current.y = THREE.MathUtils.clamp((detail.clientY - rect.top) / Math.max(1, rect.height) * 2 - 1, -1, 1);
      }
      hoverRef.current = true;
      hoverUntil = clock.getElapsedTime() + 1.9;
    };
    const onLeave = () => {
      pointerLookRef.current.x = 0;
      pointerLookRef.current.y = 0;
      hoverRef.current = false;
      hoverUntil = clock.getElapsedTime() + 0.35;
    };
    const updatePointerLook = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      pointerLookRef.current.x = THREE.MathUtils.clamp((clientX - rect.left) / Math.max(1, rect.width) * 2 - 1, -1, 1);
      pointerLookRef.current.y = THREE.MathUtils.clamp((clientY - rect.top) / Math.max(1, rect.height) * 2 - 1, -1, 1);
    };

    const onPointerMove = (event: Event) => {
      const detail = (event as CustomEvent<{ clientX: number; clientY: number }>).detail;
      if (!detail) return;
      updatePointerLook(detail.clientX, detail.clientY);
    };

    // Track the pointer around the mascot, not only when the pointer is
    // physically over the launcher button. This gives A1 a natural
    // "I noticed you" radius while leaving the mic/settings controls usable.
    const onWindowPointerMove = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(".robot-mic, .widget-picker, .widget-settings")) return;
      const rect = host.getBoundingClientRect();
      const padX = Math.max(12, rect.width * 0.035);
      const padY = Math.max(12, rect.height * 0.035);
      const inside =
        event.clientX >= rect.left - padX &&
        event.clientX <= rect.right + padX &&
        event.clientY >= rect.top - padY &&
        event.clientY <= rect.bottom + padY;

      if (!inside) {
        if (hoverRef.current) {
          pointerLookRef.current.x = 0;
          pointerLookRef.current.y = 0;
          hoverRef.current = false;
          hoverUntil = clock.getElapsedTime() + 0.25;
        }
        return;
      }

      updatePointerLook(event.clientX, event.clientY);
      if (!hoverRef.current) {
        }
      hoverRef.current = true;
      hoverUntil = clock.getElapsedTime() + 1.9;
    };
    const onDragStart = () => {
      draggingRef.current = true;
      hoverRef.current = true;
      hoverUntil = clock.getElapsedTime() + 10;
    };
    const onDragEnd = () => {
      draggingRef.current = false;
      pointerLookRef.current.x = 0;
      pointerLookRef.current.y = 0;
      hoverRef.current = false;
      hoverUntil = clock.getElapsedTime() + 0.42;
    };
    host.addEventListener("a1:hover", onHover);
    host.addEventListener("a1:leave", onLeave);
    host.addEventListener("a1:pointermove", onPointerMove);
    host.addEventListener("a1:dragstart", onDragStart);
    host.addEventListener("a1:dragend", onDragEnd);
    window.addEventListener("pointermove", onWindowPointerMove, { passive: true });
    let nextBlinkAt = 2.5;
    let blinkUntil = 0;

    const resize = () => {
      const width = Math.max(160, host.clientWidth || 220);
      const height = Math.max(190, host.clientHeight || 260);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(getPixelRatio());
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const dt = Math.min(0.04, elapsed - last || 0.016);
      last = elapsed;
      const s = stateRef.current;

      // Grounded companion loop: A1 stays planted on its feet.
      // No breathing bob and no whole-body vertical movement. Instead it
      // shows small character actions: looking around, blinking, typing,
      // and settling. Greeting-wave animation is intentionally removed.
      const cycle = elapsed % 16;
      const focusPhase = cycle > 3 && cycle < 5.5;
      const typingPhase = cycle >= 6 && cycle < 10;
      const settlePhase = cycle >= 13.5;
      const dragPhase = draggingRef.current;

      root.position.y = -0.18;
      body.position.y = 0;
      body.rotation.z = Math.sin(elapsed * 0.85) * 0.006;

      if (s === "idle") {
        const attention = focusPhase ? 1 : typingPhase ? 0.72 : settlePhase ? 0.4 : 0.15;
        const pointerTarget = pointerLookRef.current;
        const pointerSmooth = pointerLookSmoothRef.current;
        const pointerEase = 1 - Math.exp(-dt * 8.5);
        pointerSmooth.x += (pointerTarget.x - pointerSmooth.x) * pointerEase;
        pointerSmooth.y += (pointerTarget.y - pointerSmooth.y) * pointerEase;
        const pointerX = pointerSmooth.x;
        const pointerY = pointerSmooth.y;
        const pointerWeight = dragPhase ? 1 : 0.35;
        const pointerLookYaw = THREE.MathUtils.degToRad(pointerX * 16) * pointerWeight;
        const pointerLookPitch = THREE.MathUtils.degToRad(pointerY * 14) * pointerWeight;
        const look = Math.sin(elapsed * 0.82) * 0.06 * attention + pointerLookYaw;
        const lookTilt = Math.sin(elapsed * 0.67) * 0.012 * attention;

        // Head stays at a fixed height; only tiny natural turns/tilts remain.
        head.position.y = 1.3;
        head.rotation.x = THREE.MathUtils.degToRad(headPitchRef.current) + pointerLookPitch;
        head.rotation.z = lookTilt;
        head.rotation.y = THREE.MathUtils.degToRad(headYawRef.current) + look;
        eyeL.scale.y = eyeR.scale.y = 1.12 - attention * 0.08;

        if (dragPhase) {
          // While the user is physically moving A1, show a curious reaction.
          const reaction = Math.sin(elapsed * 7.5);
          // During a touch/drag the arms remain in a protected outward
          // envelope instead of being allowed to fold through the torso.
          leftArmRef.current?.rotation.set(-0.08, -0.06, 0.12 + reaction * 0.035);
          rightArmRef.current?.rotation.set(-0.08, 0.06, -0.12 - reaction * 0.035);
          leftWristRef.current?.rotation.set(0, 0, -0.10);
          rightWristRef.current?.rotation.set(0, 0, 0.10);
          head.rotation.x = THREE.MathUtils.degToRad(headPitchRef.current) + Math.sin(elapsed * 3.8) * 0.025;
          head.rotation.z = Math.sin(elapsed * 4.2) * 0.045;
          head.position.y = 1.3;
        } else if (typingPhase) {
          const keyTap = Math.sin(elapsed * 9.5);
          leftArmRef.current?.rotation.set(-0.08 + keyTap * 0.10, -0.10, 0.32);
          rightArmRef.current?.rotation.set(-0.08 - keyTap * 0.10, 0.10, -0.32);
          leftElbowRef.current?.rotation.set(0, 0, 0);
          rightElbowRef.current?.rotation.set(0, 0, 0);
          leftWristRef.current?.rotation.set(0, 0, 0);
          rightWristRef.current?.rotation.set(0, 0, 0);
          core.scale.setScalar(1 + Math.abs(keyTap) * 0.045);
        } else {
          const relax = Math.sin(elapsed * 1.5) * 0.025;
          leftArmRef.current?.rotation.set(0, 0, -relax);
          rightArmRef.current?.rotation.set(0, 0, relax);
          leftElbowRef.current?.rotation.set(0, 0, 0);
          rightElbowRef.current?.rotation.set(0, 0, 0);
        }
      }

      if (s === "thinking") {
        head.rotation.x = THREE.MathUtils.degToRad(headPitchRef.current);
        head.position.y = 1.3 + Math.sin(elapsed * 2.8) * 0.025;
        eyeL.scale.y = eyeR.scale.y = 0.92 + Math.sin(elapsed * 2.1) * 0.08;
      } else if (s === "listening") {
        head.rotation.x = THREE.MathUtils.degToRad(headPitchRef.current);
        head.rotation.z = Math.sin(elapsed * 2.2) * 0.035;
      } else if (s === "speaking") {
        const talk = 0.92 + (Math.sin(elapsed * 10) * 0.5 + 0.5) * 0.28;
        mouth.scale.y = talk;
        core.scale.setScalar(1 + Math.sin(elapsed * 8) * 0.08);
      } else if (s !== "idle") {
        mouth.scale.y = 1;
        core.scale.setScalar(1);
      } else {
        mouth.scale.y = 1;
        if (!typingPhase) core.scale.setScalar(1);
      }

      // Soft autonomous blink. The blink timing is irregular enough to avoid a mechanical loop.
      if (elapsed >= nextBlinkAt) {
        blinkUntil = elapsed + 0.14;
        nextBlinkAt = elapsed + 2.8 + Math.random() * 3.8;
      }
      const blinking = elapsed < blinkUntil;
      const blinkOpen = blinking ? 0.12 : 1;
      eyeL.scale.y *= blinkOpen;
      eyeR.scale.y *= blinkOpen;

      if (s !== "listening") head.rotation.z *= 0.9;
      if (s !== "thinking") head.position.y += (1.3 - head.position.y) * Math.min(1, dt * 10);

      // Only add the tiny idle hand motion when no interaction gesture owns the arms.
      // This prevents the normal idle loop from overwriting the touch/drag reaction.
      if (s === "idle" && !dragPhase && !typingPhase) {
        if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(elapsed * 1.8) * 0.018;
        if (rightArmRef.current) rightArmRef.current.rotation.z = -Math.sin(elapsed * 1.8) * 0.018;
        if (leftElbowRef.current) leftElbowRef.current.rotation.set(0, 0, 0);
        if (rightElbowRef.current) rightElbowRef.current.rotation.set(0, 0, 0);
        if (leftWristRef.current) leftWristRef.current.rotation.set(0, 0, 0);
        if (rightWristRef.current) rightWristRef.current.rotation.set(0, 0, 0);
      }

      // Feet/legs stay planted. There is deliberately no leg bob or vertical sway.
      if (leftLegRef.current) leftLegRef.current.rotation.z = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.z = 0;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      host.removeEventListener("a1:hover", onHover);
      host.removeEventListener("a1:pointermove", onPointerMove);
      host.removeEventListener("a1:leave", onLeave);
      host.removeEventListener("a1:dragstart", onDragStart);
      host.removeEventListener("a1:dragend", onDragEnd);
      window.removeEventListener("pointermove", onWindowPointerMove);
      renderer.dispose();
      scene.traverse((object: any) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material: any) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y = THREE.MathUtils.degToRad(bodyYaw);
      bodyRef.current.rotation.x = THREE.MathUtils.degToRad(bodyPitch * 0.65);
    }
    if (headRef.current) {
      // Head rotation is local to the body. Every child — ears, face depth,
      // and ear-mounted antenna assembly — therefore moves as one rigid 3D part.
      headRef.current.rotation.y = THREE.MathUtils.degToRad(headYaw);
      headRef.current.rotation.x = THREE.MathUtils.degToRad(headPitch);
    }
  }, [bodyYaw, bodyPitch, headYaw, headPitch]);

  return <div ref={hostRef} className="a1-robot-3d-stage" aria-hidden="true" />;
}
