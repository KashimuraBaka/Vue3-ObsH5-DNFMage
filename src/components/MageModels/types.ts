import type { VNode } from "vue"

/** 弹幕消息列表 */
export interface MessageList {
    /** 对话id及对话计时器 */
    [name: string]: MessageTimer
}

/** 对话计时器 */
export interface MessageTimer {
    /** 消息 */
    msg: VNode
    /** 计时器 */
    timer: number
}