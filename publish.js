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
      condition: '95new',
      images: [],
      contactType: 'wechat',
      contactValue: ''
    },
    categories: app.globalData.categories,
    conditions: app.globalData.conditions,
    showCategoryPicker: false,
    showConditionPicker: false,
    uploading: false
  },

  onBack() {
    wx.navigateBack();
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail });
  },

  showPicker(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ [`show${type}Picker`]: true });
  },

  onPickerConfirm(e) {
    const { type, value } = e.currentTarget.dataset;
    if (type === 'Category') {
      const category = this.data.categories[value.index];
      this.setData({ 
        'form.category': category.id,
        showCategoryPicker: false 
      });
    } else if (type === 'Condition') {
      const condition = this.data.conditions[value.index];
      this.setData({ 
        'form.condition': condition.value,
        showConditionPicker: false 
      });
    }
  },

  onPickerCancel(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ [`show${type}Picker`]: false });
  },

  chooseImage() {
    const remainCount = 9 - this.data.form.images.length;
    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }

    wx.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.uploadImages(res.tempFilePaths);
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
    if (!form.title || !form.price || !form.desc || !form.category || !form.contactValue) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    if (form.images.length === 0) {
      wx.showToast({ title: '请至少上传一张图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...' });

    try {
      const userInfo = wx.getStorageSync('userInfo');
      await db.collection('products').add({
        data: {
          ...form,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          contact: {
            type: form.contactType,
            value: form.contactValue
          },
          userId: wx.getStorageSync('userId'),
          userInfo: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            school: userInfo.school || '未知学校'
          },
          status: 'on_sale',
          viewCount: 0,
          likeCount: 0,
          createTime: new Date(),
          updateTime: new Date()
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '发布成功' });
      
      // 返回首页并刷新
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (err) {
      console.error(err);
      wx.hideLoading();
      wx.showToast({ title: '发布失败', icon: 'none' });
    }
  }
});