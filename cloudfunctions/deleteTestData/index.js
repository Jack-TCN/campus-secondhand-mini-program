const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 删除测试数据（根据标题或特定条件）
    const result = await db.collection('products').where({
      // 可以根据标题删除特定的测试数据
      title: db.command.in(['神来', 'nigger书籍'])
    }).remove()
    
    // 或者删除所有产品（慎用）
    // const result = await db.collection('products').where({}).remove()
    
    return {
      success: true,
      removed: result.stats.removed,
      message: `成功删除 ${result.stats.removed} 条数据`
    }
  } catch (err) {
    console.error('删除数据失败：', err)
    return {
      success: false,
      error: err.toString()
    }
  }
}
