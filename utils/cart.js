// utils/cart.js
// 「菜单」管理：本次点餐已选菜品
// 阶段一决策：每道菜点/不点，不选份数。
// 所以菜单就是一个菜品 id 的集合，同一道菜不会重复。

const STORAGE_KEY = 'my_menu'

// 获取已选菜品列表 [{ id, name }]
function getMenu() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || []
  } catch (e) {
    return []
  }
}

// 某道菜是否已在菜单中
function isInMenu(id) {
  return getMenu().some(d => d.id === id)
}

// 加入菜单（已存在则不重复加），返回是否新增成功
function addDish(dish) {
  // dish: { id, name }
  const menu = getMenu()
  if (menu.some(d => d.id === dish.id)) return false
  menu.push({ id: dish.id, name: dish.name })
  saveMenu(menu)
  return true
}

// 从菜单移除
function removeDish(id) {
  const menu = getMenu().filter(d => d.id !== id)
  saveMenu(menu)
}

// 清空菜单（提交订单后调用）
function clearMenu() {
  saveMenu([])
}

// 已选数量
function getCount() {
  return getMenu().length
}

function saveMenu(menu) {
  try {
    wx.setStorageSync(STORAGE_KEY, menu)
  } catch (e) {
    console.warn('保存菜单失败', e)
  }
}

module.exports = {
  getMenu,
  isInMenu,
  addDish,
  removeDish,
  clearMenu,
  getCount
}
