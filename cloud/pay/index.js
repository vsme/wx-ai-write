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

  const subMchId = '1463349102'

  const order = await db.collection('order').add({
    data: {
      _openid: wxContext.OPENID,
      createTime: db.serverDate(),
      subMchId,
      totalFee: parseInt(event.money * 100),
      done: false
    }
  })

  try {
    const res = await cloud.cloudPay.unifiedOrder({
      envId: "cloud1-4g8rhdreaa5a2447",
      functionName: "paycb",
      body: "购买书写服务",
      spbillCreateIp: "127.0.0.1",
      subMchId,
      outTradeNo: order._id,
      totalFee: parseInt(event.money * 100),
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
