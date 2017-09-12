declare function require(name: string);
import * as React from 'react';
import * as THREE from 'three';
import * as OBJLoader from 'three-obj-loader';
const PlaneOBJ = require('./models/plane.obj');
import textToPoints from './textToPoints';

import 'styles/main.scss';

OBJLoader(THREE);
const loader: THREE.OBJLoader = new THREE.OBJLoader();

const rendererWidth = 1000;
const rendererHeight = 1000;
const camera = new THREE.PerspectiveCamera(75, rendererWidth / rendererHeight, 0.1, 1000);
// Every mesh will have 0 as its z postion to simplify things.
const distanceFromCamera = 100;
camera.position.z = distanceFromCamera;
const visibleHeight = 2 * Math.tan((Math.PI / 180) * camera.fov / 2) * distanceFromCamera;
const visibleWidth = visibleHeight * rendererHeight / rendererHeight;

const maxSpeed = 5;
class Plane {
  private speedX = 0;
  private speedY = 0;
  private rotateX = 0.05 * Math.random() + 0.01;
  private rotateY = 0.05 * Math.random() + 0.01;
  private mesh: THREE.Group;

  constructor(srcGroup: THREE.Group, private posX: number, private posY: number) {
    this.mesh = srcGroup.clone();

    this.mesh.rotateX(Math.PI * 2 * Math.random());
    this.mesh.rotateY(Math.PI * 2 * Math.random());
    this.mesh.scale.divideScalar(2);

    this.mesh.scale.multiplyScalar(1 + Math.random());

    this.mesh.position.x = (Math.random() - 0.5) * visibleWidth;
    this.mesh.position.y = (Math.random() - 0.5) * visibleHeight;

    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      }
    });
    scene.add(this.mesh);
  }

  setPos(x: number, y: number) {
    this.posX = x;
    this.posY = y;
  }

  update(mouseX: number, mouseY: number) {
    const { x, y } = this.mesh.position;
    this.speedX = (this.posX - x) / visibleWidth * maxSpeed;
    this.speedX = Math.min(this.speedX, maxSpeed);
    this.speedY = (this.posY - y) / visibleHeight * maxSpeed;
    this.speedY = Math.min(this.speedY, maxSpeed);

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

  destroy() {
    scene.remove(this.mesh);
  }
}

let planes: Plane[] = [];
loader.load(
  PlaneOBJ, object => {
    const process = (x: number, y: number) => {
      const bird = new Plane(object, x, y);
      planes.push(bird);
    };

    const drawText = (text: string, left: number, right: number, top: number) => {
      let minX = Number.MAX_VALUE;
      let minY = Number.MAX_VALUE;
      let maxX = Number.MIN_VALUE;
      let maxY = Number.MIN_VALUE;

      const points = textToPoints(text);
      points.forEach(d => {
        if (d[0] < minX) minX = d[0];
        if (d[1] < minY) minY = d[1];
        if (d[0] > maxX) maxX = d[0];
        if (d[1] > maxY) maxY = d[1];
      });
      const scale = (right - left) / (maxX - minX);
      points.forEach(([x, y]) => {
        process(left + x * scale, top - y * scale);
      });
    };
    drawText('HELLO', -visibleWidth / 2 + 20, visibleWidth / 2 - 20, visibleHeight / 2 - 30);
    drawText('WORLD', -visibleWidth / 2 + 20, visibleWidth / 2 - 20, visibleHeight / 2 - 80);

    setTimeout(() => {
      planes.forEach((d, i) => {
        const x = (Math.random() - 0.5) * visibleWidth;
        const y = (Math.random() - 0.5) * visibleWidth;
        d.setPos(x, y);
      });
    }, 4000);

    setTimeout(() => {
      planes.forEach((d, i) => {
        d.destroy();
      });
      planes = [];
      drawText('100 DAYS OF CODE', -visibleWidth / 2 + 20, visibleWidth / 2 - 20, visibleHeight / 2 - 60);
    }, 7000);
  },
);

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xFFFFFF));
const light = new THREE.DirectionalLight(0xffffff, .9);
light.position.set(200, 200, 5);
scene.add(light);
const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x444444, 0.9);
scene.add(hemisphereLight);
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
  planes.forEach(d => d.update(rayX, rayY));
}
document.querySelector('#app').appendChild(renderer.domElement);
renderingLoop();
