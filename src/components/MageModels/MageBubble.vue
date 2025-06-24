<template>
    <div class="bubblebox">
        <transition-group appear name="fade">
            <div v-for="(val, index) in msgList" class="bubble" :key="index">
                <component :is="val.msg" />
            </div>
        </transition-group>
    </div>
</template>

<script setup lang="ts">
import { reactive, type VNode } from 'vue';
import type { MessageList } from "./types";

const msgList: MessageList = reactive({});

let id = 0;

/**
 * 发送弹幕消息
 * @param msg 对话框消息
 * @param delay 持续时间
 */
const send = async (msg: VNode, delay = 5000) => {
    if (!msg) return;
    const tid = id++;
    msgList[tid] = {
        timer: delay ? window.setTimeout(() => { delete msgList[tid] }, delay) : 0,
        msg: msg
    };
}

/**
 * 清除对话框信息
 */
const clear = async () => {
    for (const key in msgList) {
        clearTimeout(msgList[key].timer);
        delete msgList[key];
    }
    id = 0;
}

defineExpose({ send, clear });
</script>

<style lang="scss" scoped>
.bubblebox {
    display: flex;
    flex-direction: column;
    align-items: center;

    :deep(.bubble) {
        display: flex;
        width: fit-content;
        position: relative;
        color: white;
        border-radius: 5px;
        border: 2px solid #B5B8A8CC;
        background: #00000099;

        &>img {
            width: 80px;
        }

        &>a {
            margin: 12px;
        }

        &:after {
            content: "\25BC";
            color: #B5B8A8CC;
            font-size: 12px;
            position: absolute;
            inset: auto auto -12px 40%;
            transform: translate(-50%, 0);
        }

        &:not(:last-child) {
            margin-bottom: 10px;
        }
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.6s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-leave-to {
    opacity: 0;
}
</style>