import ModelWorker from "./MageModelWorker.ts?worker";
import { GetRandomInt } from "@/utils";

import type { MageModelEvent } from "./types";
import type { MageCanvas } from "./MageModelWorker";

export class MageModel {
  private worker = new ModelWorker();

  public onUpdateFrame?: () => void
  public onAction?: (_: string) => void;
  public onActionEnd?: (_: string) => void;

  constructor() {
    // 初始化模型
    this.function("InitModel", [[
      'blanket', 'basic', 'dizzy',
      'drowsy', 'sad', 'shy',
      'twinkle', 'angry', 'egg',
      'glummy', 'happy', 'scooter',
      'mage'
    ][GetRandomInt(0, 12)]]);
    // 处理事件
    this.worker.onmessage = (data) => this.onMessage(data);
  }

  /** 绑定画布 */
  public bindCanvas(canvasTransfer: OffscreenCanvas) {
    this.function("BindCanvas", [canvasTransfer], [canvasTransfer])
  }

  /** 设置模型动作组 */
  public setActionGroup(actions: string[]) {
    this.function("SetActionGroup", [actions]);
  }

  /** 修改当前模型动作 */
  public setAction(action: string, delay: number) {
    this.function("SetAction", [action, delay]);
  }

  /** 销毁 WebWorker 线程 */
  public close() {
    this.worker.terminate();
  }

  /** WebWorker 消息事件 */
  private async onMessage({ data: { event, data } }: MessageEvent<MageModelEvent>) {
    switch (event) {
      case 'updateFrame': this.onUpdateFrame?.(); break;
      case 'action': this.onAction?.(data); break;
      case 'actionend': this.onActionEnd?.(data); break;
    }
  }

  /** 执行 WebWorker 内置函数 */
  private function(func: keyof MageCanvas, params: any[], transfer?: Transferable[]) {
    if (transfer) {
      this.worker.postMessage({ func: func, params: params }, transfer);
    } else {
      this.worker.postMessage({ func: func, params: params });
    }
  }
}
