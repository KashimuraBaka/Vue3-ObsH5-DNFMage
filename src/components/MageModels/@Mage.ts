import type { VNode } from "vue";

/** 客户端赠送礼物 */
export interface ClientGiftMap {
    /** 礼物统计倒计时 */
    timer: number
    /** 礼物对应数量 */
    gifts: { [name: string]: number }
}

export interface MageActionOptions {
    name: string
    isface: boolean
    msg: VNode | string
    level: string
    color?: string
}