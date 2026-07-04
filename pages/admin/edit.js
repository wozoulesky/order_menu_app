// pages/admin/edit.js
const master = require('../../utils/master.js')

const CATEGORIES = ['荤菜', '素菜', '汤品', '主食', '饮品']

Page({
  data: {
    allowed: false,        // 是否有权限进入
    categories: CATEGORIES,
    categoryIndex: 0,
    form: {
      name: '',
      ingredients: [{ name: '', amount: '' }],
      seasonings: [{ name: '', amount: '' }],
      steps: ['']
    },
    // 图片
    imageUrl: '',          // 本地预览路径
    imageFileID: '',       // 上传后的云存储 fileID
    saving: false
  },

  onLoad() {
    // 前端权限拦截（真正校验在云函数 saveDish）
    if (!master.isMaster()) {
      this.setData({ allowed: false })
      return
    }
    this.setData({ allowed: true })
  },

  // ===== 图片选择 + 上传云存储 =====
  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempPath = res.tempFiles[0].tempFilePath
        this.setData({ imageUrl: tempPath, imageFileID: '' })
        this.uploadImage(tempPath)
      }
    })
  },

  uploadImage(filePath) {
    wx.showLoading({ title: '上传图片…', mask: true })
    // 云存储路径：dishes/时间戳-随机数.后缀
    const ext = filePath.substring(filePath.lastIndexOf('.') + 1) || 'jpg'
    const cloudPath = `dishes/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: res => {
        this.setData({ imageFileID: res.fileID })
        wx.hideLoading()
        wx.showToast({ title: '图片上传成功', icon: 'success' })
      },
      fail: err => {
        wx.hideLoading()
        console.error('图片上传失败', err)
        wx.showToast({ title: '图片上传失败', icon: 'none' })
        this.setData({ imageUrl: '', imageFileID: '' })
      }
    })
  },

  // ===== 表单输入 =====
  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value })
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: parseInt(e.detail.value) })
  },

  // 食材/调料行输入
  onListItemInput(e) {
    const { type, index, field } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({
      [`form.${type}[${index}].${field}`]: value
    })
  },

  // 添加行
  onAddLine(e) {
    const type = e.currentTarget.dataset.type
    const list = this.data.form[type]
    list.push({ name: '', amount: '' })
    this.setData({ [`form.${type}`]: list })
  },

  // 删除行
  onRemoveLine(e) {
    const { type, index } = e.currentTarget.dataset
    const list = this.data.form[type]
    if (list.length <= 1) {
      // 至少留一行，清空内容即可
      list[index] = { name: '', amount: '' }
    } else {
      list.splice(index, 1)
    }
    this.setData({ [`form.${type}`]: list })
  },

  // 步骤输入
  onStepInput(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ [`form.steps[${index}]`]: e.detail.value })
  },

  onAddStep() {
    const steps = this.data.form.steps
    steps.push('')
    this.setData({ 'form.steps': steps })
  },

  onRemoveStep(e) {
    const index = e.currentTarget.dataset.index
    const steps = this.data.form.steps
    if (steps.length <= 1) {
      steps[index] = ''
    } else {
      steps.splice(index, 1)
    }
    this.setData({ 'form.steps': steps })
  },

  // ===== 保存 =====
  onSave() {
    const form = this.data.form
    const name = (form.name || '').trim()
    if (!name) {
      wx.showToast({ title: '请填菜品名称', icon: 'none' })
      return
    }

    // 清洗食材/调料（去掉全空行）
    const ingredients = form.ingredients
      .filter(it => (it.name || '').trim())
      .map(it => ({ name: it.name.trim(), amount: (it.amount || '').trim() }))
    const seasonings = form.seasonings
      .filter(it => (it.name || '').trim())
      .map(it => ({ name: it.name.trim(), amount: (it.amount || '').trim() }))
    const steps = form.steps.map(s => (s || '').trim()).filter(Boolean)

    const dish = {
      name,
      category: CATEGORIES[this.data.categoryIndex],
      imageFileID: this.data.imageFileID,
      ingredients,
      seasonings,
      steps
    }

    this.setData({ saving: true })
    wx.cloud.callFunction({
      name: 'saveDish',
      data: { dish },
      success: res => {
        const result = res.result || {}
        if (result.ok) {
          wx.showToast({ title: '保存成功', icon: 'success' })
          // 清空菜品缓存，让首页重新拉取
          const app = getApp()
          app.globalData.dishesCache = null
          setTimeout(() => wx.navigateBack(), 800)
        } else {
          wx.showModal({ title: '保存失败', content: result.msg || '请重试', showCancel: false })
        }
      },
      fail: err => {
        console.error(err)
        wx.showModal({ title: '保存失败', content: '云函数调用失败，请检查 saveDish 是否已部署', showCancel: false })
      },
      complete: () => {
        this.setData({ saving: false })
      }
    })
  }
})
