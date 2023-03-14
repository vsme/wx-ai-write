<template>
  <view class="history">
    <view class="pre" v-for="(item, index) in items" :key="index">
      <view class="title">
        {{ item.text }}
      </view>
      <view class="lang" v-if="item.lang">{{ item.lang }}</view>
      {{ item.result }}
      <view v-if="item.resSuggest.suggest !== 'pass'"> 内容不合规，已屏蔽。 </view>
      <view v-if="item.resSuggest.suggest === 'pass'" class="btn"><nut-button type="success" @click="copyResult(item)">复制以上文本</nut-button></view>
    </view>

    <view class="btn">
      <nut-button :disabled="isEnd" @click="loadMore">{{isEnd ? items.length == 0 ? "还没有提问哦" : "没有更多啦" : "点击加载更多"}}</nut-button>
    </view>
  </view>
</template>

<script setup>
import {ref, onBeforeMount } from 'vue';
import Taro from '@tarojs/taro'

const items = ref([])
const pageNum = ref(1)
const pageSize = ref(10)

const isEnd = ref(false)
const getList = () => {
  wx.showLoading({
    title: "加载中.."
  });
  wx.cloud.callFunction({
    name: 'history',
    data: {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    },
    success: data => {
      wx.hideLoading()
      if (data.result.length == 0) {
        isEnd.value = true
      } else {
        for (let o of data.result) {
          items.value.push(o)
        }
      }
    },
  })
}

const loadMore = () => {
  if (isEnd.value) return
  pageNum.value++
  getList()
}

const copyResult = (v) => {
  Taro.setClipboardData({
    data: v,
    success (res) {
      Taro.showToast({
        title: "文本复制成功"
      })
    }
  })
}

onBeforeMount(() => {
  pageNum.value = 1
  getList()
})
</script>

<style lang="scss">
.history {
  padding-bottom: 10vh;
  .pre {
    word-wrap: break-word;
    word-break: break-all;
    white-space: pre-line;
    margin: 20px;
    padding: 20px;
    border-radius: 10px;
    margin-top: 3vh;
    font-size: 12px;
    box-shadow: 0 0 10px 6px rgba(0, 0, 0, 0.15);
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .lang {
      color: #999;
      margin: -5px 0 15px;
    }
  }
  .btn {
    display: flex;
    margin-top: 15px;
    justify-content: center;
  }
}
</style>