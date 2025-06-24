import type Gif from "./include/Gif"
import type Webp from "./include/Webp"

/** 模型动作响应时间 */
export interface MageModelEvent {
  /** 事件名称 */
  event: string
  /** 返回动作数据 */
  data: string
}

export interface MageAnimals {
  bed: Webp
  railing: Webp
  desk: Webp
  chair: Webp
  walk: Gif
  idle: Gif
  dance: Gif
  seat: Gif
  lie: Gif
}
