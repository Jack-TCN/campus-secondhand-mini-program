// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-7gfxho5dc5bf7678', // 替换成你的 envId
        traceUser: true
      });
    }
  },
  
  globalData: {
    userInfo: null
  }
});