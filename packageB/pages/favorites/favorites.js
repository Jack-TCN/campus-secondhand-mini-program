// packageB/pages/favorites/favorites.js
const db = wx.cloud.database();
const app = getApp();

Page({
  data: {
    favorites: [],
    loading: false,
    emptyImage: app.globalData.defaultImages.empty
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

      // 批量查询商品（每次最多20个）
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

      // 合并收藏记录和商品信息
      const validProducts = favRes.data.map(fav => {
        const product = products.find(p => p._id === fav.productId);
        if (product) {
          return {
            ...product,
            favoriteId: fav._id,
            condition: conditionMap[product.condition] || product.condition
          };
        }
        return null;
      }).filter(item => item !== null);

      this.setData({
        favorites: validProducts,
        loading: false
      });
    } catch (err) {
      console.error('加载收藏失败：', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/packageA/pages/detail/detail?id=${id}` });
  },

  async removeFavorite(e) {
    const favoriteId = e.currentTarget.dataset.favoriteid;
    const productId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '提示',
      content: '确定要取消收藏吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          try {
            // 删除收藏记录
            await db.collection('favorites').doc(favoriteId).remove();
            
            // 更新商品收藏数
            await db.collection('products')
              .doc(productId)
              .update({
                data: {
                  likeCount: db.command.inc(-1)
                }
              });

            wx.hideLoading();
            wx.showToast({ title: '已取消收藏' });
            this.loadFavorites();
          } catch (err) {
            wx.hideLoading();
            console.error('取消收藏失败：', err);
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});
