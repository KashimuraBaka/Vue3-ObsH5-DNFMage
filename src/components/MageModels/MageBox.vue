<template>
  <div :class="animationClass" :style="animationStyle" @click="bubble.clear()">
    <mage-canvas ref="mage" v-model="animationClass" @onaction="actionEvent"></mage-canvas>
    <div class="component" v-show="mageInfo.name">
      <div class="name">Lv.{{ mageInfo.level }} {{ mageInfo.name }}</div>
      <c-bubble ref="bubble"></c-bubble>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, h } from 'vue'
import { GetRandomInt } from '@/utils'

import cBubble from './MageBubble.vue'
import mageCanvas from './MageModel.vue'

import type { MageActionOptions } from './@Mage'

const props = defineProps<{
  actionlist?: string[]
}>()
// ref
const mage = ref()
const bubble = ref()
// data
const animationClass = reactive({
  'mage-img': true,
  animation: true,
  pause: false,
  flip: false,
})
const animationStyle = reactive({
  'animation-duration': '30s',
  'animation-delay': `-${GetRandomInt(1, 30)}s`,
  'z-index': 2001, // 兼容elementui loading z-index
})
const mageInfo = reactive({ name: '', level: '' })

/**
 * 设置动画时间总长
 */
const setAnimationTime = () => {
  const { clientWidth: bodyWidth } = document.body
  const time = Math.floor(bodyWidth / 10)
  animationStyle['animation-duration'] = `${time}s`
}

/**
 * 魔界人做指定动作
 * @param action 指定动作
 * @param info 对话框信息
 * @param delay 持续时间
 */
const doing = (action: string, info: MageActionOptions, delay: number) => {
  mageInfo.name = info.name || ''
  if (info.msg) {
    bubble.value.send(
      info.isface
        ? h('img', { src: info.msg })
        : h('a', { style: { color: info.color || 'white' } }, info.msg),
      delay,
    )
  }
  mageInfo.level = info.level || '0'
  animationStyle['z-index'] = 2002
  mage.value.setAction(action, delay)
}

/**
 * 动作事件
 */
const actionEvent = () => {
  mageInfo.name = ''
  bubble.value.clear()
  animationStyle['z-index'] = 2001
}

onMounted(() => {
  if (props.actionlist) {
    mage.value.actionList = props.actionlist
  }
  setAnimationTime()
})

window.addEventListener('resize', setAnimationTime)

defineExpose({ doing })
</script>

<style lang="scss" scoped>
.mage-img {
  // border: black solid 1px;
  position: absolute;
  bottom: -4px;
  user-select: none;
  pointer-events: none;

  .component {
    width: 400px;

    .name,
    .bubblebox {
      font-size: 18px;
      font-weight: bold;
      position: absolute;
      left: 136px;
      transform: translate(-50%, 0);
    }

    .name {
      bottom: 108px;
      color: #fadc64;
      text-shadow:
        0px 0px 2px black,
        0px 0px 2px black,
        0px 0px 2px black,
        0px 0px 2px black;
      white-space: nowrap;
    }

    .bubblebox {
      bottom: 140px;
    }
  }

  &.animation {
    animation-name: walk;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  &.pause {
    animation-play-state: paused;
  }

  &.flip {
    .name,
    .bubblebox {
      left: 64px;
    }
  }
}

@keyframes walk {
  0% {
    left: 0;
  }

  50% {
    left: calc(100% - 100px);
  }

  100% {
    left: 0;
  }
}
</style>
