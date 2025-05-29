// pages/detail/detail.js
const db = wx.cloud.database();
const app = getApp();

Page({
  data: {
    productId: '',
    product: null,
    loading: true,
    isFavorite: false,
    currentImageIndex: 0,
    conditionText: '',
    categoryText: '',
    createTimeStr: ''
  },

  onLoad(options) {
    this.setData({ productId: options.id });
    this.loadProduct();
    this.checkFavorite();
  },

  onBack() {
    wx.navigateBack();
  },

  async loadProduct() {
    try {
      const res = await db.collection('products')
        .doc(this.data.productId)
        .get();
      
      const product = res.data;
      
      // 获取分类和新旧程度的中文名称
      const categoryMap = {
        'books': '教材书籍',
        'digital': '电子数码',
        'life': '生活用品',
        'clothes': '服饰鞋包',
        'sports': '体育用品',
        'other': '其他物品'
      };
      
      const conditionMap = {
        'new': '全新',
        '99new': '99成新',
        '95new': '95成新',
        '90new': '9成新',
        '80new': '8成新',
        'other': '其他'
      };
      
      this.setData({
        product,
        categoryText: categoryMap[product.category] || product.category,
        conditionText: conditionMap[product.condition] || product.condition,
        createTimeStr: this.formatTime(product.createTime),
        loading: false
      });
      
      // 增加浏览量
      this.increaseViewCount();
      
      // 保存浏览历史
      this.saveViewHistory();
      
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 在loadProduct成功后添加
saveViewHistory() {
  const history = wx.getStorageSync('viewHistory') || [];
  const now = new Date();
  
  // 移除相同商品的旧记录
  const newHistory = history.filter(h => h.productId !== this.data.productId);
  
  // 添加新记录到开头
  newHistory.unshift({
    productId: this.data.productId,
    viewTime: now
  });
  
  // 只保留最近30天的记录
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const filteredHistory = newHistory.filter(h => new Date(h.viewTime) > thirtyDaysAgo);
  
  // 最多保留100条
  if (filteredHistory.length > 100) {
    filteredHistory.length = 100;
  }
  
  wx.setStorageSync('viewHistory', filteredHistory);
},

  // 轮播图切换事件
  onSwiperChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    });
  },

  formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  },

  increaseViewCount() {
    db.collection('products')
      .doc(this.data.productId)
      .update({
        data: {
          viewCount: db.command.inc(1)
        }
      });
  },

  saveViewHistory() {
    const history = wx.getStorageSync('viewHistory') || [];
    const now = new Date();
    
    // 移除相同商品的旧记录
    const newHistory = history.filter(h => h.productId !== this.data.productId);
    
    // 添加新记录到开头
    newHistory.unshift({
      productId: this.data.productId,
      viewTime: now
    });
    
    // 只保留最近30天的记录
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const filteredHistory = newHistory.filter(h => new Date(h.viewTime) > thirtyDaysAgo);
    
    // 最多保留100条
    if (filteredHistory.length > 100) {
      filteredHistory.length = 100;
    }
    
    wx.setStorageSync('viewHistory', filteredHistory);
  },

  async checkFavorite() {
    const openid = wx.getStorageSync('openid');
    if (!openid) return;

    try {
      const res = await db.collection('favorites')
        .where({
          userId: openid,
          productId: this.data.productId
        })
        .get();
      
      this.setData({ isFavorite: res.data.length > 0 });
    } catch (err) {
      console.error(err);
    }
  },

  async toggleFavorite() {
    const openid = wx.getStorageSync('openid');
    if (!openid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    try {
      if (this.data.isFavorite) {
        // 取消收藏
        await db.collection('favorites')
          .where({
            userId: openid,
            productId: this.data.productId
          })
          .remove();
        
        this.setData({ isFavorite: false });
        wx.showToast({ title: '已取消收藏' });
        
        // 更新商品收藏数
        await db.collection('products')
          .doc(this.data.productId)
          .update({
            data: {
              likeCount: db.command.inc(-1)
            }
          });
      } else {
        // 添加收藏
        await db.collection('favorites')
          .add({
            data: {
              userId: openid,
              productId: this.data.productId,
              createTime: db.serverDate()
            }
          });
        
        this.setData({ isFavorite: true });
        wx.showToast({ title: '收藏成功' });
        
        // 更新商品收藏数
        await db.collection('products')
          .doc(this.data.productId)
          .update({
            data: {
              likeCount: db.command.inc(1)
            }
          });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  contactSeller() {
    const { product } = this.data;
    if (!product.contact) {
      wx.showToast({ title: '暂无联系方式', icon: 'none' });
      return;
    }
    
    if (product.contact.type === 'wechat') {
      wx.setClipboardData({
        data: product.contact.value,
        success() {
          wx.showToast({ title: '微信号已复制' });
        }
      });
    } else if (product.contact.type === 'phone') {
      wx.makePhoneCall({
        phoneNumber: product.contact.value
      });
    }
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.product.images[index],
      urls: this.data.product.images
    });
  },

  viewSellerProfile() {
    // 查看卖家主页功能，暂时显示提示
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  onShareAppMessage() {
    const { product } = this.data;
    return {
      title: product.title,
      path: `/pages/detail/detail?id=${product._id}`,
      imageUrl: product.images[0]
    };
  }
});