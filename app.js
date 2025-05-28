// app.js
App({
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-7gfxho5dc5bf7678', // 替换成你的 envId
      traceUser: true
    });

    // 获取用户信息
    this.getUserInfo();
  },

  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },

  globalData: {
    userInfo: null,
    categories: [
      { id: 'books', name: '教材书籍', icon: '📚' },
      { id: 'digital', name: '电子数码', icon: '📱' },
      { id: 'life', name: '生活用品', icon: '🏠' },
      { id: 'clothes', name: '服饰鞋包', icon: '👔' },
      { id: 'sports', name: '体育用品', icon: '⚽' },
      { id: 'other', name: '其他物品', icon: '📦' }
    ],
    conditions: [
      { value: 'new', label: '全新' },
      { value: '99new', label: '99成新' },
      { value: '95new', label: '95成新' },
      { value: '90new', label: '9成新' },
      { value: '80new', label: '8成新' },
      { value: 'other', label: '其他' }
    ]
  }
});