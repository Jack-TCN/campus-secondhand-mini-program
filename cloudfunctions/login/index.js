// cloudfunctions/clearDefaultData/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 清除所有测试数据
    // 您可以根据需要添加条件，比如只删除特定用户的数据
    const result = await db.collection('products').where({
      // 可以添加条件，例如：
      // userId: 'test-user-id'
      // 或者根据创建时间删除旧数据
      // createTime: db.command.lt(new Date('2024-01-01'))
    }).remove()
    
    return {
      success: true,
      removed: result.stats.removed,
      message: `成功删除 ${result.stats.removed} 条数据`
    }
  } catch (err) {
    console.error('清理数据失败：', err)
    return {
      success: false,
      error: err.toString()
    }
  }
}
