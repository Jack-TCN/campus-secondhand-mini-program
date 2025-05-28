// pages/mine/mine.js
Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false
  },

  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    if (userInfo && openid) {
      this.setData({ 
        userInfo,
        hasUserInfo: true
      });
    }
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: async (res) => {
        const userInfo = res.userInfo;
        
        // 获取openid
        try {
          const loginRes = await wx.cloud.callFunction({
            name: 'login'
          });
          
          if (loginRes.result.openid) {
            wx.setStorageSync('openid', loginRes.result.openid);
            wx.setStorageSync('userInfo', userInfo);
            
            // 保存到数据库
            const db = wx.cloud.database();
            await db.collection('users').add({
              data: {
                openid: loginRes.result.openid,
                ...userInfo,
                createTime: db.serverDate(),
                updateTime: db.serverDate()
              }
            });
            
            this.setData({ 
              userInfo,
              hasUserInfo: true
            });
            wx.showToast({ title: '登录成功' });
          }
        } catch (err) {
          console.error('登录失败', err);
          wx.showToast({ title: '登录失败', icon: 'none' });
        }
      }
    });
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
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  toAbout() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  checkLogin() {
    const openid = wx.getStorageSync('openid');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!openid || !userInfo) {
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
          this.setData({ 
            userInfo: null,
            hasUserInfo: false
          });
          wx.showToast({ title: '已退出登录' });
        }
      }
    });
  }
});