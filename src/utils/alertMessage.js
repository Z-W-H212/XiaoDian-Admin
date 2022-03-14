import { Modal, message } from 'antd'

export function del (callback) {
  Modal.confirm({
    title: '是否删除？',
    okText: '确认',
    cancelText: '取消',
    onOk () {
      const promis = callback()
      if (promis && promis.then) {
        promis.then(() => message.success('删除成功'))
        return promis
      }
    },
  })
}

export function confirm (title) {
  return function (callback) {
    Modal.confirm({
      title,
      okText: '确认',
      cancelText: '取消',
      onOk () {
        const promis = callback()
        if (promis && promis.then) {
          promis.then(() => message.success('完成！'))
          return promis
        }
      },
    })
  }
}
