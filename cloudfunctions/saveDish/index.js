// 云函数 saveDish：新增 / 编辑菜品（仅主人可用）
// 入参 event:
//   dish: 菜品对象 { _id?, name, category, imageFileID, ingredients[], seasonings[], steps[] }
//   有 _id  -> 更新；无 _id -> 新增
// 权限：openid 必须在 MASTER_OPENIDS 白名单内
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// ===== 主人 openid 白名单（与 getOrders 保持一致）=====
const MASTER_OPENIDS = [
  'o7yJC17hTIbR9WnoISV1tJFydkJE'  // 主人 sky
]

// 合法分类
const VALID_CATEGORIES = ['荤菜', '素菜', '汤品', '主食', '饮品']

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 1. 权限校验
  if (!MASTER_OPENIDS.includes(openid)) {
    return { ok: false, msg: '无权限：仅主人可添加/编辑菜品' }
  }

  const { dish } = event
  if (!dish) {
    return { ok: false, msg: '缺少菜品数据' }
  }

  // 2. 字段校验
  if (!dish.name || !dish.name.trim()) {
    return { ok: false, msg: '请填写菜品名称' }
  }
  if (!dish.category || !VALID_CATEGORIES.includes(dish.category)) {
    return { ok: false, msg: '分类不合法' }
  }
  if (!Array.isArray(dish.ingredients)) dish.ingredients = []
  if (!Array.isArray(dish.seasonings)) dish.seasonings = []
  if (!Array.isArray(dish.steps)) dish.steps = []

  // 3. 组装数据
  const data = {
    name: dish.name.trim(),
    category: dish.category,
    imageFileID: dish.imageFileID || '',
    ingredients: dish.ingredients,
    seasonings: dish.seasonings,
    steps: dish.steps,
    updateTime: db.serverDate()
  }

  try {
    // 4. 新增 or 更新
    if (dish._id) {
      await db.collection('dishes').doc(dish._id).update({ data })
      return { ok: true, msg: '更新成功', _id: dish._id }
    } else {
      data.createTime = db.serverDate()
      const res = await db.collection('dishes').add({ data })
      return { ok: true, msg: '添加成功', _id: res._id }
    }
  } catch (err) {
    console.error('saveDish 失败', err)
    return { ok: false, msg: '保存失败：' + err.message }
  }
}
