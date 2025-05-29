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

  onBack() {
    wx.navigateBack();
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  async loadFavorites() {
    const openid = wx.getStorageSync('openid');
    if (!openid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      // 获取收藏记录
      const favRes = await db.collection('favorites')
        .where({ userId: openid })
        .orderBy('createTime', 'desc')
        .get();

      if (favRes.data.length === 0) {
        this.setData({ favorites: [], loading: false });
        return;
      }

      // 获取商品详情
      const productIds = favRes.data.map(item => item.productId);
      const products = [];

      // 批量查询商品
      for (let i = 0; i < productIds.length; i += 20) {
        const batch = productIds.slice(i, i + 20);
        const res = await db.collection('products')
          .where({
            _id: db.command.in(batch)
          })
          .get();
        products.push(...res.data);
      }

      // 映射条件显示文本
      const conditionMap = {
        'new': '全新',
        '99new': '99成新',
        '95new': '95成新',
        '90new': '9成新',
        '80new': '8成新',
        'other': '其他'
      };

      const validProducts = products.map(item => ({
        ...item,
        condition: conditionMap[item.condition] || item.condition
      }));

      this.setData({
        favorites: validProducts,
        loading: false
      });
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  removeFavorite(e) {
    const productId = e.currentTarget.dataset.id;
    const openid = wx.getStorageSync('openid');

    wx.showModal({
      title: '提示',
      content: '确定要取消收藏吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.collection('favorites')
              .where({
                userId: openid,
                productId: productId
              })
              .remove();

            wx.showToast({ title: '已取消收藏' });
            this.loadFavorites();
          } catch (err) {
            console.error(err);
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});
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