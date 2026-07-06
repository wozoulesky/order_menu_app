// pages/login/login.js
const login = require('../../utils/login.js')
const master = require('../../utils/master.js')

Page({
  data: {
    tempAvatar: '',        // 本地预览路径
    avatarFileID: '',      // 上传到云存储后的 fileID（已过安全检测）
    tempNick: '',
    entering: false,
    checkingAvatar: false  // 头像检测中
  },

  onLoad() {
    // 已登录则直接跳订单页（登录是从订单页入口进来的）
    if (login.isLoggedIn()) {
      wx.redirectTo({ url: '/pages/order/order' })
    }
  },

  // 微信一键登录：chooseAvatar 回调，拿到微信头像临时路径
  onChooseWxAvatar(e) {
    if (e.detail && e.detail.avatarUrl) {
      this.uploadAndCheck(e.detail.avatarUrl)
    }
  },

  // 相册选图（次要入口）
  onChooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.uploadAndCheck(res.tempFiles[0].tempFilePath)
      },
      fail: () => {}
    })
  },

  // 上传头像到云存储 + 内容安全检测
  uploadAndCheck(filePath) {
    this.setData({ checkingAvatar: true })
    const cloudPath = `avatars/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: upRes => {
        const fileID = upRes.fileID
        // 调云函数做内容安全检测
        wx.cloud.callFunction({
          name: 'checkImage',
          data: { fileID },
          success: checkRes => {
            const r = checkRes.result || {}
            if (r.safe) {
              // 安全，采用
              this.setData({
                tempAvatar: filePath,
                avatarFileID: fileID,
                checkingAvatar: false
              })
            } else {
              // 违规，拒绝并删除已上传的图
              wx.cloud.deleteFile({ fileList: [fileID] })
              this.setData({ checkingAvatar: false })
              wx.showModal({
                title: '头像不合规',
                content: r.msg || '图片含违规内容，请更换',
                showCancel: false
              })
            }
          },
          fail: err => {
            console.warn('检测服务异常，已放行', err)
            // 检测服务异常时放行（与云函数保守策略一致）
            this.setData({
              tempAvatar: filePath,
              avatarFileID: fileID,
              checkingAvatar: false
            })
          }
        })
      },
      fail: err => {
        console.error('头像上传失败', err)
        this.setData({ checkingAvatar: false })
        wx.showToast({ title: '头像上传失败', icon: 'none' })
      }
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

    // 保存身份信息（头像用云存储 fileID，可跨设备访问）
    const info = {
      nickName: nick,
      avatarUrl: this.data.avatarFileID || ''  // 用 fileID 而非临时路径
    }
    login.saveUserInfo(info)

    // 调云函数拿 openid + 主人身份
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
        console.warn('获取身份失败，但仍进入', err)
        this.enterHome()
      },
      complete: () => {
        this.setData({ entering: false })
      }
    })
  },

  // 跳过登录，先逛逛（审核要求：提供取消/拒绝登录的出口）
  onSkip() {
    wx.reLaunch({ url: '/pages/index/index' })
  },

  enterHome() {
    wx.redirectTo({ url: '/pages/order/order' })
  }
})
