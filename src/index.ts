declare function require(name: string);
import * as React from 'react';
import * as THREE from 'three';
import * as OBJLoader from 'three-obj-loader';
const PlaneOBJ = require('./models/plane.obj');
import textToPoints from './textToPoints';

import 'styles/main.scss';

OBJLoader(THREE);
const loader: THREE.OBJLoader = new THREE.OBJLoader();

const rendererWidth = 800;
const rendererHeight = 800;
const camera = new THREE.PerspectiveCamera(75, rendererWidth / rendererHeight, 0.1, 1000);
// Every mesh will have 0 as its z postion to simplify things.
const distanceFromCamera = 100;
camera.position.z = distanceFromCamera;
const visibleHeight = 2 * Math.tan((Math.PI / 180) * camera.fov / 2) * distanceFromCamera;
const visibleWidth = visibleHeight * rendererHeight / rendererHeight;

const maxSpeed = 5;
class Bird {
  private speedX = 0;
  private speedY = 0;
  private rotateX = 0.05 * Math.random() + 0.01;
  private rotateY = 0.05 * Math.random() + 0.01;
  private mesh: THREE.Group;

  constructor(srcGroup: THREE.Group, private posX: number, private posY: number) {
    this.mesh = srcGroup.clone();

    this.mesh.rotateX(Math.PI * 2 * Math.random());
    this.mesh.rotateY(Math.PI * 2 * Math.random());

    this.mesh.scale.multiplyScalar(1 + Math.random());

    this.mesh.position.x = (Math.random() - 0.5) * visibleWidth;
    this.mesh.position.y = (Math.random() - 0.5) * visibleWidth;

    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      }
    });
    scene.add(this.mesh);
  }

  update(mouseX: number, mouseY: number) {
    const { x, y } = this.mesh.position;
    this.speedX = (this.posX - x) / visibleWidth * maxSpeed;
    this.speedY = (this.posY - y) / visibleHeight * maxSpeed;

    const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
    if (distance < 20) {
      const accX = (mouseX - x) / 3;
      this.speedX -= accX;

      const accY = (mouseY - y) / 3;
      this.speedY -= accY;
    }

    this.mesh.position.x += this.speedX;
    this.mesh.rotateX(this.rotateX);
    this.mesh.rotateY(this.rotateY);
    this.mesh.position.y += this.speedY;
  }
}

const birds: Bird[] = [];
loader.load(
  PlaneOBJ, object => {
    const process = (x: number, y: number) => {
      const bird = new Bird(object, x, y);
      birds.push(bird);
    };
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    textToPoints('HELLO').forEach(d => {
      if (d[0] < minX) minX = d[0];
      if (d[1] < minY) minY = d[1];
      if (d[0] > maxX) maxX = d[0];
      if (d[1] > maxY) maxY = d[1];

      process(d[0] - visibleWidth / 2, visibleHeight / 2 - d[1]);
    });
    console.log(visibleWidth);

    console.log(minX, minY, maxX, maxY);
  },
);

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xFFFFFF));
const light = new THREE.DirectionalLight(0x4488ff, .9);
light.position.set(20, 20, 5);
scene.add(light);
const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
scene.add(hemisphereLight);
// scene.background = new THREE.Color(0xffffff);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, clearColor: 0x333333 });
renderer.setSize(rendererWidth, rendererHeight);

const displayRatio = visibleHeight / rendererWidth;
document.addEventListener('mousemove', onDocumentMouseMove);
let rayX = -100;
let rayY = -100;
function onDocumentMouseMove(evt: MouseEvent) {
  rayX = (evt.clientX - renderer.domElement.offsetLeft) * displayRatio - visibleWidth / 2;
  rayY = -((evt.clientY - renderer.domElement.offsetTop) * displayRatio - visibleHeight / 2);
}

function renderingLoop() {
  renderer.render(scene, camera);
  requestAnimationFrame(renderingLoop);
  birds.forEach(d => d.update(rayX, rayY));
}
document.querySelector('#app').appendChild(renderer.domElement);
renderingLoop();
