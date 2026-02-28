import * as THREE from "three";

export function createMirrorWorldProps(scene) {
  const propsGroup = new THREE.Group();
  propsGroup.name = "mirrorWorldProps";

  const benchMaterial = new THREE.MeshStandardMaterial({
    color: 0x221915,
    roughness: 0.95,
    metalness: 0.05,
  });
  const mailboxMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c1635,
    roughness: 0.9,
    metalness: 0.35,
  });

  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.18, 0.48),
    benchMaterial
  );
  bench.position.set(-1.2, -2.72, -2.8);
  bench.rotation.y = -0.18;
  bench.castShadow = true;
  propsGroup.add(bench);

  const mailbox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 1.0, 16),
    mailboxMaterial
  );
  mailbox.position.set(4.2, -2.4, -3);
  mailbox.rotation.z = -0.05;
  mailbox.castShadow = true;
  propsGroup.add(mailbox);

  const bicycle = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.06, 10, 20),
    new THREE.MeshStandardMaterial({
      color: 0x1a1013,
      roughness: 0.8,
      metalness: 0.5,
    })
  );
  bicycle.position.set(0.6, -2.78, -5.1);
  bicycle.rotation.x = Math.PI * 0.5;
  propsGroup.add(bicycle);

  const propStates = [
    { object: bench, type: "bench", phase: Math.random() * Math.PI * 2 },
    { object: mailbox, type: "mailbox", phase: Math.random() * Math.PI * 2 },
    { object: bicycle, type: "bicycle", phase: Math.random() * Math.PI * 2 },
  ];

  scene.add(propsGroup);

  let time = 0;

  function update(delta) {
    time += delta;
    for (const state of propStates) {
      if (state.type === "bench") {
        state.object.rotation.z = -0.18 + Math.sin(time * 0.4 + state.phase) * 0.02;
      } else if (state.type === "mailbox") {
        state.object.position.y =
          -2.4 + Math.sin(time * 0.5 + state.phase) * 0.04;
      } else if (state.type === "bicycle") {
        state.object.rotation.y =
          Math.PI * 0.5 +
          Math.sin(time * 0.3 + state.phase) * 0.08;
      }
    }
  }

  return {
    group: propsGroup,
    update,
  };
}
