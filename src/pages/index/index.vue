<template>
  <view class="index">
    <nut-cell title="选择话题" :desc="popupDesc" @click="show = true"></nut-cell>
    <nut-popup position="bottom" v-model:visible="show">
      <nut-picker
        v-model="popupValue"
        :columns="columns"
        title="请选择城市"
        @confirm="popupConfirm"
        @cancel="show = false"
      >
      </nut-picker>
    </nut-popup>

    <nut-textarea v-model="text" limit-show max-length="20" />

    <button @tap="aiGenerate">
      aiGenerate
    </button>

    <view>{{ resultStr }}</view>
  </view>
</template>

<script setup>
import {ref, onMounted} from 'vue'

const show = ref(false)
const popupDesc = ref("小红书文案")
const popupValue = ref(["小红书文案"]);
const text = ref("写一句简短的祝福");
const resultStr = ref("");
const columns = ref([
  { text: '直接发给小跟班', value: '' },
  { text: '英文邮件', value: '英文邮件' },
  { text: '中文邮件', value: '中文邮件' },
  { text: '说了啥', value: '说了啥' },
  { text: '写个正则', value: '写个正则' },
  { text: '根据单词写个英语作文', value: '英语作文' },
  { text: '修改英语语法', value: '修改英语语法' },
  { text: '编工作日报', value: '编日报' },
  { text: '哄媳妇睡觉小故事', value: '哄媳妇睡觉小故事' },
  { text: '小红书文案', value: '小红书文案' },
]);

const popupConfirm = ( { selectedValue,selectedOptions })=>{
  popupDesc.value = selectedOptions.map((val) => val.text).join(',')
  show.value = false
}

const aiGenerate = () => {
  wx.showLoading({
    title: "书写中.."
  });
  wx.cloud.callFunction({
    name: 'generate',
    data: {
      lang: popupValue.value[0],
      text: text.value,
    },
    complete: data => {
      wx.hideLoading()
      console.log('callFunction generate result: ', data.result.steamStr);
      resultStr.value = data.result.steamStr;
    }
  })
}
</script>
