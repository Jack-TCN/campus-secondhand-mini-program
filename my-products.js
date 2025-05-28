// pages/myProducts/myProducts.js
const db = wx.cloud.database();

Page({
  data: {
    activeTab: 0,
    onSaleProducts: [],
    offSaleProducts: [],
    onSaleCount: 0,
    offSaleCount: 0,
    loading: false
  },

  onLoad() {
    this.loadProducts();
  },

  onShow() {
    this.loadProducts();
  },

  onBack() {
    wx.navigateBack();
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.index });
  },

  async loadProducts() {
    const openid = wx.getStorageSync('openid');
    if (!openid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      // 获取在售商品
      const onSaleRes = await db.collection('products')
        .where({ 
          userId: openid,
          status: 'on_sale'
        })
        .orderBy('createTime', 'desc')
        .get();

      // 获取已下架商品
      const offSaleRes = await db.collection('products')
        .where({ 
          userId: openid,
          status: 'off_shelf'
        })
        .orderBy('updateTime', 'desc')
        .get();

      this.setData({
        onSaleProducts: onSaleRes.data,
        offSaleProducts: offSaleRes.data,
        onSaleCount: onSaleRes.data.length,
        offSaleCount: offSaleRes.data.length,
        loading: false
      });
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  editProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/publish/publish?id=${id}&edit=true` });
  },

  toggleStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    const newStatus = status === 'on_sale' ? 'off_shelf' : 'on_sale';
    const action = newStatus === 'on_sale' ? '上架' : '下架';
    
    wx.showModal({
      title: '提示',
      content: `确定要${action}该商品吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          try {
            await db.collection('products')
              .doc(id)
              .update({
                data: { 
                  status: newStatus,
                  updateTime: db.serverDate()
                }
              });
            
            wx.hideLoading();
            wx.showToast({ title: `${action}成功` });
            this.loadProducts();
          } catch (err) {
            wx.hideLoading();
            console.error(err);
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  deleteProduct(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除该商品吗？删除后不可恢复',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          try {
            // 删除商品
            await db.collection('products').doc(id).remove();
            
            // 删除相关的收藏记录
            await db.collection('favorites')
              .where({ productId: id })
              .remove();
            
            wx.hideLoading();
            wx.showToast({ title: '删除成功' });
            this.loadProducts();
          } catch (err) {
            wx.hideLoading();
            console.error(err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});