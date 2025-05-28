// pages/detail/detail.js
const db = wx.cloud.database();

Page({
  data: {
    productId: '',
    product: null,
    loading: true,
    isFavorite: false,
    currentImageIndex: 0
  },

  onLoad(options) {
    this.setData({ productId: options.id });
    this.loadProduct();
    this.checkFavorite();
  },

  loadProduct() {
    db.collection('products')
      .doc(this.data.productId)
      .get()
      .then(res => {
        this.setData({
          product: res.data,
          loading: false
        });
        // 增加浏览量
        this.increaseViewCount();
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      });
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

  checkFavorite() {
    const userId = wx.getStorageSync('userId');
    if (!userId) return;

    db.collection('favorites')
      .where({
        userId,
        productId: this.data.productId
      })
      .get()
      .then(res => {
        this.setData({ isFavorite: res.data.length > 0 });
      });
  },

  toggleFavorite() {
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    if (this.data.isFavorite) {
      // 取消收藏
      db.collection('favorites')
        .where({
          userId,
          productId: this.data.productId
        })
        .remove()
        .then(() => {
          this.setData({ isFavorite: false });
          wx.showToast({ title: '已取消收藏' });
        });
    } else {
      // 添加收藏
      db.collection('favorites')
        .add({
          data: {
            userId,
            productId: this.data.productId,
            createTime: new Date()
          }
        })
        .then(() => {
          this.setData({ isFavorite: true });
          wx.showToast({ title: '收藏成功' });
        });
    }
  },

  contactSeller() {
    const { product } = this.data;
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

  onShareAppMessage() {
    const { product } = this.data;
    return {
      title: product.title,
      path: `/pages/detail/detail?id=${product._id}`,
      imageUrl: product.images[0]
    };
  }
});