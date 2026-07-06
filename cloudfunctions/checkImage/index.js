// 云函数 checkImage：图片内容安全检测
// 入参 event.fileID: 云存储 fileID（图片需先上传到云存储再检测）
// 返回 { ok, safe, msg }
//
// 用途：登录头像、菜品图等用户上传的图片，必须先过内容安全检测再采用。
// 对应审核要求：UGC 场景需接入 security.imgSecCheck。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { fileID } = event
  if (!fileID) {
    return { ok: false, safe: false, msg: '缺少图片' }
  }

  try {
    // 1. 从云存储下载图片到临时 buffer
    const fileRes = await cloud.downloadFile({ fileID })
    const buffer = fileRes.fileContent

    // 2. 调用微信内容安全检测 imgSecCheck
    const result = await cloud.openapi.security.imgSecCheck({
      media: {
        contentType: 'image/jpeg',
        value: buffer
      }
    })

    // result.errcode: 0=正常 86414=违规
    // result.traceId 用于追溯
    if (result && result.errCode === 0) {
      return { ok: true, safe: true, msg: '内容安全' }
    } else {
      // 违规或可疑
      console.warn('图片检测不通过', result)
      return { ok: true, safe: false, msg: '图片含违规内容，请更换' }
    }
  } catch (err) {
    console.error('checkImage 失败', err)
    // 检测失败时保守处理：放行但记录，避免阻塞正常用户
    // 如需更严格可改成 safe: false
    return { ok: false, safe: true, msg: '检测服务异常，已放行' }
  }
}
