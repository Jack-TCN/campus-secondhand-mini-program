// pages/detail/detail.js
Page({
  data: {
    productId: '',
    product: {}
  },
  
  onLoad(options) {
    // 获取商品ID
    if (options.id) {
      this.setData({ productId: options.id });
      // TODO: 根据ID加载商品详情
    }
  },
  
  onBack() {
    wx.navigateBack();
  },
  
  startChat() {
    wx.showToast({ 
      title: '聊天功能待实现', 
      icon: 'none' 
    });
  },
  
  mockPay() {
    wx.showModal({
      title: '提示',
      content: '确认购买该商品？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ 
            title: '购买成功',
            icon: 'success'
          });
        }
      }
    });
  }
});