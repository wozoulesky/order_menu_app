// pages/login/login.js
const login = require('../../utils/login.js')
const master = require('../../utils/master.js')

Page({
  data: {
    tempAvatar: '',
    tempNick: '',
    entering: false
  },

  onLoad() {
    // 已登录则直接跳首页，不显示登录表单
    if (login.isLoggedIn()) {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  // 微信一键登录：chooseAvatar 回调，拿到微信头像
  // 注意：开发者工具上点取消会触发 fail 日志，真机正常，这里只看 avatarUrl 是否有值
  onChooseWxAvatar(e) {
    if (e.detail && e.detail.avatarUrl) {
      this.setData({ tempAvatar: e.detail.avatarUrl })
      // 昵称留给用户在输入框点一下用「使用微信昵称」带出，或手动填
    }
    // 取消时 avatarUrl 为空，不报错
  },

  // 相册选图（次要入口）
  onChooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.setData({ tempAvatar: res.tempFiles[0].tempFilePath })
      },
      fail: () => {}
    })
  },

  onNickInput(e) {
    this.setData({ tempNick: e.detail.value })
  },

  // 进入小程序
  onEnter() {
    if (this.data.entering) return
    const nick = (this.data.tempNick || '').trim()
    if (!nick) {
      wx.showToast({ title: '请确认昵称', icon: 'none' })
      return
    }

    this.setData({ entering: true })

    // 1. 保存身份信息
    const info = {
      nickName: nick,
      avatarUrl: this.data.tempAvatar || ''
    }
    login.saveUserInfo(info)

    // 2. 调云函数拿 openid + 主人身份
    wx.cloud.callFunction({
      name: 'getOrders',
      success: res => {
        const result = res.result || {}
        if (result.openid) {
          master.saveMasterInfo({
            openid: result.openid,
            isMaster: !!result.isMaster
          })
        }
        this.enterHome()
      },
      fail: err => {
        console.warn('获取身份失败，但仍进入首页', err)
        this.enterHome()
      },
      complete: () => {
        this.setData({ entering: false })
      }
    })
  },

  enterHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
