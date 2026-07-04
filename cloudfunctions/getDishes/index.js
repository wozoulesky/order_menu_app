// 云函数 getDishes：读取菜品列表
// 入参 event:
//   category (string, 可选): 按分类过滤；不传则返回全部
//   id       (string, 可选): 按 _id 取单条
// 返回 { ok, data, categories }
//
// 图片处理：菜品的 imageFileID 是云存储 fileID，
// 需用 cloud.getTempFileURL 转成可显示的临时链接，放到 imageUrl 字段返回。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 分类列表（与本地一致；后续如需分类管理可改成从单独集合读）
const CATEGORIES = ['荤菜', '素菜', '汤品', '主食', '饮品']

exports.main = async (event, context) => {
  const { category, id } = event || {}

  try {
    let query = db.collection('dishes')

    // 取单条
    if (id) {
      const res = await query.doc(id).get()
      const list = await withTempUrl([res.data])
      return { ok: true, data: list[0] || null, categories: CATEGORIES }
    }

    // 按分类过滤
    if (category) {
      query = query.where({ category })
    }

    // 全量（个人使用量级，limit 100 足够）
    const res = await query.limit(100).get()

    const list = await withTempUrl(res.data)

    return { ok: true, data: list, categories: CATEGORIES }
  } catch (err) {
    console.error('getDishes 失败', err)
    return { ok: false, msg: '读取菜品失败', data: [], categories: CATEGORIES }
  }
}

// 把菜品列表里的 imageFileID 转成临时可显示链接 imageUrl
async function withTempUrl(dishes) {
  const fileIDs = dishes
    .map(d => d.imageFileID)
    .filter(Boolean)

  if (fileIDs.length === 0) {
    // 没有图片，直接补空字段
    return dishes.map(d => ({ ...d, imageUrl: '' }))
  }

  try {
    const res = await cloud.getTempFileURL({ fileList: fileIDs })
    const map = {}
    res.fileList.forEach(f => {
      if (f.tempFileURL) map[f.fileID] = f.tempFileURL
    })
    return dishes.map(d => ({
      ...d,
      imageUrl: d.imageFileID ? (map[d.imageFileID] || '') : ''
    }))
  } catch (e) {
    console.warn('转临时链接失败', e)
    return dishes.map(d => ({ ...d, imageUrl: '' }))
  }
}
