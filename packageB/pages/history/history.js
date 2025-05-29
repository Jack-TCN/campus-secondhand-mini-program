// pages/history/history.js
const db = wx.cloud.database();

Page({
  data: {
    historyList: [],
    groupedHistory: [],
    loading: false
  },

  onLoad() {
    this.loadHistory();
  },

  onBack() {
    wx.navigateBack();
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  async loadHistory() {
    this.setData({ loading: true });
    
    try {
      // 从本地存储获取浏览历史
      const history = wx.getStorageSync('viewHistory') || [];
      
      if (history.length === 0) {
        this.setData({ 
          historyList: [], 
          groupedHistory: [],
          loading: false 
        });
        return;
      }
      
      // 获取商品详情
      const productIds = [...new Set(history.map(h => h.productId))];
      const products = [];
      
      for (let i = 0; i < productIds.length; i += 20) {
        const batch = productIds.slice(i, i + 20);
        const res = await db.collection('products')
          .where({
            _id: db.command.in(batch)
          })
          .get();
        products.push(...res.data);
      }
      
      // 合并浏览时间
      const historyList = history.map(h => {
        const product = products.find(p => p._id === h.productId);
        return product ? {
          ...product,
          viewTime: h.viewTime,
          viewTimeStr: this.formatTime(h.viewTime)
        } : null;
      }).filter(item => item !== null);
      
      // 按日期分组
      const grouped = this.groupByDate(historyList);
      
      this.setData({
        historyList,
        groupedHistory: grouped,
        loading: false
      });
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  groupByDate(list) {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    list.forEach(item => {
      const date = new Date(item.viewTime).toDateString();
      let dateLabel = date;
      
      if (date === today) {
        dateLabel = '今天';
      } else if (date === yesterday) {
        dateLabel = '昨天';
      } else {
        const d = new Date(item.viewTime);
        dateLabel = `${d.getMonth() + 1}月${d.getDate()}日`;
      }
      
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(item);
    });
    
    return Object.keys(groups).map(date => ({
      date,
      items: groups[date]
    }));
  },

  formatTime(date) {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  removeHistory(e) {
    const id = e.currentTarget.dataset.id;
    let history = wx.getStorageSync('viewHistory') || [];
    history = history.filter(h => h.productId !== id);
    wx.setStorageSync('viewHistory', history);
    this.loadHistory();
    wx.showToast({ title: '已删除' });
  },

  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有浏览记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('viewHistory');
          this.setData({ 
            historyList: [], 
            groupedHistory: [] 
          });
          wx.showToast({ title: '已清空' });
        }
      }
    });
  }
});