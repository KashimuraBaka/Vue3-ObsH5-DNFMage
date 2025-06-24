import Gif from './include/Gif';
import Webp from './include/Webp';
import { log } from '@/utils';

import type { Object } from '@/utils/types';
import type { MageAnimals } from './@mageModel';

const tasks: { [name: string]: any } = {};

const action = {
  // 动作
  _value: "walk",
  get value() {
    return this._value;
  },
  set value(val: string) {
    callback('action', val);
    this._value = val;
  }
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
// 魔法师模型
let mage: MageAnimals;
let mageType = ""; // 魔法师类型
let actionList = ['dance', 'idle', 'seat', 'lie'];
// 画板宽度/高度
let canvasw: number, canvash: number;
let timer: any = 0;

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

// Webworker
self.onmessage = ({ data }: any) => {
  (tasks[data.func] || log.error)(...(data.params || []));
}

async function callback(evnetname: string, data?: any) {
  const json: Object = {};
  json.event = evnetname;
  if (data) json.data = data;
  self.postMessage(json);
}

// 因为打包WorkerJS路径是指定路径，而资源访问使用相对路径。自动使用绝对路径访问资源
function loadImage(filename: string) {
  return `/images/mage/${filename}`;
}

// 加载模型
tasks.init = async (name: string) => {
  mageType = name;
  mage = { // 魔界人动作
    bed: new Webp(loadImage('bed.webp')),
    railing: new Webp(loadImage('railing.webp')),
    desk: new Webp(loadImage('desk.webp')),
    chair: new Webp(loadImage('chair.webp')),
    walk: new Gif(loadImage(`${mageType}_walk.gif`)),
    idle: new Gif(loadImage(`${mageType}_idle.gif`)),
    dance: new Gif(loadImage(`${mageType}_dance.gif`)),
    seat: new Gif(loadImage(`${mageType}_seat.gif`)),
    lie: new Gif(loadImage(`${mageType}_lie.gif`)),
  };
}

// 启用
tasks.bindCanvas = (offScreen: HTMLCanvasElement) => {
  canvas = offScreen;
  canvash = offScreen.height;
  canvasw = offScreen.width;
  ctx = canvas.getContext("2d")!;
  requestAnimationFrame(Animation);
  animationTimer();
}

// 启用动作
tasks.setActionGroup = (data: string[]) => {
  actionList = data;
}

tasks.setAction = (actionName: string, delay = 3000) => {
  clearTimeout(timer);
  action.value = actionName;
  timer = setTimeout(() => {
    action.value = 'walk';
    animationTimer();
    callback('actionend', actionName);
  }, delay)
}

// 魔界人动画
function Animation() {
  // 重置画板透明度，防止有拖影
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvasw, canvash);
  const a = action.value;
  //If gif object defined
  if (mage[a] && !(<Gif>mage[a]).val.loading) {
    let dy = (<Gif>mage[a]).val.height;
    let dx = (<Gif>mage[a]).val.width + 30;
    switch (a) {
      /* 走路 */
      case 'walk':
        // 偏差值调整
        switch (mageType) {
          default: dx += 10; break;
          case 'mage': dx -= 20; break;
        }
        break;
      /* 坐下 */
      case 'seat':
        switch (mageType) {
          case 'mage': dx -= 32; break;
        }
        if (mage.seat.val.playSpeed < 0 && mage.seat.val.currentFrame == 0) {
          mage.seat.pause();
        } else if (mage.seat.val.currentFrame == mage.seat.val.frameCount - 1) {
          mage.seat.pause();
        }
        break;
      /* 睡觉 */
      case 'lie':
        switch (mageType) {
          default: dx += 25; dy += 15; break;
          case 'mage': dx -= 20; dy += 20; break;
        }
        if (mage.lie.val.playSpeed < 0 && mage.lie.val.currentFrame == 0) {
          mage.lie.pause();
        } else if (mage.lie.val.currentFrame == mage.lie.val.frameCount - 1) {
          mage.lie.pause();
        }
        break;
      /* 站立 */
      case 'idle':
        // 偏差值调整
        switch (mageType) {
          case 'mage': dx -= 20; break;
        }
        break;
      /* 跳舞 */
      case 'dance':
        // 偏差值调整
        switch (mageType) {
          default: dx -= 10; break;
          case 'mage': dx -= 25; dy -= 10; break;
        }
        break;
    }
    // 设置透明
    ctx.setTransform(1, 0, 0, 1, canvasw, canvash);
    ctx.rotate(0)
    // 设置阴影
    ctx.shadowColor = "#000000bf";
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 5;
    // 图层 0
    switch (a) {
      case 'seat': ctx.drawImage(mage.chair.image!, -(mage.chair.width + 40), -(mage.chair.height)); break;
      case 'lie': ctx.drawImage(mage.bed.image!, -(mage.bed.width), -(mage.bed.height)); break;
    }
    // 图层 1
    ctx.drawImage((<Gif>mage[a]).val.image!, -dx, -dy);
    // 图层 2
    switch (a) {
      case 'seat': ctx.drawImage(mage.desk.image!, -(mage.desk.width + 16), -(mage.desk.height)); break;
      case 'lie': ctx.drawImage(mage.railing.image!, -(mage.railing.width + 2), -(mage.railing.height + 36)); break;
    }
    callback('updateFrame')
  }
  requestAnimationFrame(Animation);
}

// 随机动作
function animationTimer() {
  timer = setTimeout(() => {
    if (action.value == 'walk') {
      // 随机动作
      switch (actionList[randInt(0, actionList.length - 1)]) {
        case 'dance':
          action.value = 'dance';
          break;
        case 'idle':
          action.value = 'idle';
          break
        case 'seat':
          // 站立等待
          action.value = 'idle';
          setTimeout(() => {
            mage.seat.val.playSpeed = 1;
            mage.seat.replay();
            action.value = 'seat';
          }, 1000);
          break;
        case 'lie':
          mage.lie.val.playSpeed = 1;
          mage.lie.replay();
          action.value = 'lie';
          break;
      }
    } else {
      // 恢复动作延迟
      let delay = 1000;
      // 动画倒放
      switch (action.value) {
        case 'seat':
          mage.seat.val.playSpeed = -1.25;
          mage.seat.replay(mage.seat.val.frameCount - 1);
          delay = 3000;
          break;
        case 'lie':
          mage.lie.val.playSpeed = -1;
          mage.lie.replay(mage.lie.val.frameCount - 1);
          delay = 1800;
          break;
      }
      // 恢复动作
      setTimeout(() => {
        action.value = 'idle';
        setTimeout(() => { action.value = 'walk'; }, 1000);
      }, delay);
    }
    animationTimer();
  }, randInt(5, 60) * 1000)
}
