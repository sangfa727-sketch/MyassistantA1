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
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<any>(null);
  const eyeRRef = useRef<any>(null);
  const mouthRef = useRef<any>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0.62, 6.05);
    camera.lookAt(0, 0.28, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(220, 260, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.55, 48),
      new THREE.MeshBasicMaterial({ color: 0x2b8cff, transparent: true, opacity: 0.12, depthWrite: false })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.48;
    scene.add(floor);

    const root = new THREE.Group();
    root.position.y = -0.18;
    root.rotation.y = THREE.MathUtils.degToRad(-8);
    scene.add(root);

    const body = new THREE.Group();
    bodyRef.current = body;
    body.position.y = 0;
    root.add(body);

    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x173b69, metalness: 0.72, roughness: 0.24 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x4ca8ff, metalness: 0.58, roughness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x071522, metalness: 0.82, roughness: 0.2 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe9f7ff, metalness: 0.15, roughness: 0.18 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x62e7ff, emissive: 0x1ab9ff, emissiveIntensity: 2.4, metalness: 0.2, roughness: 0.14 });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff8fcf, emissive: 0xff3f9f, emissiveIntensity: 1.2, metalness: 0.1, roughness: 0.25 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 0.72, 10, 32), torsoMat);
    torso.scale.set(0.98, 1.02, 0.96);
    torso.position.y = 0.02;
    torso.castShadow = true;
    torso.receiveShadow = true;
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

    const chest = new THREE.Mesh(roundedBox(0.72, 0.7, 0.08, 0.14), darkMat);
    chest.position.set(0, 0.1, 0.47);
    body.add(chest);

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 20), cyanMat);
    core.position.set(0, 0.08, 0.54);
    body.add(core);

    const badge = new THREE.Mesh(roundedBox(0.4, 0.22, 0.055, 0.08), whiteMat);
    badge.position.set(0, -0.47, 0.49);
    body.add(badge);

    const shoulderGeo = new THREE.SphereGeometry(0.24, 24, 16);
    const armGeo = new THREE.CapsuleGeometry(0.13, 0.56, 8, 16);
    const handGeo = new THREE.SphereGeometry(0.19, 20, 14);

    function addArm(side: number, ref: MutableRefObject<any>) {
      const g = new THREE.Group();
      ref.current = g;
      g.position.set(side * 0.86, 0.35, 0);
      body.add(g);
      const shoulder = new THREE.Mesh(shoulderGeo, trimMat);
      g.add(shoulder);
      const upper = new THREE.Mesh(armGeo, torsoMat);
      upper.position.y = -0.42;
      upper.rotation.z = side * -0.08;
      upper.castShadow = true;
      g.add(upper);
      const hand = new THREE.Mesh(handGeo, whiteMat);
      hand.position.y = -0.82;
      g.add(hand);
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
      const foot = new THREE.Mesh(footGeo, darkMat);
      foot.position.set(0, -0.67, 0.16);
      g.add(foot);
      const sole = new THREE.Mesh(roundedBox(0.34, 0.06, 0.56, 0.03), trimMat);
      sole.position.set(0, -0.79, 0.17);
      g.add(sole);
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

    // Rear head cap/detail: at 180° this becomes the visible face of the mascot.
    const rearHeadCap = new THREE.Mesh(new THREE.SphereGeometry(0.63, 32, 22), darkMat);
    rearHeadCap.scale.set(1.0, 0.72, 0.22);
    rearHeadCap.position.set(0, 0, -0.66);
    rearHeadCap.castShadow = true;
    head.add(rearHeadCap);

    const rearHeadCore = new THREE.Mesh(new THREE.SphereGeometry(0.105, 20, 14), cyanMat);
    rearHeadCore.position.set(0, 0.02, -0.87);
    head.add(rearHeadCore);

    // Deep, curved face visor: keep real thickness so side/back turns reveal volume.
    const facePlate = new THREE.Mesh(new THREE.SphereGeometry(0.67, 40, 28), darkMat);
    facePlate.scale.set(1.0, 0.70, 0.34);
    facePlate.position.set(0, -0.01, 0.61);
    facePlate.castShadow = true;
    head.add(facePlate);

    const faceInner = new THREE.Mesh(new THREE.SphereGeometry(0.51, 32, 22), darkMat);
    faceInner.scale.set(1.0, 0.72, 0.26);
    faceInner.position.set(0, -0.01, 0.82);
    head.add(faceInner);

    const eyeGeo = new THREE.SphereGeometry(0.15, 24, 18);
    const eyeL = new THREE.Mesh(eyeGeo, cyanMat);
    const eyeR = new THREE.Mesh(eyeGeo, cyanMat);
    eyeLRef.current = eyeL;
    eyeRRef.current = eyeR;
    eyeL.position.set(-0.29, 0.12, 0.82);
    eyeR.position.set(0.29, 0.12, 0.82);
    eyeL.scale.set(1, 1.18, 0.48);
    eyeR.scale.set(1, 1.18, 0.48);
    head.add(eyeL, eyeR);

    const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), pinkMat);
    const cheekR = cheekL.clone();
    cheekL.position.set(-0.5, -0.18, 0.78);
    cheekR.position.set(0.5, -0.18, 0.78);
    head.add(cheekL, cheekR);

    const mouth = new THREE.Mesh(roundedBox(0.34, 0.11, 0.05, 0.05), whiteMat);
    mouthRef.current = mouth;
    mouth.position.set(0, -0.28, 0.84);
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
      emissive: 0x168dff,
      emissiveIntensity: 1.6,
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

    const resize = () => {
      const width = Math.max(160, host.clientWidth || 220);
      const height = Math.max(190, host.clientHeight || 260);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
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

      // Autonomous companion loop: even without touch, A1 breathes, looks around,
      // focuses briefly, then performs a short two-hand typing gesture.
      const cycle = elapsed % 14;
      const focusPhase = cycle > 4 && cycle < 7;
      const typingPhase = cycle >= 7 && cycle < 11;
      const settlePhase = cycle >= 11;

      root.position.y = -0.18 + Math.sin(elapsed * 1.7) * (typingPhase ? 0.024 : 0.035);
      body.rotation.z = Math.sin(elapsed * 1.2) * 0.012;
      body.position.y = Math.sin(elapsed * 1.7) * 0.025;

      if (s === "idle") {
        const attention = focusPhase ? 1 : typingPhase ? 0.72 : settlePhase ? 0.45 : 0;
        const look = Math.sin(elapsed * 0.9) * 0.055 * attention;
        head.position.y = 1.3 + Math.sin(elapsed * 1.6) * 0.018;
        head.rotation.z = Math.sin(elapsed * 1.1) * 0.018 * attention;
        head.rotation.y += look;
        eyeL.scale.y = eyeR.scale.y = 1.12 - attention * 0.08;

        if (typingPhase) {
          const keyTap = Math.sin(elapsed * 9.5);
          leftArmRef.current?.rotation.set(-0.08 + keyTap * 0.10, -0.10, 0.32);
          rightArmRef.current?.rotation.set(-0.08 - keyTap * 0.10, 0.10, -0.32);
          core.scale.setScalar(1 + Math.abs(keyTap) * 0.045);
        } else {
          const relax = Math.sin(elapsed * 1.5) * 0.025;
          leftArmRef.current?.rotation.set(0, 0, relax);
          rightArmRef.current?.rotation.set(0, 0, -relax);
        }
      }

      if (s === "thinking") {
        head.position.y = 1.3 + Math.sin(elapsed * 2.8) * 0.025;
        eyeL.scale.y = eyeR.scale.y = 0.92 + Math.sin(elapsed * 2.1) * 0.08;
      } else if (s === "listening") {
        head.rotation.z = Math.sin(elapsed * 2.2) * 0.035;
      } else if (s === "speaking") {
        const talk = 0.92 + (Math.sin(elapsed * 10) * 0.5 + 0.5) * 0.28;
        mouth.scale.y = talk;
        core.scale.setScalar(1 + Math.sin(elapsed * 8) * 0.08);
      } else {
        mouth.scale.y = 1;
        core.scale.setScalar(1);
      }

      if (s !== "listening") head.rotation.z *= 0.9;
      if (s !== "thinking") head.position.y += (1.3 - head.position.y) * Math.min(1, dt * 8);

      if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(elapsed * 1.8) * 0.025;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -Math.sin(elapsed * 1.8) * 0.025;
      if (leftLegRef.current) leftLegRef.current.rotation.z = Math.sin(elapsed * 1.6) * 0.01;
      if (rightLegRef.current) rightLegRef.current.rotation.z = -Math.sin(elapsed * 1.6) * 0.01;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
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
