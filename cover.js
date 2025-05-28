//pages\cover\cover.js
Page({
  onLoad() {
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/index/index' });
    }, 1500);
  }
});
