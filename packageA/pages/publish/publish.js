// packageA/pages/publish/publish.js
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
    categoryColumns: ['教材书籍', '电子数码', '生活用品', '服饰鞋包', '体育用品', '其他物品'],
    conditionColumns: ['全新', '99成新', '95成新', '9成新', '8成新', '其他'],
    categoryMap: {
      '教材书籍': 'books',
      '电子数码': 'digital',
      '生活用品': 'life',
      '服饰鞋包': 'clothes',
      '体育用品': 'sports',
      '其他物品': 'other'
    },
    conditionMap: {
      '全新': 'new',
      '99成新': '99new',
      '95成新': '95new',
      '9成新': '90new',
      '8成新': '80new',
      '其他': 'other'
    },
    descLength: 0,
    isEdit: false,
    productId: ''
  },

  onLoad(options) {
    // 检查登录状态
    const openid = wx.getStorageSync('openid');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!openid || !userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布商品',
        showCancel: false,
        confirmText: '去登录',
        success: () => {
          wx.switchTab({ 
            url: '/pages/mine/mine',
            fail: () => {
              wx.navigateBack();
            }
          });
        }
      });
      return;
    }
    
    if (options.id && options.edit) {
      this.setData({ isEdit: true, productId: options.id });
      this.loadProduct(options.id);
    }
  },

  async loadProduct(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await db.collection('products').doc(id).get();
      const product = res.data;
      
      let categoryText = '请选择分类';
      let conditionText = '请选择新旧程度';
      
      for (let key in this.data.categoryMap) {
        if (this.data.categoryMap[key] === product.category) {
          categoryText = key;
          break;
        }
      }
      
      for (let key in this.data.conditionMap) {
        if (this.data.conditionMap[key] === product.condition) {
          conditionText = key;
          break;
        }
      }
      
      this.setData({
        form: {
          title: product.title,
          price: product.price.toString(),
          originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
          desc: product.desc,
          category: product.category,
          condition: product.condition,
          images: product.images || [],
          contactType: 'wechat',
          contactValue: product.contact ? product.contact.value : ''
        },
        categoryText,
        conditionText,
        descLength: product.desc.length
      });
      
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
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

  onDescInput(e) {
    const value = e.detail;
    if (value.length > 200) {
      wx.showToast({ title: '描述不能超过200字', icon: 'none' });
      this.setData({
        'form.desc': value.substring(0, 200),
        descLength: 200
      });
    } else {
      this.setData({
        'form.desc': value,
        descLength: value.length
      });
    }
  },

  showCategoryPicker() {
    this.setData({ showCategory: true });
  },

  showConditionPicker() {
    this.setData({ showCondition: true });
  },

  onCategoryConfirm(e) {
    const text = e.detail.value;
    const value = this.data.categoryMap[text];
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
    const text = e.detail.value;
    const value = this.data.conditionMap[text];
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
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: res => {
        const tempFiles = res.tempFiles;
        
        const validFiles = tempFiles.filter(file => {
          if (file.size > 200 * 1024) {
            wx.showToast({ title: '图片不能超过200KB', icon: 'none' });
            return false;
          }
          return true;
        });
        
        if (validFiles.length > 0) {
          this.uploadImages(validFiles.map(file => file.tempFilePath));
        }
      }
    });
  },

  uploadImages(filePaths) {
    wx.showLoading({ title: '上传中...' });
    const uploadTasks = filePaths.map(filePath => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      return wx.cloud.uploadFile({
        cloudPath: `products/${timestamp}_${random}.jpg`,
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
        wx.showToast({ title: '上传成功' });
      })
      .catch(err => {
        console.error(err);
        wx.hideLoading();
        wx.showToast({ title: '上传失败', icon: 'none' });
      });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '提示',
      content: '确定要删除这张图片吗？',
      success: res => {
        if (res.confirm) {
          const images = [...this.data.form.images];
          images.splice(index, 1);
          this.setData({ 'form.images': images });
        }
      }
    });
  },

  async submit() {
    const { form } = this.data;
    
    // 表单验证
    if (!form.title) {
      return wx.showToast({ title: '请输入商品标题', icon: 'none' });
    }
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) {
      return wx.showToast({ title: '请输入正确的价格', icon: 'none' });
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
    // 微信号改为可选
    // if (!form.contactValue) {
    //   return wx.showToast({ title: '请输入微信号', icon: 'none' });
    // }
    if (form.images.length === 0) {
      return wx.showToast({ title: '请至少上传一张图片', icon: 'none' });
    }

    wx.showLoading({ title: this.data.isEdit ? '保存中...' : '发布中...' });

    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const openid = wx.getStorageSync('openid') || '';
      
      const productData = {
        title: form.title,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        desc: form.desc,
        category: form.category,
        condition: form.condition,
        images: form.images,
        contact: {
          type: 'wechat',
          value: form.contactValue || '未提供'
        },
        userId: openid,
        userInfo: {
          nickName: userInfo.nickName || '匿名用户',
          avatarUrl: userInfo.avatarUrl || app.globalData.defaultImages.avatar,
          school: userInfo.school || '未知学校'
        },
        status: 'on_sale',
        viewCount: this.data.isEdit ? undefined : 0,
        likeCount: this.data.isEdit ? undefined : 0,
        updateTime: db.serverDate()
      };

      if (!this.data.isEdit) {
        productData.createTime = db.serverDate();
        await db.collection('products').add({ data: productData });
      } else {
        delete productData.viewCount;
        delete productData.likeCount;
        await db.collection('products').doc(this.data.productId).update({ data: productData });
      }

      wx.hideLoading();
      wx.showToast({ title: this.data.isEdit ? '保存成功' : '发布成功' });
      
      setTimeout(() => {
        if (this.data.isEdit) {
          wx.navigateBack();
        } else {
          wx.switchTab({ 
            url: '/pages/index/index',
            success: () => {
              const pages = getCurrentPages();
              const indexPage = pages.find(p => p.route === 'pages/index/index');
              if (indexPage && indexPage.onPullDownRefresh) {
                setTimeout(() => {
                  indexPage.onPullDownRefresh();
                }, 100);
              }
            }
          });
        }
      }, 1500);
      
    } catch (err) {
      console.error('发布/保存失败：', err);
      wx.hideLoading();
      wx.showToast({ 
        title: this.data.isEdit ? '保存失败' : '发布失败', 
        icon: 'none' 
      });
    }
  }
});
