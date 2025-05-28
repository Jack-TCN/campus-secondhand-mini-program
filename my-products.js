// pages/myProducts/myProducts.js
const db = wx.cloud.database();

Page({
  data: {
    products: [],
    loading: false,
    activeTab: 0,
    tabs: ['在售', '已下架']
  },

  onLoad() {
    this.loadProducts();
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.index });
    this.loadProducts();
  },

  loadProducts() {
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    
    const status = this.data.activeTab === 0 ? 'on_sale' : 'off_shelf';
    
    db.collection('products')
      .where({ userId, status })
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({
          products: res.data,
          loading: false
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  toggleStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    const newStatus = status === 'on_sale' ? 'off_shelf' : 'on_sale';
    
    wx.showModal({
      title: '提示',
      content: `确定要${newStatus === 'on_sale' ? '上架' : '下架'}该商品吗？`,
      success: res => {
        if (res.confirm) {
          db.collection('products')
            .doc(id)
            .update({
              data: { status: newStatus }
            })
            .then(() => {
              wx.showToast({ title: '操作成功' });
              this.loadProducts();
            });
        }
      }
    });
  },

  editProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/publish/publish?id=${id}&edit=true` });
  },

  deleteProduct(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除该商品吗？',
      success: res => {
        if (res.confirm) {
          db.collection('products')
            .doc(id)
            .remove()
            .then(() => {
              wx.showToast({ title: '删除成功' });
              this.loadProducts();
            });
        }
      }
    });
  },

  onBack() {
    wx.navigateBack();
  }
});