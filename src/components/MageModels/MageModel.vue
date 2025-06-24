<template>
  <canvas :class="canvasClass" ref="canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, onUnmounted } from 'vue'
import { MageModel } from '@/components/MageModels/lib/MageModel'

const args = defineProps<{
  modelValue: {
    'mage-img': boolean
    animation: boolean
    pause: boolean
    flip: boolean
  }
}>()

const emit = defineEmits<{ (e: 'onaction', action: string): void }>()
// ref组件
const canvas = ref<HTMLCanvasElement>()
const fClass = reactive(args.modelValue)
const canvasClass = reactive({
  model: true,
  flip: false,
})
const actionList = ref(['dance', 'idle', 'seat', 'lie'])
// 画板属性
let AfterRight = 9999
let _advance = false
const advance = computed({
  get: () => _advance,
  set: (val: boolean) => {
    if (_advance != val) {
      // 如果动画后退则进行图像翻转
      fClass.flip = !val
      canvasClass.flip = !val
      _advance = val
    }
  },
})
// 随机模型
const Model = new MageModel()

/** 模型动画发生改变 */
Model.onUpdateFrame = () => {
  const box = canvas.value
  const { clientWidth } = document.body
  const right = box ? clientWidth - box.getBoundingClientRect().right : clientWidth
  // 动画如果变动
  if (AfterRight != right) {
    // 向前运动
    advance.value = AfterRight > (AfterRight = right)
  }
}

/** 模型动作发生改变 */
Model.onAction = (action: string) => {
  switch (action) {
    default:
      fClass.pause = true
      break
    case 'walk':
      fClass.pause = false
      break
  }
}

/** 模型动作结束 */
Model.onActionEnd = (action: string) => {
  emit('onaction', action)
}

onMounted(() => {
  // 设置模型动作组
  Model.setActionGroup([...actionList.value])
  canvas.value!.width = 200
  canvas.value!.height = 140
  Model.bindCanvas(canvas.value!.transferControlToOffscreen())
})

onUnmounted(() => {
  Model.close()
})

defineExpose({
  actionList,
  setAction: (action: string, delay: number) => Model.setAction(action, delay),
})
</script>

<style lang="scss" scoped>
/* 配合 worker canvas 有残留阴影
.model {
    filter: drop-shadow(0px 5px 3px #000);
} */
.flip {
  transform: rotateY(180deg);
}
</style>
