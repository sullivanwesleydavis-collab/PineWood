import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/PointerLockControls.js';

const uiStatus = document.getElementById('status');
let scene, camera, renderer, controls, clock;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let hand;
const objects = [];

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#190d1f', 0.022);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 2, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor('#22111b');
  document.body.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffd8bb, 0.35);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xff9c55, 1.0);
  sun.position.set(-10, 18, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const sky = new THREE.HemisphereLight(0xffd1b2, 0x061728, 0.8);
  scene.add(sky);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshPhongMaterial({ color: 0x2b2c22 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  createForest();
  createMuntjac(new THREE.Vector3(-6, 0, -12));
  createMuntjac(new THREE.Vector3(8, 0, -18));
  createMuntjac(new THREE.Vector3(-14, 0, -22));

  controls = new PointerLockControls(camera, document.body);
  controls.addEventListener('lock', () => {
    uiStatus.textContent = 'Pointer locked. Move with WASD.';
  });
  controls.addEventListener('unlock', () => {
    uiStatus.textContent = 'Pointer unlocked. Click to resume.';
  });

  document.body.addEventListener('click', () => {
    if (!controls.isLocked) controls.lock();
  });

  const onKeyDown = (event) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;
    }
  };

  const onKeyUp = (event) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  clock = new THREE.Clock();
  createHand();

  window.addEventListener('resize', onWindowResize);
}

function createForest() {
  const treeCount = 28;
  for (let i = 0; i < treeCount; i += 1) {
    const x = Math.random() * 140 - 70;
    const z = Math.random() * -140;
    const height = Math.random() * 5 + 8;
    const tree = createPineTree(height);
    tree.position.set(x, 0, z);
    scene.add(tree);
  }
}

function createPineTree(height) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, height * 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0x5e3c2b })
  );
  trunk.position.y = height * 0.15;
  group.add(trunk);

  const coneMaterial = new THREE.MeshStandardMaterial({ color: 0x104114, flatShading: true });
  for (let layer = 0; layer < 3; layer += 1) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.7 - layer * 0.45, height * 0.3, 10),
      coneMaterial
    );
    cone.position.y = height * 0.25 + layer * height * 0.18;
    cone.rotation.y = Math.random() * Math.PI;
    group.add(cone);
  }

  return group;
}

function createMuntjac(position) {
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.1, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x8a5d3f })
  );
  body.position.set(0, 0.6, 0);

  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.8, 8),
    new THREE.MeshStandardMaterial({ color: 0x7a4f33 })
  );
  head.position.set(1.4, 1.0, 0);
  head.rotation.z = Math.PI / 2;

  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x5c3a28 });
  for (let i = 0; i < 4; i += 1) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.1, 6), legMaterial);
    leg.position.set(i < 2 ? -0.7 : 0.7, 0.05, i % 2 ? 0.4 : -0.4);
    leg.rotation.x = Math.PI / 2;
    body.add(leg);
  }

  const muntjac = new THREE.Group();
  muntjac.add(body);
  muntjac.add(head);
  muntjac.position.copy(position);
  muntjac.rotation.y = Math.PI * 0.15;
  muntjac.userData = { baseY: position.y };
  scene.add(muntjac);
  objects.push(muntjac);
}

function createHand() {
  hand = new THREE.Group();

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.35, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xd9b59c })
  );
  arm.position.set(0.4, -0.6, -0.8);
  arm.rotation.x = -0.25;
  hand.add(arm);

  const palm = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.3, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xd9b59c })
  );
  palm.position.set(0.4, -0.45, -1.4);
  hand.add(palm);

  const fingerMaterial = new THREE.MeshStandardMaterial({ color: 0xcfa386 });
  for (let i = 0; i < 4; i += 1) {
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.35), fingerMaterial);
    finger.position.set(0.2 + i * 0.08, -0.35, -1.6);
    hand.add(finger);
  }

  hand.position.set(0.2, -0.45, -0.4);
  camera.add(hand);
  scene.add(camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(0.1, clock.getDelta());

  if (controls.isLocked) {
    velocity.x -= velocity.x * 8.0 * delta;
    velocity.z -= velocity.z * 8.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 35.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 35.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  }

  hand.position.y = -0.45 + Math.sin(clock.elapsedTime * 3) * 0.02;
  hand.rotation.z = Math.sin(clock.elapsedTime * 1.8) * 0.03;

  objects.forEach((obj, index) => {
    obj.position.y = obj.userData.baseY + Math.sin(clock.elapsedTime * 1.3 + index) * 0.08;
  });

  renderer.render(scene, camera);
}
