// pages/publish/publish.js
const db = wx.cloud.database();
const app = getApp();

Page({
  data: {
    form: {
      title: '',
      price: '',
      originalPrice: '',
      desc: '',
      category: '',
      condition: '',
      images: [],
      contactType: 'wechat',
      contactValue: ''
    },
    categoryText: '请选择分类',
    conditionText: '请选择新旧程度',
    showCategory: false,
    showCondition: false,
    categoryColumns: [
      { text: '教材书籍', value: 'books' },
      { text: '电子数码', value: 'digital' },
      { text: '生活用品', value: 'life' },
      { text: '服饰鞋包', value: 'clothes' },
      { text: '体育用品', value: 'sports' },
      { text: '其他物品', value: 'other' }
    ],
    conditionColumns: [
      { text: '全新', value: 'new' },
      { text: '99成新', value: '99new' },
      { text: '95成新', value: '95new' },
      { text: '9成新', value: '90new' },
      { text: '8成新', value: '80new' },
      { text: '其他', value: 'other' }
    ]
  },

  onBack() {
    wx.navigateBack();
  },

  onFieldChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: e.detail
    });
  },

  onContactTypeChange(e) {
    this.setData({
      'form.contactType': e.detail,
      'form.contactValue': '' // 切换时清空联系方式
    });
  },

  showCategoryPicker() {
    this.setData({ showCategory: true });
  },

  showConditionPicker() {
    this.setData({ showCondition: true });
  },

  onCategoryConfirm(e) {
    const { value, text } = e.detail.value;
    this.setData({
      'form.category': value,
      categoryText: text,
      showCategory: false
    });
  },

  onCategoryCancel() {
    this.setData({ showCategory: false });
  },

  onConditionConfirm(e) {
    const { value, text } = e.detail.value;
    this.setData({
      'form.condition': value,
      conditionText: text,
      showCondition: false
    });
  },

  onConditionCancel() {
    this.setData({ showCondition: false });
  },

  chooseImage() {
    const remainCount = 9 - this.data.form.images.length;
    wx.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePaths = res.tempFilePaths;
        this.uploadImages(tempFilePaths);
      }
    });
  },

  uploadImages(filePaths) {
    wx.showLoading({ title: '上传中...' });
    const uploadTasks = filePaths.map(filePath => {
      return wx.cloud.uploadFile({
        cloudPath: `products/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
        filePath
      });
    });

    Promise.all(uploadTasks)
      .then(results => {
        const newImages = results.map(res => res.fileID);
        this.setData({
          'form.images': [...this.data.form.images, ...newImages]
        });
        wx.hideLoading();
      })
      .catch(err => {
        console.error(err);
        wx.hideLoading();
        wx.showToast({ title: '上传失败', icon: 'none' });
      });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.form.images];
    images.splice(index, 1);
    this.setData({ 'form.images': images });
  },

  async submit() {
    const { form } = this.data;
    
    // 表单验证
    if (!form.title) {
      return wx.showToast({ title: '请输入商品标题', icon: 'none' });
    }
    if (!form.price) {
      return wx.showToast({ title: '请输入商品价格', icon: 'none' });
    }
    if (!form.category) {
      return wx.showToast({ title: '请选择商品分类', icon: 'none' });
    }
    if (!form.condition) {
      return wx.showToast({ title: '请选择新旧程度', icon: 'none' });
    }
    if (!form.desc) {
      return wx.showToast({ title: '请输入商品描述', icon: 'none' });
    }
    if (!form.contactValue) {
      return wx.showToast({ title: '请输入联系方式', icon: 'none' });
    }
    if (form.images.length === 0) {
      return wx.showToast({ title: '请至少上传一张图片', icon: 'none' });
    }

    wx.showLoading({ title: '发布中...' });

    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      await db.collection('products').add({
        data: {
          ...form,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          images: form.images,
          contact: {
            type: form.contactType,
            value: form.contactValue
          },
          userId: wx.getStorageSync('openid') || 'anonymous',
          userInfo: {
            nickName: userInfo.nickName || '匿名用户',
            avatarUrl: userInfo.avatarUrl || '/images/default-avatar.png'
          },
          status: 'on_sale',
          viewCount: 0,
          likeCount: 0,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '发布成功' });
      
      setTimeout(() => {
        wx.switchTab({ 
          url: '/pages/index/index',
          success: () => {
            // 通知首页刷新
            const pages = getCurrentPages();
            const indexPage = pages.find(p => p.route === 'pages/index/index');
            if (indexPage && indexPage.onPullDownRefresh) {
              indexPage.onPullDownRefresh();
            }
          }
        });
      }, 1500);
    } catch (err) {
      console.error(err);
      wx.hideLoading();
      wx.showToast({ title: '发布失败', icon: 'none' });
    }
  }
});