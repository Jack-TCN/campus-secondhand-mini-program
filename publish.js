// pages/publish/publish.js
wx.cloud.init({ env: '你的 envId' });
const db = wx.cloud.database();

Page({
  data: {
    form: {
      title: '',
      price: '',
      desc: '',
      image: '/images/book.jpg'
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
      success: res => {
        const tempFilePath = res.tempFilePaths[0];
        wx.cloud.uploadFile({
          cloudPath: `product-${Date.now()}.jpg`,
          filePath: tempFilePath
        }).then(uploadRes => {
          this.setData({ 'form.image': uploadRes.fileID });
        });
      }
    });
  },

  submit() {
    const { title, price, desc, image } = this.data.form;
    if (!title || !price || !desc) {
      return wx.showToast({ title: '请填写完整', icon: 'none' });
    }
    db.collection('products').add({
      data: {
        title,
        price: Number(price),
        desc,
        category: '教材书籍',
        condition: '九成新',
        image,
        createTime: new Date()
      }
    }).then(() => {
      wx.showToast({ title: '发布成功' });
      // 刷新首页
      const pages = getCurrentPages();
      const indexPage = pages.find(p => p.route === 'pages/index/index');
      if (indexPage) indexPage.loadProducts();
      wx.navigateBack();
    });
  }
});
