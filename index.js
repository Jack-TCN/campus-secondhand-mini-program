// pages/index/index.js - 增强版首页逻辑
const db = wx.cloud.database();

Page({
  data: {
    activeTab: 0,
    products: [],
    loading: false,
    refreshing: false,
    newCount: 0,
    categories: [
      { label: '全部', value: 'all', active: true },
      { label: '教材书籍', value: 'books' },
      { label: '电子数码', value: 'electronics' },
      { label: '生活用品', value: 'daily' },
      { label: '服装配饰', value: 'clothing' },
      { label: '运动户外', value: 'sports' }
    ],
    currentCategory: 'all'
  },

  onLoad() {
    this.loadProducts();
    this.checkNewMessages();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadProducts();
  },

  // 加载商品列表
  loadProducts() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    let query = db.collection('products').orderBy('createTime', 'desc');
    
    // 如果有分类筛选
    if (this.data.currentCategory !== 'all') {
      query = query.where({
        category: this.data.currentCategory
      });
    }

    query.get()
      .then(res => {
        const products = res.data.map(item => ({
          ...item,
          image: item.images && item.images[0] ? item.images[0] : '/images/default-product.jpg',
          createTime: this.formatTime(item.createTime)
        }));
        
        this.setData({ 
          products, 
          loading: false,
          refreshing: false 
        });
      })
      .catch(err => {
        console.error('加载商品失败:', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false, refreshing: false });
      });
  },

  // 检查新消息
  checkNewMessages() {
    // 模拟检查新消息数量
    this.setData({ newCount: 3 });
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ refreshing: true });
    this.loadProducts();
  },

  // 分类切换
  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category || 'all';
    this.setData({ currentCategory: category });
    this.loadProducts();
  },

  // 跳转到详情页
  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ 
      url: `/pages/detail/detail?id=${id}` 
    });
  },

  // 底部导航切换
  onTabChange(e) {
    const idx = e.detail;
    this.setData({ activeTab: idx });
    
    switch(idx) {
      case 1:
        wx.navigateTo({ url: '/pages/publish/publish' });
        break;
      case 2:
        wx.navigateTo({ url: '/pages/messages/messages' });
        break;
      case 3:
        wx.navigateTo({ url: '/pages/mine/mine' });
        break;
    }
  },

  // 搜索功能
  onSearch(e) {
    const keyword = e.detail;
    if (!keyword.trim()) return;
    
    // 实现搜索逻辑
    wx.showLoading({ title: '搜索中...' });
    
    db.collection('products')
      .where({
        title: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      })
      .get()
      .then(res => {
        wx.hideLoading();
        this.setData({ products: res.data });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '搜索失败', icon: 'none' });
      });
  },

  // 格式化时间
  formatTime(date) {
    if (!date) return '刚刚';
    
    const now = new Date();
    const time = new Date(date);
    const diff = now - time;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Math.floor(diff / 86400000) + '天前';
  }
});

// pages/publish/publish.js - 增强版发布页面逻辑
wx.cloud.init();
const db = wx.cloud.database();

Page({
  data: {
    form: {
      title: '',
      price: '',
      category: '',
      condition: '',
      desc: '',
      contact: '',
      images: []
    },
    submitting: false,
    showCategory: false,
    categories: [
      { value: 'books', label: '教材书籍', icon: '📚' },
      { value: 'electronics', label: '电子数码', icon: '📱' },
      { value: 'daily', label: '生活用品', icon: '🏠' },
      { value: 'clothing', label: '服装配饰', icon: '👕' },
      { value: 'sports', label: '运动户外', icon: '⚽' },
      { value: 'other', label: '其他', icon: '📦' }
    ],
    conditions: ['全新', '几乎全新', '九成新', '八成新', '七成新', '六成新及以下']
  },

  onLoad() {
    // 获取用户信息用于联系方式
    this.getUserContact();
  },

  // 获取用户联系方式
  getUserContact() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.contact) {
      this.setData({
        'form.contact': userInfo.contact
      });
    }
  },

  onBack() {
    if (this.hasFormData()) {
      wx.showModal({
        title: '确认离开',
        content: '您有未保存的内容，确定要离开吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  // 检查是否有表单数据
  hasFormData() {
    const { title, price, desc, images } = this.data.form;
    return title || price || desc || images.length > 0;
  },

  // 输入处理
  onInput(field) {
    return (e) => {
      this.setData({
        [`form.${field}`]: e.detail.value || e.detail
      });
    };
  },

  // 选择图片
  chooseImage() {
    const maxCount = 6 - this.data.form.images.length;
    
    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        wx.showLoading({ title: '上传中...' });
        
        const uploadPromises = res.tempFilePaths.map(filePath => {
          return wx.cloud.uploadFile({
            cloudPath: `products/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
            filePath: filePath
          });
        });

        Promise.all(uploadPromises)
          .then(results => {
            const newImages = results.map(result => result.fileID);
            this.setData({
              'form.images': this.data.form.images.concat(newImages)
            });
            wx.hideLoading();
            wx.showToast({ title: '上传成功' });
          })
          .catch(error => {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
            console.error('图片上传失败:', error);
          });
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.form.images;
    images.splice(index, 1);
    this.setData({ 'form.images': images });
  },

  // 显示分类选择器
  showCategoryPicker() {
    this.setData({ showCategory: true });
  },

  // 关闭分类选择器
  closeCategoryPicker() {
    this.setData({ showCategory: false });
  },

  // 选择分类
  selectCategory(e) {
    const value = e.currentTarget.dataset.value;
    const category = this.data.categories.find(item => item.value === value);
    
    this.setData({
      'form.category': category.label,
      showCategory: false
    });
  },

  // 显示新旧程度选择器
  showConditionPicker() {
    wx.showActionSheet({
      itemList: this.data.conditions,
      success: (res) => {
        this.setData({
          'form.condition': this.data.conditions[res.tapIndex]
        });
      }
    });
  },

  // 表单验证
  validateForm() {
    const { title, price, category, condition, desc, contact, images } = this.data.form;
    
    if (!title.trim()) {
      wx.showToast({ title: '请输入商品标题', icon: 'none' });
      return false;
    }
    
    if (!price || isNaN(price) || price <= 0) {
      wx.showToast({ title: '请输入正确的价格', icon: 'none' });
      return false;
    }
    
    if (!category) {
      wx.showToast({ title: '请选择商品分类', icon: 'none' });
      return false;
    }
    
    if (!condition) {
      wx.showToast({ title: '请选择新旧程度', icon: 'none' });
      return false;
    }
    
    if (!desc.trim()) {
      wx.showToast({ title: '请输入商品描述', icon: 'none' });
      return false;
    }
    
    if (!contact.trim()) {
      wx.showToast({ title: '请输入联系方式', icon: 'none' });
      return false;
    }
    
    if (images.length === 0) {
      wx.showToast({ title: '请至少上传一张图片', icon: 'none' });
      return false;
    }
    
    return true;
  },

  // 提交表单
  submit() {
    if (!this.validateForm() || this.data.submitting) return;
    
    this.setData({ submitting: true });
    
    const formData = {
      ...this.data.form,
      price: Number(this.data.form.price),
      createTime: new Date(),
      status: 'active',
      viewCount: 0,
      likeCount: 0,
      userId: wx.getStorageSync('userId') || 'anonymous'
    };

    db.collection('products')
      .add({ data: formData })
      .then(result => {
        wx.showToast({ title: '发布成功！' });
        
        // 清空表单
        this.setData({
          form: {
            title: '',
            price: '',
            category: '',
            condition: '',
            desc: '',
            contact: this.data.form.contact, // 保留联系方式
            images: []
          },
          submitting: false
        });

        // 延迟返回首页
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
        }, 1500);
      })
      .catch(error => {
        console.error('发布失败:', error);
        wx.showToast({ title: '发布失败，请重试', icon: 'none' });
        this.setData({ submitting: false });
      });
  }
});