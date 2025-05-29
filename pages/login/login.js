// pages/login/login.js
Page({
  data: {
    canIUseGetUserProfile: false,
    canIUseNicknameComp: false,
  },

  onLoad() {
    // 检查是否支持getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    // 检查是否已登录
    this.checkLogin();
  },

  // 检查登录状态
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.openid) {
      // 已登录，返回上一页
      wx.navigateBack();
    }
  },

  // 微信一键登录
  getUserProfile(e) {
    wx.showLoading({
      title: '登录中...'
    });

    // 使用wx.getUserProfile获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功', res);
        this.wxLogin(res.userInfo);
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取用户信息失败', err);
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  // 微信登录
  wxLogin(userInfo) {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('云函数调用成功', res);
        const openid = res.result.openid;
        
        // 保存用户信息到本地
        const fullUserInfo = {
          ...userInfo,
          openid: openid
        };
        wx.setStorageSync('userInfo', fullUserInfo);
        
        // 保存用户信息到数据库
        this.saveUserToDatabase(fullUserInfo);
      },
      fail: err => {
        wx.hideLoading();
        console.error('云函数调用失败', err);
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 保存用户信息到数据库
  saveUserToDatabase(userInfo) {
    const db = wx.cloud.database();
    const users = db.collection('users');
    
    // 先查询用户是否存在
    users.where({
      openid: userInfo.openid
    }).get({
      success: res => {
        if (res.data.length === 0) {
          // 用户不存在，创建新用户
          users.add({
            data: {
              openid: userInfo.openid,
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl,
              gender: userInfo.gender,
              city: userInfo.city,
              province: userInfo.province,
              country: userInfo.country,
              language: userInfo.language,
              createTime: db.serverDate(),
              lastLoginTime: db.serverDate()
            },
            success: res => {
              console.log('用户信息保存成功');
              this.loginSuccess();
            },
            fail: err => {
              console.error('用户信息保存失败', err);
              this.loginSuccess(); // 即使保存失败也允许登录
            }
          });
        } else {
          // 用户已存在，更新最后登录时间
          users.doc(res.data[0]._id).update({
            data: {
              lastLoginTime: db.serverDate(),
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl
            },
            success: res => {
              console.log('用户信息更新成功');
              this.loginSuccess();
            },
            fail: err => {
              console.error('用户信息更新失败', err);
              this.loginSuccess(); // 即使更新失败也允许登录
            }
          });
        }
      },
      fail: err => {
        console.error('查询用户失败', err);
        this.loginSuccess(); // 即使查询失败也允许登录
      }
    });
  },

  // 登录成功
  loginSuccess() {
    wx.hideLoading();
    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500,
      success: () => {
        setTimeout(() => {
          // 返回上一页
          wx.navigateBack();
        }, 1500);
      }
    });
  },

  // 暂不登录
  skipLogin() {
    wx.navigateBack();
  }
});
