// pages/mine/mine.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    myProductsCount: 0,
    defaultAvatar: app.globalData.defaultImages.avatar,
    isDev: false
  },

  onLoad() {
    // 检查是否为开发环境
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      isDev: systemInfo.platform === 'devtools'
    });
    
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
    this.getMyProductsCount();
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

  async getMyProductsCount() {
    const openid = wx.getStorageSync('openid');
    if (!openid) return;
    
    try {
      const db = wx.cloud.database();
      const countResult = await db.collection('products')
        .where({ userId: openid })
        .count();
      
      this.setData({
        myProductsCount: countResult.total
      });
    } catch (err) {
      console.error(err);
    }
  },

  getUserProfile() {
    // 如果是开发环境且已有Mock数据，直接使用
    if (this.data.isDev) {
      const userInfo = wx.getStorageSync('userInfo');
      const openid = wx.getStorageSync('openid');
      if (userInfo && openid) {
        this.setData({ 
          userInfo,
          hasUserInfo: true
        });
        wx.showToast({ title: '开发环境登录成功' });
        this.getMyProductsCount();
        return;
      }
    }
    
    // 真机环境使用微信登录
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: async (res) => {
        const userInfo = res.userInfo;
        
        try {
          const loginRes = await wx.cloud.callFunction({
            name: 'login'
          });
          
          if (loginRes.result.openid) {
            wx.setStorageSync('openid', loginRes.result.openid);
            wx.setStorageSync('userInfo', userInfo);
            
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
            this.getMyProductsCount();
          }
        } catch (err) {
          console.error('登录失败', err);
          wx.showToast({ title: '登录失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({ title: '登录失败', icon: 'none' });
      }
    });
  },

  toMyProducts() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/packageA/pages/myProducts/myProducts' });
  },

  toFavorites() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/packageB/pages/favorites/favorites' });
  },

  toHistory() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/packageB/pages/history/history' });
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
            hasUserInfo: false,
            myProductsCount: 0
          });
          wx.showToast({ title: '已退出登录' });
        }
      }
    });
  }
});
