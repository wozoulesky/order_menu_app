// app.js
App({
  onLaunch() {
    // 初始化云开发
    // env 填你的云环境 ID（开通云开发后在「云开发控制台」可见，见 README）
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d5gm8ix9c189893bf',   // TODO: 替换为你的云环境 ID
        traceUser: true
      })
    } else {
      console.warn('当前基础库不支持云开发，请更新微信开发者工具')
    }
  },
  globalData: {
    userInfo: null,   // { nickName, avatarUrl, openid, isMaster }
    dishesCache: null // 首页拉取的菜品全量缓存，详情页复用，避免重复请求
  }
})
