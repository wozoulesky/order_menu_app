// 云函数 submitOrder：提交订单
// 入参:
//   event.dishes:    [{ id, name }]
//   event.nickname:  下单人昵称（前端填写）
//   event.avatarUrl: 下单人头像（前端填写，可空）
// openid 由云上下文自动获取，作为唯一身份标识
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { dishes, nickname, avatarUrl } = event

  // 基本校验
  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return { ok: false, msg: '菜品不能为空' }
  }
  if (!nickname) {
    return { ok: false, msg: '缺少昵称' }
  }

  try {
    const res = await db.collection('orders').add({
      data: {
        openid,
        nickname,
        avatarUrl: avatarUrl || '',
        dishes,
        createTime: db.serverDate()  // 服务端时间
      }
    })
    return { ok: true, orderId: res._id }
  } catch (err) {
    console.error('submitOrder 失败', err)
    return { ok: false, msg: '提交失败，请重试' }
  }
}
