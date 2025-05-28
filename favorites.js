// pages/favorites/favorites.js
const db = wx.cloud.database();

Page({
  data: {
    favorites: [],
    loading: false
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    this.loadFavorites();
  },

  loadFavorites() {
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    db.collection('favorites')
      .where({ userId })
      .orderBy('createTime', 'desc')
      .get()
      .then(async res => {
        const productIds = res.data.map(item => item.productId);
        if (productIds.length === 0) {
          this.setData({ favorites: [], loading: false });
          return;
        }

        // 批量获取商品信息
        const products = await Promise.all(
          productIds.map(id => 
            db.collection('products').doc(id).get()
              .then(res => ({ ...res.data, _id: id }))
              .catch(() => null)
          )
        );

        const validProducts = products.filter(p => p !== null);
        this.setData({
          favorites: validProducts,
          loading: false
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onBack() {
    wx.navigateBack();
  }
});