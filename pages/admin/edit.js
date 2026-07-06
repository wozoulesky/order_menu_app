// pages/admin/edit.js
const master = require('../../utils/master.js')

const CATEGORIES = ['荤菜', '素菜', '汤品', '主食', '饮品']

Page({
  data: {
    allowed: false,        // 是否有权限进入
    isEdit: false,         // 编辑模式（true=改菜，false=加菜）
    categories: CATEGORIES,
    categoryIndex: 0,
    form: {
      _id: '',             // 编辑模式时有值
      name: '',
      ingredients: [{ name: '', amount: '' }],
      seasonings: [{ name: '', amount: '' }],
      steps: ['']
    },
    // 图片
    imageUrl: '',          // 预览路径（编辑模式初始为云存储临时链接）
    imageFileID: '',       // 上传后的云存储 fileID
    saving: false
  },

  onLoad(options) {
    // 前端权限拦截（真正校验在云函数 saveDish）
    if (!master.isMaster()) {
      this.setData({ allowed: false })
      return
    }
    this.setData({ allowed: true })

    // 编辑模式：有 id 参数 = 改菜
    if (options && options.id) {
      this.setData({ isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑菜品' })
      this.loadDish(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '添加菜品' })
    }
  },

  // 编辑模式：加载已有菜品数据回填表单
  loadDish(id) {
    wx.showLoading({ title: '加载中…' })
    wx.cloud.callFunction({
      name: 'getDishes',
      data: { id },
      success: res => {
        const d = res.result && res.result.data
        if (!d) {
          wx.showToast({ title: '菜品不存在', icon: 'none' })
          return
        }
        // 回填表单，保证食材/调料/步骤至少一行
        const ingredients = (d.ingredients && d.ingredients.length) ? d.ingredients : [{ name: '', amount: '' }]
        const seasonings = (d.seasonings && d.seasonings.length) ? d.seasonings : [{ name: '', amount: '' }]
        const steps = (d.steps && d.steps.length) ? d.steps : ['']
        const categoryIndex = Math.max(0, CATEGORIES.indexOf(d.category))

        this.setData({
          'form._id': d._id,
          'form.name': d.name || '',
          'form.ingredients': ingredients,
          'form.seasonings': seasonings,
          'form.steps': steps,
          categoryIndex,
          imageUrl: d.imageUrl || '',
          imageFileID: d.imageFileID || ''
        })
      },
      fail: err => {
        console.error('加载菜品失败', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
      },
      complete: () => wx.hideLoading()
    })
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
    wx.showLoading({ title: '上传检测中…', mask: true })
    // 云存储路径：dishes/时间戳-随机数.后缀
    const ext = filePath.substring(filePath.lastIndexOf('.') + 1) || 'jpg'
    const cloudPath = `dishes/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: upRes => {
        const fileID = upRes.fileID
        // 内容安全检测（UGC 合规）
        wx.cloud.callFunction({
          name: 'checkImage',
          data: { fileID },
          success: checkRes => {
            wx.hideLoading()
            const r = checkRes.result || {}
            if (r.safe) {
              this.setData({ imageFileID: fileID, imageUrl: filePath })
              wx.showToast({ title: '图片已上传', icon: 'success' })
            } else {
              // 不合规，删除已上传的图
              wx.cloud.deleteFile({ fileList: [fileID] })
              wx.showModal({
                title: '图片不合规',
                content: r.msg || '图片含违规内容，请更换',
                showCancel: false
              })
            }
          },
          fail: () => {
            // 检测服务异常时放行（与登录页策略一致）
            wx.hideLoading()
            this.setData({ imageFileID: fileID, imageUrl: filePath })
            wx.showToast({ title: '图片已上传', icon: 'success' })
          }
        })
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
    // 编辑模式带 _id，saveDish 走更新分支
    if (this.data.isEdit && this.data.form._id) {
      dish._id = this.data.form._id
    }

    this.setData({ saving: true })
    wx.cloud.callFunction({
      name: 'saveDish',
      data: { dish },
      success: res => {
        const result = res.result || {}
        if (result.ok) {
          wx.showToast({ title: '保存成功', icon: 'success' })
          // 清空菜品缓存，让首页/详情页重新拉取
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
