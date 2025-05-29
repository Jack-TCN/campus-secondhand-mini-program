// packageA/pages/publish/publish.js
Page({
  data: {
    price: '',
    originalPrice: '',
    title: '',
    describe: '',
    detailPics: [],
    categoryIndex: -1,
    categoryArray: ['书籍教材', '电子产品', '生活用品', '体育用品', '服装鞋包', '其他'],
    conditionIndex: -1,
    conditionArray: ['全新', '九成新', '八成新', '七成新及以下'],
    wechatContact: ''
  },

  onLoad() {
    // 页面加载时的初始化
  },

  // 选择分类
  bindCategoryChange(e) {
    this.setData({
      categoryIndex: e.detail.value
    })
  },

  // 选择新旧程度
  bindConditionChange(e) {
    this.setData({
      conditionIndex: e.detail.value
    })
  },

  // 选择图片
  chooseImage() {
    const that = this;
    wx.chooseImage({
      count: 9 - this.data.detailPics.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        that.setData({
          detailPics: that.data.detailPics.concat(tempFilePaths)
        });
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const detailPics = this.data.detailPics;
    detailPics.splice(index, 1);
    this.setData({
      detailPics: detailPics
    });
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.src;
    wx.previewImage({
      current: current,
      urls: this.data.detailPics
    });
  },

  // 输入价格
  inputPrice(e) {
    this.setData({
      price: e.detail.value
    });
  },

  // 输入原价
  inputOriginalPrice(e) {
    this.setData({
      originalPrice: e.detail.value
    });
  },

  // 输入标题
  inputTitle(e) {
    this.setData({
      title: e.detail.value
    });
  },

  // 输入描述
  inputDescribe(e) {
    this.setData({
      describe: e.detail.value
    });
  },

  // 输入微信号
  inputWechat(e) {
    this.setData({
      wechatContact: e.detail.value
    });
  },

  // 发布商品
  publishGoods() {
    const that = this;
    
    // 表单验证
    if (!this.data.title) {
      wx.showToast({
        title: '请输入商品标题',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.categoryIndex === -1) {
      wx.showToast({
        title: '请选择商品分类',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.conditionIndex === -1) {
      wx.showToast({
        title: '请选择新旧程度',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.price) {
      wx.showToast({
        title: '请输入商品价格',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.detailPics.length === 0) {
      wx.showToast({
        title: '请至少上传一张图片',
        icon: 'none'
      });
      return;
    }

    // 显示加载中
    wx.showLoading({
      title: '发布中...'
    });

    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.hideLoading();
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success(res) {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }

    // 上传图片
    const uploadPromises = this.data.detailPics.map((tempFilePath) => {
      return new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath: `goods/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
          filePath: tempFilePath,
          success: res => {
            resolve(res.fileID);
          },
          fail: err => {
            reject(err);
          }
        });
      });
    });

    Promise.all(uploadPromises).then((fileIDs) => {
      // 添加商品数据到数据库
      const db = wx.cloud.database();
      db.collection('goods').add({
        data: {
          title: this.data.title,
          price: parseFloat(this.data.price),
          originalPrice: this.data.originalPrice ? parseFloat(this.data.originalPrice) : 0,
          category: this.data.categoryArray[this.data.categoryIndex],
          condition: this.data.conditionArray[this.data.conditionIndex],
          describe: this.data.describe,
          images: fileIDs,
          wechatContact: this.data.wechatContact,
          publisherId: userInfo.openid,
          publisherName: userInfo.nickName,
          publisherAvatar: userInfo.avatarUrl,
          status: 'available', // available, sold, removed
          viewCount: 0,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        },
        success(res) {
          wx.hideLoading();
          wx.showToast({
            title: '发布成功',
            icon: 'success',
            duration: 2000,
            success() {
              setTimeout(() => {
                wx.navigateBack();
              }, 2000);
            }
          });
        },
        fail(err) {
          wx.hideLoading();
          console.error('发布失败：', err);
          wx.showToast({
            title: '发布失败，请重试',
            icon: 'none'
          });
        }
      });
    }).catch((err) => {
      wx.hideLoading();
      console.error('图片上传失败：', err);
      wx.showToast({
        title: '图片上传失败',
        icon: 'none'
      });
    });
  }
});
