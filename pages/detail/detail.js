// pages/detail/detail.js
const cart = require('../../utils/cart.js')
const app = getApp()

Page({
  data: {
    dish: {},
    added: false
  },

  onLoad(options) {
    const id = options.id
    const dish = this.findDishFromCache(id)

    if (dish) {
      this.setData({ dish })
      wx.setNavigationBarTitle({ title: dish.name })
      this.refreshAdded()
    } else {
      // 缓存没有（比如直接进详情页），调云函数取单条
      this.loadDishFromCloud(id)
    }
  },

  onShow() {
    this.refreshAdded()
  },

  // 从首页缓存里找菜品
  findDishFromCache(id) {
    const cache = app.globalData.dishesCache || []
    return cache.find(d => d._id === id)
  },

  // 缓存未命中时，从云函数取单条
  loadDishFromCloud(id) {
    wx.showLoading({ title: '加载中…' })
    wx.cloud.callFunction({
      name: 'getDishes',
      data: { id },
      success: res => {
        const dish = res.result && res.result.data
        if (dish) {
          this.setData({ dish })
          wx.setNavigationBarTitle({ title: dish.name })
          this.refreshAdded()
        } else {
          wx.showToast({ title: '菜品不存在', icon: 'none' })
        }
      },
      fail: err => {
        console.error('取菜品详情失败', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
      },
      complete: () => wx.hideLoading()
    })
  },

  refreshAdded() {
    this.setData({ added: cart.isInMenu(this.data.dish._id) })
  },

  onAddTap() {
    const dish = this.data.dish
    if (cart.isInMenu(dish._id)) {
      cart.removeDish(dish._id)
      wx.showToast({ title: '已移出菜单', icon: 'none' })
    } else {
      cart.addDish({ id: dish._id, name: dish.name })
      wx.showToast({ title: '已加入菜单', icon: 'success' })
    }
    this.refreshAdded()
  }
})
