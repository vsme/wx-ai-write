// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 获取分页参数
  const { pageNum, pageSize } = event
  // 计算跳过的文档数量
  const skipCount = (pageNum - 1) * pageSize

  try {
    const result = await db.collection('task')
      .field({
        lang: true,
        text: true,
        result: true,
        resSuggest: true,
        done: true
      })
      .where({_openid: wxContext.OPENID, done: true})
      .skip(skipCount)
      .limit(pageSize)
      .orderBy("createTime", 'desc')
      .get()

      for (let o of result.data) {
        if (o.resSuggest.suggest != 'pass') {
          o.result = ''
        }
      }

  // 返回查询结果
  return result.data
  } catch {
    return []
  }
}