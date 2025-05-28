// pages/myProducts/myProducts.js
const db = wx.cloud.database();

Page({
  data: {
    activeTab: 0,
    onSaleProducts: [],
    offSaleProducts: [],
    soldProducts: [],
    loading: false,
    stats: {
      total: 0,
      onSale: 0,
      sold: 0
    },
    showActionSheet: false,
    actions: [],
    selectedProduct: null
  },

  onLoad() {
    this.loadProducts();
  },

  onShow() {
    // 从编辑页返回时刷新
    const pages = getCurrentPages();
    if (pages.length > 1) {
      const prevPage = pages[pages.length - 2];
      if (prevPage.route === 'pages/publish/publish') {
        this.loadProducts();
      }
    }
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
      // 获取所有商品
      const allRes = await db.collection('products')
        .where({ userId: openid })
        .orderBy('createTime', 'desc')
        .get();

      const allProducts = allRes.data;
      
      // 分类商品
      const onSaleProducts = [];
      const offSaleProducts = [];
      const soldProducts = [];
      
      allProducts.forEach(product => {
        // 格式化时间
        product.timeStr = this.formatTime(product.createTime);
        
        if (product.status === 'on_sale') {
          onSaleProducts.push(product);
        } else if (product.status === 'off_shelf') {
          offSaleProducts.push(product);
        } else if (product.status === 'sold') {
          product.soldTimeStr = product.soldTime ? this.formatTime(product.soldTime) : '未知';
          soldProducts.push(product);
        }
      });

      this.setData({
        onSaleProducts,
        offSaleProducts,
        soldProducts,
        stats: {
          total: allProducts.length,
          onSale: onSaleProducts.length,
          sold: soldProducts.length
        },
        loading: false
      });
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  formatTime(date) {
    if (!date) return '';
    const now = new Date();
    const target = new Date(date);
    const diff = now - target;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    
    return `${target.getMonth() + 1}月${target.getDate()}日`;
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  editProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/publish/publish?id=${id}&edit=true` });
  },

  showActions(e) {
    const product = e.currentTarget.dataset.product;
    let actions = [];
    
    if (product.status === 'on_sale') {
      actions = [
        { name: '编辑商品', value: 'edit' },
        { name: '下架商品', value: 'off' },
        { name: '标记售出', value: 'sold' },
        { name: '删除商品', value: 'delete', color: '#ee0a24' }
      ];
    } else if (product.status === 'off_shelf') {
      actions = [
        { name: '重新上架', value: 'on' },
        { name: '编辑商品', value: 'edit' },
        { name: '删除商品', value: 'delete', color: '#ee0a24' }
      ];
    }
    
    this.setData({
      showActionSheet: true,
      actions,
      selectedProduct: product
    });
  },

  onActionClose() {
    this.setData({ showActionSheet: false });
  },

  onActionSelect(e) {
    const value = e.detail.value;
    const product = this.data.selectedProduct;
    
    switch (value) {
      case 'edit':
        this.editProduct({ currentTarget: { dataset: { id: product._id } } });
        break;
      case 'on':
      case 'off':
        this.toggleStatus({ currentTarget: { dataset: { id: product._id, status: product.status } } });
        break;
      case 'sold':
        this.markAsSold(product._id);
        break;
      case 'delete':
        this.deleteProduct({ currentTarget: { dataset: { id: product._id } } });
        break;
    }
    
    this.setData({ showActionSheet: false });
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

  markAsSold(id) {
    wx.showModal({
      title: '提示',
      content: '确定要标记为已售出吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          try {
            await db.collection('products')
              .doc(id)
              .update({
                data: { 
                  status: 'sold',
                  soldTime: db.serverDate(),
                  updateTime: db.serverDate()
                }
              });
            
            wx.hideLoading();
            wx.showToast({ title: '标记成功' });
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