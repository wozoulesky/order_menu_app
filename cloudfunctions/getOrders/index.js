// 云函数 getOrders：查询订单
// 主人（openid 在白名单内）查全部订单；其他人只查自己的。
// 入参 event.all: 是否查全部（仅主人有效，前端按需传）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// ===== 主人 openid 白名单 =====
// 获取方式见 README：登录一次后从云开发控制台 -> 数据库 orders 集合复制你的 openid 填入。
const MASTER_OPENIDS = [
  'o7yJC17hTIbR9WnoISV1tJFydkJE'  // 主人 sky
]

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const isMaster = MASTER_OPENIDS.includes(openid)

  try {
    let query
    if (isMaster) {
      // 主人：默认查全部
      query = db.collection('orders').orderBy('createTime', 'desc')
    } else {
      // 普通用户：只查自己
      query = db.collection('orders')
        .where({ openid })
        .orderBy('createTime', 'desc')
    }

    // 单次最多取 100 条（个人使用足够，多了可改分页）
    const res = await query.limit(100).get()

    return {
      ok: true,
      isMaster,
      openid,            // 返回给前端，供 master 工具缓存
      data: res.data
    }
  } catch (err) {
    console.error('getOrders 失败', err)
    return { ok: false, msg: '查询失败', data: [] }
  }
}
