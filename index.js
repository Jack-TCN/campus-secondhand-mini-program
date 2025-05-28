// pages/index/index.js
const db = wx.cloud.database();
const app = getApp();

Page({
  data: {
    activeTab: 0,
    products: [],
    loading: false,
    searchValue: '',
    currentCategory: 'all',
    categories: app.globalData.categories,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadProducts();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadProducts(true);
    }
  },

  loadProducts(append = false) {
    if (this.data.loading) return Promise.resolve();
    
    this.setData({ loading: true });
    
    const query = db.collection('products')
      .where({ status: 'on_sale' });
    
    if (this.data.currentCategory !== 'all') {
      query.where({ category: this.data.currentCategory });
    }
    
    return query
      .orderBy('createTime', 'desc')
      .skip((this.data.page - 1) * 10)
      .limit(10)
      .get()
      .then(res => {
        const products = res.data.map(item => ({
          ...item,
          image: item.images?.[0] || '/images/default-product.jpg'
        }));
        
        if (append) {
          this.setData({
            products: [...this.data.products, ...products],
            loading: false,
            hasMore: products.length === 10
          });
        } else {
          this.setData({
            products,
            loading: false,
            hasMore: products.length === 10
          });
        }
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ 
      currentCategory: category,
      page: 1,
      hasMore: true
    });
    this.loadProducts();
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onTabChange(e) {
    const idx = e.detail;
    if (idx === 0) return;
    if (idx === 1) {
      wx.navigateTo({ url: '/pages/publish/publish' });
    } else if (idx === 2) {
      wx.navigateTo({ url: '/pages/mine/mine' });
    }
    // 重置tab
    this.setData({ activeTab: 0 });
  },

  onSearch(e) {
    const value = e.detail;
    this.setData({ searchValue: value });
    // TODO: 实现搜索功能
    wx.showToast({ title: '搜索: ' + value, icon: 'none' });
  }
});