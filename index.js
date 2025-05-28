// pages/index/index.js
Page({
  data: {
    activeTab: 0,
    products: [],
    loading: false
  },

  onLoad() {
    this.loadProducts();
  },

  loadProducts() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    wx.cloud.database()
      .collection('products')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        const products = res.data.map(item => {
          const imagePath = item.image || '/images/shenkai-gaoshu.jpg';
          console.log('【DEBUG】item:', item._id, 'imagePath:', imagePath);
          return {
            ...item,
            id: item._id,
            image: imagePath
          };
        });
        this.setData({ products, loading: false });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '拉取数据失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onTabChange(e) {
    const idx = e.detail;
    if (idx === 1) {
      wx.navigateTo({ url: '/pages/publish/publish' });
    } else if (idx === 2) {
      wx.navigateTo({ url: '/pages/mine/mine' });
    }
  },

  onSearch(e) {
    console.log('搜索关键词', e.detail);
    // 后续可加过滤逻辑
  }
});
