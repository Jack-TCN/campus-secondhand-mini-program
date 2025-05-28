// pages/index/index.js
const db = wx.cloud.database();

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
    db.collection('products')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        // 如果后端无 image 字段，则用本地默认图
        const products = res.data.map(item => ({
          ...item,
          image: item.image || '/images/shenkai-gaoshu.jpg'
        }));
        console.log('【DEBUG】products:', products);
        this.setData({ products, loading: false });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '拉取失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onTabChange(e) {
    const idx = e.detail;
    if (idx === 1) wx.navigateTo({ url: '/pages/publish/publish' });
    else if (idx === 2) wx.navigateTo({ url: '/pages/mine/mine' });
  },

  onSearch(e) {
    console.log('搜索关键词', e.detail);
    // TODO: 增加过滤逻辑
  }
});
