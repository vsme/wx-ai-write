// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  // const wxContext = cloud.getWXContext()

  // console.log(event)
  // event {
  // "appid":"wxd2d16a504f24665e",
  // "bankType":"OTHERS",
  // "cashFee":1,
  // "feeType":"CNY",
  // "isSubscribe":"N",
  // "mchId":"1800008281",
  // "nonceStr":"636fb27f117cffd1",
  // "openid":"oPoo442m3lIz9yj0rhm5gWETfwiQ",
  // "outTradeNo":"0d62532b64107759001bba304b9d3743",
  // "resultCode":"SUCCESS",
  // "returnCode":"SUCCESS",
  // "subAppid":"wx1e69038a5519c299",
  // "subIsSubscribe":"N",
  // "subMchId":"1463349102",
  // "subOpenid":"oACPq0JRepF--hP1GKKSiq2vd_uo",
  // "timeEnd":"20230314213217",
  // "totalFee":1,
  // "tradeType":"JSAPI",
  // "transactionId":"4200001804202303143078361509",
  // "userInfo":{"appId":"wx1e69038a5519c299","openId":"oACPq0JRepF--hP1GKKSiq2vd_uo"}
  // }
  try {
    const data = await db.collection('order').doc(event.outTradeNo).get()
    if (!data.done) {
      await db.collection('balance').doc(event.subOpenid).update({
        data: {
          times: _.inc(parseInt(event.totalFee / 100 * 30)),
        }
      })
    }
  
    db.collection('order').doc(event.outTradeNo).update({
      data: {
        ...event,
        done: true
      }
    })
  } catch {}

  return  {
    errcode: 0,
    errmsg: 'ok'
  }
}
