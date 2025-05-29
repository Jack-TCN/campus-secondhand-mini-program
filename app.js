// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-7gfxho5dc5bf7678',
        traceUser: true
      });
    }
    
    // 开发环境Mock登录
    this.mockLogin();
  },
  
  // 开发环境Mock登录
  mockLogin() {
    // 获取系统信息判断是否为开发环境
    const systemInfo = wx.getSystemInfoSync();
    const isDev = systemInfo.platform === 'devtools';
    
    if (isDev) {
      // 检查是否已有登录信息
      const openid = wx.getStorageSync('openid');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (!openid || !userInfo) {
        // Mock数据
        const mockOpenid = 'test_openid_' + Date.now();
        const mockUserInfo = {
          nickName: '测试用户',
          avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
          gender: 1,
          country: '中国',
          province: '北京',
          city: '北京',
          language: 'zh_CN'
        };
        
        // 存储Mock数据
        wx.setStorageSync('openid', mockOpenid);
        wx.setStorageSync('userInfo', mockUserInfo);
        
        console.log('开发环境Mock登录成功');
        console.log('OpenID:', mockOpenid);
        console.log('UserInfo:', mockUserInfo);
      }
    }
  },
  
  globalData: {
    userInfo: null,
    defaultImages: {
      avatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
      product: 'https://via.placeholder.com/400x400/f0f0f0/999999?text=No+Image',
      empty: 'https://via.placeholder.com/200x200/f0f0f0/999999?text=Empty'
    }
  }
});
