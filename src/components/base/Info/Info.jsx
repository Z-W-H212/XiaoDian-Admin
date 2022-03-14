import { InfoCircleFilled } from '@ant-design/icons'
import { Modal } from 'antd'
import style from './style.module.less'

export default function Desc (props) {
  const { data } = props

  const onClick = () => {
    Modal.info({
      title: '描述',
      content: data,
      onOk () {},
    })
  }

  return (
    <span className={style.descIcon} onClick={onClick}>
      <InfoCircleFilled />
    </span>
  )
}
