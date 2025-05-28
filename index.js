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
    categories: [
      { id: 'all', name: '全部', icon: '🏠' },
      { id: 'books', name: '教材书籍', icon: '📚' },
      { id: 'digital', name: '电子数码', icon: '📱' },
      { id: 'life', name: '生活用品', icon: '🏠' },
      { id: 'clothes', name: '服饰鞋包', icon: '👔' },
      { id: 'sports', name: '体育用品', icon: '⚽' },
      { id: 'other', name: '其他物品', icon: '📦' }
    ],
    page: 1,
    pageSize: 10,
    hasMore: true,
    refreshing: false
  },

  onLoad() {
    this.loadProducts();
  },

  onShow() {
    // 从发布页返回时刷新
    if (this.data.needRefresh) {
      this.setData({ needRefresh: false });
      this.onPullDownRefresh();
    }
  },

  onPullDownRefresh() {
    this.setData({ 
      page: 1, 
      hasMore: true,
      refreshing: true 
    });
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadProducts(true);
    }
  },

  async loadProducts(append = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      let query = db.collection('products').where({ status: 'on_sale' });
      
      // 分类筛选
      if (this.data.currentCategory !== 'all') {
        query = query.where({ category: this.data.currentCategory });
      }
      
      // 搜索功能
      if (this.data.searchValue) {
        query = query.where({
          title: db.RegExp({
            regexp: this.data.searchValue,
            options: 'i'
          })
        });
      }
      
      const res = await query
        .orderBy('createTime', 'desc')
        .skip((this.data.page - 1) * this.data.pageSize)
        .limit(this.data.pageSize)
        .get();
      
      const products = res.data.map(item => ({
        ...item,
        image: item.images?.[0] || '/images/default-product.jpg',
        createTimeStr: this.formatTime(item.createTime)
      }));
      
      if (append) {
        this.setData({
          products: [...this.data.products, ...products],
          loading: false,
          hasMore: products.length === this.data.pageSize
        });
      } else {
        this.setData({
          products,
          loading: false,
          hasMore: products.length === this.data.pageSize
        });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  formatTime(date) {
    if (!date) return '';
    const now = new Date();
    const target = new Date(date);
    const diff = now - target;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    
    return target.toLocaleDateString();
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    if (category === this.data.currentCategory) return;
    
    this.setData({ 
      currentCategory: category,
      page: 1,
      hasMore: true,
      products: []
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
    
    this.setData({ activeTab: 0 });
    
    if (idx === 1) {
      wx.navigateTo({ url: '/pages/publish/publish' });
    } else if (idx === 2) {
      wx.navigateTo({ url: '/pages/mine/mine' });
    }
  },

  onSearch(e) {
    const value = e.detail;
    this.setData({ 
      searchValue: value,
      page: 1,
      hasMore: true,
      products: []
    });
    this.loadProducts();
  },

  onSearchClear() {
    this.setData({ 
      searchValue: '',
      page: 1,
      hasMore: true,
      products: []
    });
    this.loadProducts();
  },

  toPublish() {
    wx.navigateTo({ 
      url: '/pages/publish/publish',
      success: () => {
        this.setData({ needRefresh: true });
      }
    });
  }
});