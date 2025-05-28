// pages/mine/mine.js
Page({
  data: {
    userInfo: null
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  getUserInfo(e) {
    if (e.detail.userInfo) {
      wx.setStorageSync('userInfo', e.detail.userInfo);
      this.setData({ userInfo: e.detail.userInfo });
      wx.showToast({ title: '登录成功' });
    }
  },

  toMyProducts() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/myProducts/myProducts' });
  },

  toFavorites() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/favorites/favorites' });
  },

  toHistory() {
    if (!this.checkLogin()) return;
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  toProfile() {
    if (!this.checkLogin()) return;
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  toHelp() {
    wx.navigateTo({ url: '/pages/help/help' });
  },

  toAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  checkLogin() {
    if (!this.data.userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return false;
    }
    return true;
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('openid');
          this.setData({ userInfo: null });
          wx.showToast({ title: '已退出登录' });
        }
      }
    });
  }
});