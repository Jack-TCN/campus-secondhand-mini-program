// pages/detail/detail.js - 增强版详情页面逻辑
const db = wx.cloud.database();

Page({
  data: {
    product: {},
    seller: {},
    recommendProducts: [],
    isFavorited: false,
    loading: true
  },

  onLoad(options) {
    const productId = options.id;
    if (productId) {
      this.loadProductDetail(productId);
      this.loadRecommendProducts();
    }
  },

  onBack() {
    wx.navigateBack();
  },

  // 加载商品详情
  loadProductDetail(productId) {
    this.setData({ loading: true });

    db.collection('products')
      .doc(productId)
      .get()
      .then(res => {
        const product = res.data;
        
        // 增加浏览次数
        this.increaseViewCount(productId);
        
        // 处理图片数组
        if (!product.images || product.images.length === 0) {
          product.images = ['/images/default-product.jpg'];
        }

        this.setData({
          product: {
            ...product,
            createTime: this.formatTime(product.createTime)
          },
          loading: false
        });

        // 加载卖家信息
        this.loadSellerInfo(product.userId);
        
        // 检查是否已收藏
        this.checkFavoriteStatus(productId);
      })
      .catch(error => {
        console.error('加载商品详情失败:', error);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  // 增加浏览次数
  increaseViewCount(productId) {
    db.collection('products')
      .doc(productId)
      .update({
        data: {
          viewCount: db.command.inc(1)
        }
      })
      .catch(console.error);
  },

  // 加载卖家信息
  loadSellerInfo(userId) {
    // 这里应该从用户集合中获取卖家信息
    // 暂时使用模拟数据
    this.setData({
      seller: {
        name: '小明同学',
        avatar: '/images/default-avatar.png',
        school: 'XX大学',
        rating: 4.8
      }
    });
  },

  // 检查收藏状态
  checkFavoriteStatus(productId) {
    const userId = wx.getStorageSync('userId');
    if (!userId) return;

    db.collection('favorites')
      .where({
        userId: userId,
        productId: productId
      })
      .get()
      .then(res => {
        this.setData({
          isFavorited: res.data.length > 0
        });
      })
      .catch(console.error);
  },

  // 加载推荐商品
  loadRecommendProducts() {
    db.collection('products')
      .orderBy('viewCount', 'desc')
      .limit(10)
      .get()
      .then(res => {
        this.setData({
          recommendProducts: res.data.slice(0, 5)
        });
      })
      .catch(console.error);
  },

  // 切换收藏状态
  toggleFavorite() {
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const { isFavorited } = this.data;
    const productId = this.data.product._id;

    if (isFavorited) {
      // 取消收藏
      db.collection('favorites')
        .where({
          userId: userId,
          productId: productId
        })
        .remove()
        .then(() => {
          this.setData({ isFavorited: false });
          wx.showToast({ title: '已取消收藏' });
        })
        .catch(console.error);
    } else {
      // 添加收藏
      db.collection('favorites')
        .add({
          data: {
            userId: userId,
            productId: productId,
            createTime: new Date()
          }
        })
        .then(() => {
          this.setData({ isFavorited: true });
          wx.showToast({ title: '收藏成功' });
        })
        .catch(console.error);
    }
  },

  // 开始聊天
  startChat() {
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    // 跳转到聊天页面
    wx.navigateTo({
      url: `/pages/chat/chat?sellerId=${this.data.product.userId}&productId=${this.data.product._id}`
    });
  },

  // 模拟购买
  mockPay() {
    wx.showModal({
      title: '确认购买',
      content: `确定要购买"${this.data.product.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '购买成功（模拟）' });
        }
      }
    });
  },

  // 跳转到商品详情
  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.redirectTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 格式化时间
  formatTime(date) {
    if (!date) return '';
    
    const time = new Date(date);
    return `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`;
  }
});
