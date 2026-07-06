// pages/detail/detail.js
const cart = require('../../utils/cart.js')
const master = require('../../utils/master.js')
const app = getApp()

Page({
  data: {
    dish: {},
    added: false,
    isMaster: false,
    dishId: ''
  },

  onLoad(options) {
    const id = options.id
    this.setData({ dishId: id, isMaster: master.isMaster() })
    this.loadDish(id)
  },

  onShow() {
    this.refreshAdded()
    // 编辑返回后缓存被清了，重新拉取以显示更新后的内容
    if (!app.globalData.dishesCache && this.data.dishId) {
      this.loadDish(this.data.dishId)
    }
  },

  // 优先从缓存取，缓存没有则调云函数
  loadDish(id) {
    const dish = this.findDishFromCache(id)
    if (dish) {
      this.applyDish(dish)
    } else {
      this.loadDishFromCloud(id)
    }
  },

  applyDish(dish) {
    this.setData({ dish })
    wx.setNavigationBarTitle({ title: dish.name })
    this.refreshAdded()
  },

  findDishFromCache(id) {
    const cache = app.globalData.dishesCache || []
    return cache.find(d => d._id === id)
  },

  loadDishFromCloud(id) {
    wx.showLoading({ title: '加载中…' })
    wx.cloud.callFunction({
      name: 'getDishes',
      data: { id },
      success: res => {
        const dish = res.result && res.result.data
        if (dish) {
          this.applyDish(dish)
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
    if (this.data.dish && this.data.dish._id) {
      this.setData({ added: cart.isInMenu(this.data.dish._id) })
    }
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
  },

  // 主人：跳转编辑页
  onEditTap() {
    wx.navigateTo({
      url: '/pages/admin/edit?id=' + this.data.dishId
    })
  },

  // 转发给朋友（带菜品 id，点开直达这道菜）
  onShareAppMessage() {
    const dish = this.data.dish
    return {
      title: dish.name ? `做饭这件小事 · ${dish.name}` : '做饭这件小事',
      path: '/pages/detail/detail?id=' + this.data.dishId
    }
  }
})
