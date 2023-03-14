<template>
  <view class="index">
    <view class="index-inner">
      <nut-cell :desc="popupDesc + '&nbsp;>'" title="选择话题" @click="show = true">
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
      <nut-textarea placeholder="请输入..." v-model="text" limit-show :max-length="used >= 3 ? 800 : 200" />

      <nut-button type="primary" plain @tap="aiGenerate">
        点击发送
      </nut-button>
      <view class="tip">
        <text v-if="times > 0 && used == 0">初次见面，赠送 {{times}} 次体验，</text>
        <text v-if="used < 10">{{ titile }}</text>
      </view>

    </view>
    <nut-fixed-nav :position="{ bottom:'80px' }" v-model:visible="navVisible" @selected="selectedNav" :nav-list="navList" />

    <view class="pre" v-if="resultStr">
      {{ resultStr }}
      <view class="btn"><nut-button type="success" @click="copyResult">复制以上文本</nut-button></view>
    </view>

    <nut-dialog title="小提示" :content="errorDlogMsg" :no-cancel-btn="errorDlogType != 1" v-model:visible="errorDlogShow" @cancel="onCancel" @ok="onOk" />
  </view>
</template>

<script setup>
import {ref, reactive, computed, onBeforeMount, onMounted} from 'vue'
import Taro, {usePullDownRefresh} from '@tarojs/taro'

const show = ref(false)
const popupDesc = ref("随便问问")
const popupValue = ref([""]);
const text = ref("");
const resultStr = ref("");
const columns = ref([
  { text: '随便问问', value: '' },
  { text: '编工作日报', value: '编日报' },
  { text: '写情书', value: '写情书' },
  { text: '小红书文案', value: '小红书文案' },
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
      wx.stopPullDownRefresh()
    }
  })
}

onBeforeMount(() => {
  getInfo()
})

usePullDownRefresh(() => {
  getInfo()
})

onMounted(() => {
  // setTimeout(() => {
  //   showTour.value = true
  // }, 250);
})

const navVisible = ref(false)
const navList = reactive([
  {
    id: 1,
    text: '历史',
    url: '/pages/history/index',
    icon: 'cloud://cloud1-4g8rhdreaa5a2447.636c-cloud1-4g8rhdreaa5a2447-1254285449/history.png'
  },
  {
    id: 2,
    text: '储值',
    url: '/pages/ecard/index',
    icon: 'cloud://cloud1-4g8rhdreaa5a2447.636c-cloud1-4g8rhdreaa5a2447-1254285449/me2.png'
  },
])
const selectedNav = (e) => {
  console.log(e.item.url)
  Taro.navigateTo({
    url: e.item.url
  })
}

const showTour = ref(false)
const steps = ref([
  {
    content: '选择想要的话题',
    target: 'target1',
    location: 'bottom-end'
  },
  {
    content: '这里输入问题或要求，以方便提供回答或建议。',
    target: 'target2',
  },
  {
    content: '点击发送按钮，稍等20秒，大功告成。',
    target: 'target3',
    location: 'top-end'
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
    position: relative;
    .nut-cell__value {
      color: #666;
    }
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