<template>
  <view class="index">
    <Counter />
    <button @tap="getUserInfo">
      button1
    </button>
    <button @tap="aiGenerate">
      aiGenerate
    </button>
  </view>
</template>

<script setup>
import './index.scss'
import Counter from '../../components/Counter.vue'

const getUserInfo = () => {
  wx.showLoading();
  wx.cloud.callFunction({
    name: 'getInfo',
    complete: res => {
      console.log('callFunction test result: ', res)
      wx.hideLoading()
    }
  })
}

const aiGenerate = () => {
  wx.showLoading();
  wx.cloud.callFunction({
    name: 'generate',
    complete: res => {
      console.log('callFunction generate result: ', res)
      wx.hideLoading()
    }
  })
}
</script>
