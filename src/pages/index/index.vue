<template>
  <view class="index">
    <view class="index-inner">
      <nut-cell title="选择话题" @click="show = true">
        <template v-slot:link>
          <text>{{ popupDesc }}</text> &nbsp; >
        </template>
      </nut-cell>
      <nut-popup position="bottom" v-model:visible="show">
        <nut-picker
          v-model="popupValue"
          :columns="columns"
          title="请选择话题"
          @confirm="popupConfirm"
          @cancel="show = false"
        >
        </nut-picker>
      </nut-popup>

      <nut-textarea placeholder="请输入... 可以回答常见问题、技术问题、文化问题、还可以生成文章、新闻、故事等等。" v-model="text" limit-show max-length="200" />

      <nut-button type="primary" plain @tap="aiGenerate">
        点击开始书写
      </nut-button>
      <view class="tip">
        <text v-if="times > 0 && used == 0">初次见面，赠送 {{times}} 次体验，</text>
        {{ titile }}
      </view>

    </view>
    <nut-fixed-nav :position="{ bottom:'80px' }" v-model:visible="navVisible" :nav-list="navList" />

    <view class="pre" v-if="resultStr">
      {{ resultStr }}
      <view class="btn"><nut-button type="success" @click="copyResult">复制以上文本</nut-button></view>
    </view>

    <nut-dialog title="小提示" :content="errorDlogMsg" :no-cancel-btn="errorDlogType != 1" v-model:visible="errorDlogShow" @cancel="onCancel" @ok="onOk" />
  </view>
</template>

<script setup>
import {ref, reactive, computed, onBeforeMount} from 'vue'
import Taro from '@tarojs/taro'

const show = ref(false)
const popupDesc = ref("直接书写")
const popupValue = ref([""]);
const text = ref("");
const resultStr = ref("");
const columns = ref([
  { text: '直接书写', value: '' },
  { text: '小红书文案', value: '小红书文案' },
  { text: '编工作日报', value: '编日报' },
  { text: '中文邮件', value: '中文邮件' },
  { text: '英文邮件', value: '英文邮件' },
  // { text: '说了啥', value: '说了啥' },
  // { text: '写个正则', value: '写个正则' },
  { text: '根据单词写个英语作文', value: '英语作文' },
  { text: '修改英语语法', value: '修改英语语法' },
  { text: '哄媳妇睡觉小故事', value: '哄媳妇睡觉小故事' },
]);

const popupConfirm = ( { selectedValue,selectedOptions })=>{
  popupDesc.value = selectedOptions.map((val) => val.text).join(',')
  show.value = false
}

const errorDlogShow = ref(false)
const errorDlogMsg = ref("")
const errorDlogType = ref(0)
const onCancel = () => {
  console.log('event cancel');
};
const onOk = () => {
  if (errorDlogType.value == 1) {
    Taro.navigateTo({
      url: "/pages/ecard/index"
    })
  }
};
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
      if (data.result.error) {
        if (data.result.type == 1) {
          // 充值
        }
        errorDlogType.value = data.result.type
        errorDlogMsg.value = data.result.context
        errorDlogShow.value = true
      } else {
        console.log('callFunction generate result: ', data.result.steamStr);
        resultStr.value = data.result.steamStr;
        getInfo()
      }
    }
  })
}

const copyResult = () => {
  Taro.setClipboardData({
    data: resultStr.value,
    success (res) {
      Taro.showToast({
        title: "文本复制成功"
      })
    }
  })
}

const times = ref(0)
const used = ref(0)
const titile = computed(() => `剩余 ${times.value} 次，已使用 ${ used.value || 0 } 次。`)

const getInfo = () => {
  wx.showLoading()
  wx.cloud.callFunction({
    name: 'balance',
    complete: data => {
      wx.hideLoading()
      times.value = data.result.times
      used.value = data.result.used
    }
  })
}

onBeforeMount(() => {
  getInfo()
})

const navVisible = ref(false)
const navList = reactive([
  {
    id: 1,
    text: '历史',
    icon: 'cloud://cloud1-4g8rhdreaa5a2447.636c-cloud1-4g8rhdreaa5a2447-1254285449/history.png'
  },
  {
    id: 2,
    text: '储值',
    icon: 'cloud://cloud1-4g8rhdreaa5a2447.636c-cloud1-4g8rhdreaa5a2447-1254285449/me2.png'
  },
])
</script>

<style lang="scss">
.index {
  padding-bottom: 10vh;
  .index-inner {
    padding: 20px;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
  }
  .nut-textarea {
    padding: 10px;
  }
}
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
  .btn {
    display: flex;
    margin-top: 10px;
    justify-content: center;
  }
}
.tip {
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: #aaa;
}
</style>