import Gif from './include/Gif';
import Webp from './include/Webp';
import { log, GetRandomInt } from '@/utils';

import type { Object } from '@/utils/types';
import type { MageAnimals } from './types';

type MageAnimalsKey = keyof MageAnimals;

async function callback(evnetname: string, data?: any) {
  const json: Object = {};
  json.event = evnetname;
  if (data) json.data = data;
  self.postMessage(json);
}

export class MageCanvas {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  get canvash() { return this.canvas?.height || 0; }
  get canvasw() { return this.canvas?.width || 0; }

  private MageAssets?: MageAnimals;
  private MageType: string = "";
  private MageActionList: (MageAnimalsKey)[];
  private MageTimer: number = 0;

  private mageAction: MageAnimalsKey = "walk";
  get MageAction() {
    return this.mageAction;
  }
  set MageAction(val: MageAnimalsKey) {
    this.mageAction = val;
  }

  constructor() {
    this.MageActionList = ['dance', 'idle', 'seat', 'lie'];
  }

  public BindCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    requestAnimationFrame(this.Animation.bind(this));
    this.AutoRandomAnimation();
  }

  public InitModel(modelName: string) {
    this.MageType = modelName;
    this.MageAssets = { // 魔界人动作
      bed: new Webp(this.LoadImage('bed.webp')),
      railing: new Webp(this.LoadImage('railing.webp')),
      desk: new Webp(this.LoadImage('desk.webp')),
      chair: new Webp(this.LoadImage('chair.webp')),
      walk: new Gif(this.LoadImage(`${modelName}_walk.gif`)),
      idle: new Gif(this.LoadImage(`${modelName}_idle.gif`)),
      dance: new Gif(this.LoadImage(`${modelName}_dance.gif`)),
      seat: new Gif(this.LoadImage(`${modelName}_seat.gif`)),
      lie: new Gif(this.LoadImage(`${modelName}_lie.gif`)),
    };
  }

  public SetActionGroup(groupNames: MageAnimalsKey[]) {
    this.MageActionList = groupNames;
  }

  public SetAction(actionName: MageAnimalsKey, delay = 3000) {
    clearTimeout(this.MageTimer);
    this.MageAction = actionName;
    this.MageTimer = setTimeout(() => {
      this.MageAction = 'walk';
      this.AutoRandomAnimation();
      callback('actionend', actionName);
    }, delay)
  }

  // 魔界人动画
  private Animation() {
    if (this.MageAssets && this.ctx) {
      // 重置画板透明度，防止有拖影
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvasw, this.canvash);
      // 获取动作
      const a = this.MageAction;
      //If gif object defined
      if (this.MageAssets[a] && !(<Gif>this.MageAssets[a]).val.loading) {
        let dy = (<Gif>this.MageAssets[a]).val.height;
        let dx = (<Gif>this.MageAssets[a]).val.width + 30;
        switch (a) {
          /* 走路 */
          case 'walk':
            // 偏差值调整
            switch (this.MageType) {
              default: dx += 10; break;
              case 'mage': dx -= 20; break;
            }
            break;
          /* 坐下 */
          case 'seat':
            switch (this.MageType) {
              case 'mage': dx -= 32; break;
            }
            if (this.MageAssets.seat.val.playSpeed < 0 && this.MageAssets.seat.val.currentFrame == 0) {
              this.MageAssets.seat.pause();
            } else if (this.MageAssets.seat.val.currentFrame == this.MageAssets.seat.val.frameCount - 1) {
              this.MageAssets.seat.pause();
            }
            break;
          /* 睡觉 */
          case 'lie':
            switch (this.MageType) {
              default: dx += 25; dy += 15; break;
              case 'mage': dx -= 20; dy += 20; break;
            }
            if (this.MageAssets.lie.val.playSpeed < 0 && this.MageAssets.lie.val.currentFrame == 0) {
              this.MageAssets.lie.pause();
            } else if (this.MageAssets.lie.val.currentFrame == this.MageAssets.lie.val.frameCount - 1) {
              this.MageAssets.lie.pause();
            }
            break;
          /* 站立 */
          case 'idle':
            // 偏差值调整
            switch (this.MageType) {
              case 'mage': dx -= 20; break;
            }
            break;
          /* 跳舞 */
          case 'dance':
            // 偏差值调整
            switch (this.MageType) {
              default: dx -= 10; break;
              case 'mage': dx -= 25; dy -= 10; break;
            }
            break;
        }
        // 设置透明
        this.ctx.setTransform(1, 0, 0, 1, this.canvasw, this.canvash);
        this.ctx.rotate(0)
        // 设置阴影
        this.ctx.shadowColor = "#000000bf";
        this.ctx.shadowOffsetY = 5;
        this.ctx.shadowBlur = 5;
        // 图层 0
        switch (a) {
          case 'seat':
            this.ctx.drawImage(this.MageAssets.chair.image!, -(this.MageAssets.chair.width + 40), -(this.MageAssets.chair.height));
            break;
          case 'lie':
            this.ctx.drawImage(this.MageAssets.bed.image!, -(this.MageAssets.bed.width), -(this.MageAssets.bed.height));
            break;
        }
        // 图层 1
        this.ctx.drawImage((<Gif>this.MageAssets[a]).val.image!, -dx, -dy);
        // 图层 2
        switch (a) {
          case 'seat':
            this.ctx.drawImage(this.MageAssets.desk.image!, -(this.MageAssets.desk.width + 16), -(this.MageAssets.desk.height));
            break;
          case 'lie':
            this.ctx.drawImage(this.MageAssets.railing.image!, -(this.MageAssets.railing.width + 2), -(this.MageAssets.railing.height + 36));
            break;
        }
        callback('updateFrame')
      }
    }
    requestAnimationFrame(this.Animation.bind(this));
  }

  // 随机动作
  private AutoRandomAnimation() {
    this.MageTimer = setTimeout(() => {
      if (this.MageAssets) {
        if (this.MageAction == 'walk') {
          // 随机动作
          const newAction = this.MageActionList[GetRandomInt(0, this.MageActionList.length - 1)];
          switch (newAction) {
            case 'dance':
            case 'idle':
              this.MageAction = newAction;
              break
            case 'seat':
              // 站立等待
              this.MageAction = 'idle';
              setTimeout(() => {
                if (this.MageAssets) {
                  this.MageAssets.seat.val.playSpeed = 1;
                  this.MageAssets.seat.replay();
                }
                this.MageAction = 'seat';
              }, 1000);
              break;
            case 'lie':
              if (this.MageAssets) {
                this.MageAssets.lie.val.playSpeed = 1;
                this.MageAssets.lie.replay();
              }
              this.MageAction = 'lie';
              break;
          }
        } else {
          // 恢复动作延迟
          let delay = 1000;
          // 动画倒放
          switch (this.MageAction) {
            case 'seat':
              this.MageAssets.seat.val.playSpeed = -1.25;
              this.MageAssets.seat.replay(this.MageAssets.seat.val.frameCount - 1);
              delay = 3000;
              break;
            case 'lie':
              this.MageAssets.lie.val.playSpeed = -1;
              this.MageAssets.lie.replay(this.MageAssets.lie.val.frameCount - 1);
              delay = 1800;
              break;
          }
          // 恢复动作
          setTimeout(() => {
            this.MageAction = 'idle';
            setTimeout(() => { this.MageAction = 'walk'; }, 1000);
          }, delay);
        }
      }
      this.AutoRandomAnimation();
    }, GetRandomInt(5, 60) * 1000)
  }

  private LoadImage(filename: string) {
    return `/images/mage/${filename}`;
  }
}

const MageAnimal = new MageCanvas();

// Webworker
self.onmessage = ({ data }: any) => {
  const func = (MageAnimal[data.func as keyof MageCanvas] as (...args: any[]) => void)?.bind(MageAnimal);
  if (func) {
    func(...(data.params || []));
  } else {
    log.error("Unknwon Function Name:", data.func, data.params);
  }
}
