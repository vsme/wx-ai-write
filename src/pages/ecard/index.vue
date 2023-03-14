<template>
  <view class="ecard">
    <nut-noticebar
      text="如有疑问请联系客服，以方便问题及时处理。"
      :background="`rgba(251, 248, 220, 1)`"
      :color="`#D9500B`"
    >
  </nut-noticebar>
    <view class="ecard-inner">
      <nut-cell>
        <nut-ecard
          choose-text="请选择金额"
          placeholder="请输入2-1000整数"
          :card-amount-min="1"
          :card-amount-max="1000"
          :card-buy-min="1"
          :card-buy-max="5"
          v-model="money"
          @input-change="inputChange"
          @change="change"
          @change-step="changeStep"
          :data-list="dataList"
        ></nut-ecard>
      </nut-cell>
      <view class="tip">{{ titile }} 支付可获得 <text>{{ parseInt(money * 30) }} 次</text> 书写服务</view>
      <nut-row :gutter="10">
        <nut-col :span="7">
            <nut-button block open-type="contact">
              客服
            </nut-button>
        </nut-col>
        <nut-col :span="17">
            <nut-button :loading="isLoading" block type="primary" @click="pay">
              支付
            </nut-button>
        </nut-col>
      </nut-row>
    </view>
  </view>
</template>

<script setup>
import {ref, reactive, computed, onBeforeMount } from 'vue';

const dataList = reactive([
  {
    price: 5
  },
  {
    price: 10
  },
  {
    price: 20
  },
  {
    price: 50
  },
  {
    price: 100
  },
  {
    price: 200
  },
])
const money = ref(5);

const inputChange = (val) => {
  money.value = val;
};

const change = (item) => {
  money.value = item.price;
};

const changeStep = (num, price) => {
  const val = price * num;
  money.value = val;
};

const isLoading = ref(false);
const times = ref(0)
const used = ref(0)
const titile = computed(() => `剩余 ${times.value} 次，已使用 ${ used.value } 次；`)

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

const pay = () => {
  wx.showLoading({
    title: "订单创建中.."
  });
  wx.cloud.callFunction({
    name: 'pay',
    data: {
      money: money.value
    },
    success: data => {
      wx.hideLoading()
      if (data.result.error) {
        wx.showToast({
          title: data.result.context,
          icon: 'error'
        })
      } else if (data.result) {
        console.log('data', data.result)
      } else {
        wx.showLoading({
          title: "支付中.."
        });
        console.log(data)
        const payment = data.result.payment
        wx.requestPayment({
          ...payment,
          success (res) {
            wx.hideLoading()
            console.log('pay success', res)
          },
          fail (err) {
            wx.hideLoading()
            console.error('pay fail', err)
          }
        })
      }
    },
  })
}
onBeforeMount(() => {
  getInfo()
})
</script>

<style lang="scss">
.ecard {
  padding: 0 0 30px;
  .ecard-inner {
    padding: 0 20px;
  }
  .notice {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 48rpx;
    align-items: center;
  }
  .nut-ecard__list__item {
    border: 1px solid transparent;
    outline: none;
  }
  .nut-ecard__list__item.active {
    border: 1px solid var(--nut-primary-color, #fa2c19);
    outline: none;
  }
}
.tip {
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: #aaa;
  text {
    color: #333;
  }
}
</style>