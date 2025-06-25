<script setup lang="ts">
import { h, Fragment } from 'vue'
import { GetRandomInt } from '@/utils/'
import { DanmakuClient } from './utils/Danmaku/DanmakuClient'
import MageNPC from './components/MageModels/MageBox.vue'

import type { MageActionOptions } from './components/MageModels/@Mage'

const mage: Array<InstanceType<typeof MageNPC>> = []
const getref = (el: any) => mage.push(el)

// 获取查询字符串
const URLObj = new URLSearchParams(window.location.search)
// 魔界人数量
const num = parseInt(URLObj.get('num') || '1')
// 设置缩放
document.body.setAttribute('style', `zoom: ${parseFloat(URLObj.get('zoom') || '100') / 100}`)
// 服务器地址
const serverUrl = URLObj.get('danmuji_url')

if (serverUrl) {
  const client = new DanmakuClient(serverUrl)
  client.OnReciveDanmu = (data) => {
    const isface = data.emoji_img_url != ''
    SendRandomMage(
      'idle',
      {
        name: data.uname,
        isface: isface,
        msg: isface ? data.emoji_img_data : data.msg,
        level: String(data.guard_level),
      },
      5000,
    )
  }
  client.OnSendGift = (gift) => {
    SendRandomMage(
      'dance',
      {
        name: '猪头',
        isface: false,
        msg: h(Fragment, {}, [
          '感谢 ',
          h('a', { style: { color: '#73a1ff' } }, gift.uname),
          ' 送的 ',
          gift.gift_name,
        ]),
        level: '??',
      },
      5000,
    )
  }
}

/**
 * 随机向魔界人发送动作信息
 * @param action 动作动画
 * @param options 配置信息
 * @param delay 持续时间
 */
function SendRandomMage(action: string, options: MageActionOptions, delay: number) {
  const randnum = GetRandomInt(0, num - 1)
  mage[randnum].doing(action, options, delay)
}
</script>

<template>
  <MageNPC v-for="count in num" :key="count" :ref="getref" :actionlist="['idle', 'seat', 'lie']" />
</template>

<style lang="scss">
html,
body {
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
  // background-color: royalblue;
}
</style>
