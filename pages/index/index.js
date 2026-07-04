// pages/index/index.js
const cart = require('../../utils/cart.js')
const app = getApp()

const DEFAULT_CATEGORIES = ['荤菜', '素菜', '汤品', '主食', '饮品']

Page({
  data: {
    avatarUrl: '',          // 顶部头像，留空显示占位
    categories: DEFAULT_CATEGORIES,
    currentCategory: DEFAULT_CATEGORIES[0],
    dishList: [],
    menuCount: 0,
    loading: true           // 首次加载状态
  },

  onShow() {
    // 每次回到首页都刷新：菜品可能被新增/编辑过
    this.loadDishes()
    this.refreshMenuStatus()
  },

  // 拉取全部菜品（缓存到 globalData 供详情页复用）
  loadDishes(callback) {
    const app = getApp()
    wx.cloud.callFunction({
      name: 'getDishes',
      success: res => {
        const result = res.result || {}
        const all = result.data || []
        // 缓存全量
        app.globalData.dishesCache = all
        if (result.categories && result.categories.length) {
          this.setData({ categories: result.categories })
        }
        this.filterDishes()
        this.setData({ loading: false })
      },
      fail: err => {
        console.error('getDishes 失败', err)
        this.setData({ loading: false })
        wx.showToast({ title: '菜品加载失败', icon: 'none' })
      },
      complete: () => {
        callback && callback()
      }
    })
  },

  // 根据当前分类筛选菜品 + 标记「已加入菜单」
  filterDishes() {
    const app = getApp()
    const all = app.globalData.dishesCache || []
    const list = all
      .filter(d => d.category === this.data.currentCategory)
      .map(d => ({
        ...d,
        added: cart.isInMenu(d._id)
      }))
    this.setData({ dishList: list })
  },

  // 刷新菜单数量 + 已加入状态
  refreshMenuStatus() {
    this.setData({ menuCount: cart.getCount() })
    if (app.globalData.dishesCache) {
      this.filterDishes()
    }
  },

  // 切换分类
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    if (category === this.data.currentCategory) return
    this.setData({ currentCategory: category })
    this.filterDishes()
  },

  // 点击菜品 -> 跳转详情页（传云数据库 _id）
  onDishTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + id
    })
  },

  // 加入 / 取消 菜单
  onAddTap(e) {
    const { id, name } = e.currentTarget.dataset
    if (cart.isInMenu(id)) {
      cart.removeDish(id)
      wx.showToast({ title: '已移出菜单', icon: 'none' })
    } else {
      cart.addDish({ id, name })
      wx.showToast({ title: '已加入菜单', icon: 'success' })
    }
    this.filterDishes()
    this.setData({ menuCount: cart.getCount() })
  },

  // 进入我的订单页
  onCartTap() {
    wx.navigateTo({ url: '/pages/order/order' })
  }
})
