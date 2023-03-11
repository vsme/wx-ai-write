// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const balanceData = await db.collection('balance').doc(wxContext.OPENID).get()
    return {
      times: balanceData.data.times,
      used: balanceData.data.used
    }
  } catch(e) {
    await db.collection('balance').add({
      data: {
        _id: wxContext.OPENID,
        createTime: db.serverDate(),
        times: 5,
        used: 0
      }
    })
    return {
      times: 5,
      used: 0
    }
  }
}