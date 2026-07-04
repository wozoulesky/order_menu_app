// pages/order/order.js
const cart = require('../../utils/cart.js')
const login = require('../../utils/login.js')
const master = require('../../utils/master.js')

Page({
  data: {
    // 身份
    userInfo: { nickName: '', avatarUrl: '' },
    tempAvatar: '',
    tempNick: '',
    isMaster: false,

    // 本次菜单
    menu: [],

    // 历史订单
    orders: [],
    loadingOrders: false
  },

  onShow() {
    this.setData({
      userInfo: login.getUserInfo() || { nickName: '', avatarUrl: '' },
      menu: cart.getMenu()
    })
    // 已登录则拉取订单
    if (login.isLoggedIn()) {
      this.loadOrders()
    }
  },

  // ===== 身份填写 =====
  onChooseAvatar() {
    // 从相册/拍照选图作为头像（可选，取消不报错）
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const avatarUrl = res.tempFiles[0].tempFilePath
        this.setData({ tempAvatar: avatarUrl })
      },
      fail: () => {
        // 用户取消，不报错
      }
    })
  },

  onNickInput(e) {
    this.setData({ tempNick: e.detail.value })
  },

  onSaveProfile() {
    const nick = (this.data.tempNick || '').trim()
    if (!nick) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }
    const info = {
      nickName: nick,
      avatarUrl: this.data.tempAvatar || ''
    }
    login.saveUserInfo(info)
    this.setData({ userInfo: info, tempAvatar: '', tempNick: '' })
    wx.showToast({ title: '已保存', icon: 'success' })
    this.loadOrders()
  },

  onLogout() {
    // 重新填写
    this.setData({
      tempNick: this.data.userInfo.nickName || '',
      tempAvatar: this.data.userInfo.avatarUrl || ''
    })
    login.clearUserInfo()
    this.setData({ userInfo: { nickName: '', avatarUrl: '' }, orders: [], isMaster: false })
  },

  // ===== 本次菜单 =====
  onRemoveDish(e) {
    const id = e.currentTarget.dataset.id
    cart.removeDish(id)
    this.setData({ menu: cart.getMenu() })
  },

  // ===== 提交订单 =====
  onSubmit() {
    if (!login.isLoggedIn()) {
      wx.showToast({ title: '请先填写昵称并点保存', icon: 'none' })
      return
    }
    if (this.data.menu.length === 0) {
      wx.showToast({ title: '菜单是空的', icon: 'none' })
      return
    }

    const payload = {
      dishes: this.data.menu,
      nickname: this.data.userInfo.nickName,
      avatarUrl: this.data.userInfo.avatarUrl
    }
    // 打印实际传参，便于在控制台排查
    console.log('[submitOrder] 传参:', payload)

    wx.showLoading({ title: '提交中…', mask: true })
    wx.cloud.callFunction({
      name: 'submitOrder',
      data: payload,
      success: res => {
        wx.hideLoading()
        console.log('[submitOrder] 云函数返回:', res.result)
        if (res.result && res.result.ok) {
          wx.showToast({ title: '下单成功！', icon: 'success' })
          cart.clearMenu()
          this.setData({ menu: [] })
          this.loadOrders()
        } else {
          wx.showModal({
            title: '提交失败',
            content: (res.result && res.result.msg) || '请重试',
            showCancel: false
          })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error(err)
        wx.showModal({
          title: '提交失败',
          content: '网络或云函数异常，请检查云开发是否已开通并部署',
          showCancel: false
        })
      }
    })
  },

  // ===== 拉取历史订单 =====
  loadOrders() {
    this.setData({ loadingOrders: true })
    wx.cloud.callFunction({
      name: 'getOrders',
      success: res => {
        const result = res.result || {}
        const list = (result.data || []).map(o => ({
          ...o,
          timeText: this.formatTime(o.createTime)
        }))
        this.setData({
          orders: list,
          isMaster: !!result.isMaster,
          loadingOrders: false
        })
        // 缓存主人信息，供添加菜品页校验
        if (result.openid) {
          master.saveMasterInfo({
            openid: result.openid,
            isMaster: !!result.isMaster
          })
        }
      },
      fail: err => {
        console.error(err)
        this.setData({ loadingOrders: false })
        wx.showToast({ title: '订单加载失败', icon: 'none' })
      }
    })
  },

  // ===== 跳转添加菜品页（仅主人）=====
  onAddDishTap() {
    if (!master.isMaster()) {
      wx.showToast({ title: '仅主人可添加菜品', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/admin/edit' })
  },

  // 时间格式化：兼容云数据库 serverDate 返回的 Date 对象 / 时间戳
  formatTime(t) {
    if (!t) return ''
    let d
    if (typeof t === 'object' && t instanceof Date) d = t
    else if (typeof t === 'number') d = new Date(t)
    else if (typeof t === 'string') d = new Date(t)
    else if (t && typeof t === 'object' && typeof t.getTime === 'function') d = t
    else return ''
    if (isNaN(d.getTime())) return ''
    const pad = n => (n < 10 ? '0' + n : '' + n)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
})
