// utils/login.js
// 登录与身份管理工具
//
// 说明（重要）：
// 微信已不再支持 wx.getUserProfile 返回真实头像昵称。
// 现在的推荐做法是「头像昵称填写能力」：
//   - 头像：用 <button open-type="chooseAvatar"> 让用户主动选
//   - 昵称：用 <input type="nickname"> 让用户主动填
// 这两者都在订单页 pages/order 里完成。
//
// 本工具只负责：
//   1. 缓存本地用户信息（昵称、头像）
//   2. 判断是否已填写
//   3. openid 由云函数自动获取，前端无需手动拿

const STORAGE_KEY = 'my_user_info'

// 读取本地缓存的用户信息
function getUserInfo() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || null
  } catch (e) {
    return null
  }
}

// 保存用户信息
function saveUserInfo(info) {
  // info: { nickName, avatarUrl }
  try {
    wx.setStorageSync(STORAGE_KEY, info)
    const app = getApp()
    if (app) app.globalData.userInfo = info
  } catch (e) {
    console.warn('保存用户信息失败', e)
  }
}

// 是否已填写昵称（下单前必须填写）
function isLoggedIn() {
  const info = getUserInfo()
  return !!(info && info.nickName)
}

// 清除登录信息
function clearUserInfo() {
  try {
    wx.removeStorageSync(STORAGE_KEY)
  } catch (e) {}
}

// 退出登录：清身份 + 清主人信息，跳回登录页
function logout() {
  clearUserInfo()
  try {
    wx.removeStorageSync('my_master_info')
  } catch (e) {}
  const app = getApp()
  if (app && app.globalData) {
    app.globalData.userInfo = null
  }
  wx.reLaunch({ url: '/pages/login/login' })
}

module.exports = {
  getUserInfo,
  saveUserInfo,
  isLoggedIn,
  clearUserInfo,
  logout
}
