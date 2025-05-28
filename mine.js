// pages/mine/mine.js - 增强版个人页面逻辑
Page({
  data: {
    userInfo: {},
    stats: {
      published: 0,
      sold: 0,
      favorites: 0,
      messages: 0
    }
  },

  onLoad() {
    this.loadUserInfo();
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo });
  },

  // 加载统计数据
  loadStats() {
    const userId = wx.getStorageSync('userId');
    if (!userId) return;

    // 获取发布商品数量
    wx.cloud.database().collection('products')
      .where({ userId: userId })
      .count()
      .then(res => {
        this.setData({ 'stats.published': res.total });
      });

    // 获取收藏数量
    wx.cloud.database().collection('favorites')
      .where({ userId: userId })
      .count()
      .then(res => {
        this.setData({ 'stats.favorites': res.total });
      });

    // 模拟其他数据
    this.setData({
      'stats.sold': 3,
      'stats.messages': 5
    });
  },

  // 登录
  login() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        wx.setStorageSync('userInfo', userInfo);
        wx.setStorageSync('userId', 'user_' + Date.now());
        
        this.setData({ userInfo });
        wx.showToast({ title: '登录成功' });
      },
      fail: () => {
        wx.showToast({ title: '登录失败', icon: 'none' });
      }
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({
            userInfo: {},
            stats: { published: 0, sold: 0, favorites: 0, messages: 0 }
          });
          wx.showToast({ title: '已退出登录' });
        }
      }
    });
  },

  // 页面导航
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url });
    }
  }
});