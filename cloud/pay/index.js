// 云函数代码
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  const money = event.money;
  
  if (!money) {
    return {
      error: true,
      context: "请选择金额"
    }
  }

  try {
    const res = await cloud.cloudPay.unifiedOrder({
      "envId": "cloud1-4g8rhdreaa5a2447",
      "functionName": "pay_cb",
      "subMchId" : "1463349102",
      "body" : "购买书写服务",
      "outTradeNo" : "1",
      "totalFee" : 1,
      "spbillCreateIp" : "127.0.0.1",
    })
    if (res.resultCode != 'SUCCESS') {
      return {
        error: true,
        context: "订单创建失败"
      }
    }
    return res
  } catch(e) {
    return {
      error: true,
      context: "微信订单创建失败"
    }
  }
}
