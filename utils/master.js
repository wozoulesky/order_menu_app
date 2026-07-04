// utils/master.js
// 主人权限判断（前端体验层拦截，真正校验在云函数 saveDish 里）
//
// openid 和 isMaster 在 getOrders 调用后由 order.js 写入缓存。
// 添加菜品页 onLoad 时调 isMaster() 做前端拦截，非主人直接提示并返回。

const STORAGE_KEY = 'my_master_info'

// 保存主人信息 { openid, isMaster }
function saveMasterInfo(info) {
  try {
    wx.setStorageSync(STORAGE_KEY, info)
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.userInfo = app.globalData.userInfo || {}
      app.globalData.userInfo.openid = info.openid
      app.globalData.userInfo.isMaster = info.isMaster
    }
  } catch (e) {
    console.warn('保存主人信息失败', e)
  }
}

function getMasterInfo() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || { openid: '', isMaster: false }
  } catch (e) {
    return { openid: '', isMaster: false }
  }
}

function isMaster() {
  return getMasterInfo().isMaster === true
}

function getOpenid() {
  return getMasterInfo().openid
}

module.exports = {
  saveMasterInfo,
  getMasterInfo,
  isMaster,
  getOpenid
}
