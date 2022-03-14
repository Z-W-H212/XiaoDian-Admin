import { Children, PureComponent } from 'react'
import style from './style.module.less'

export default function Tools (props) {
  return (
    <div {...props}>
      <div className={style.tools}>
        {Children.map(props.children, (child, i) => {
          return child && child.type.dispalyName === 'Right' ? child : <div key={i} className={style.item}>{child}</div>
        })}
      </div>
    </div>
  )
}

class Right extends PureComponent {
  render () {
    return (
      <div className={style.right}>
        {Children.map(this.props.children, (child, i) => {
          return <div key={i} className={style.item}>{child}</div>
        })}
      </div>
    )
  }
}

Right.dispalyName = 'Right'

Tools.Right = Right
