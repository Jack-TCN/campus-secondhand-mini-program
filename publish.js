// pages/publish/publish.js
const db = wx.cloud.database();

Page({
  data: {
    form: {
      title: '',
      price: '',
      desc: '',
      image: '/images/default-product.jpg'
    }
  },
  
  onBack() {
    wx.navigateBack();
  },
  
  onInput(field) {
    return e => {
      this.setData({ [`form.${field}`]: e.detail });
    };
  },
  
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePath = res.tempFilePaths[0];
        // 显示本地图片
        this.setData({ 'form.image': tempFilePath });
        
        // 上传到云存储
        wx.showLoading({ title: '上传中...' });
        wx.cloud.uploadFile({
          cloudPath: `products/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
          filePath: tempFilePath
        }).then(uploadRes => {
          wx.hideLoading();
          this.setData({ 'form.image': uploadRes.fileID });
          wx.showToast({ title: '上传成功' });
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      }
    });
  },
  
  submit() {
    const { title, price, desc, image } = this.data.form;
    
    if (!title || !price || !desc) {
      return wx.showToast({ 
        title: '请填写完整信息', 
        icon: 'none' 
      });
    }
    
    wx.showLoading({ title: '发布中...' });
    
    db.collection('products').add({
      data: {
        title,
        price: Number(price),
        desc,
        category: '教材书籍',
        condition: '九成新',
        image,
        status: 'on_sale',
        createTime: new Date()
      }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '发布成功' });
      
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '发布失败', icon: 'none' });
      console.error('发布失败：', err);
    });
  }
});