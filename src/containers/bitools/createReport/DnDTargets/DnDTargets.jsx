import { useMemo } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import position from '@/utils/position'
import style from './style.module.less'

const { getNearestKey, Position } = position()

export default function DnDTargets (props) {
  const { targetType, layout, data, renderTarget, joinIcon } = props

  const [, drop] = useDrop({
    accept: [targetType],
    drop (item, monitor) {
      const { x, y } = monitor.getClientOffset()
      const key = getNearestKey(x, y)
      const dragKey = item.key
      const dropKey = key

      const list = data.filter(item => item.key !== dragKey).map(item => item.key)
      const index = list.indexOf(dropKey)
      list.splice(index + 1, 0, dragKey)

      props.onMove && props.onMove(list)
    },
  })

  const children = useMemo(() => {
    const icon = joinIcon ? <div className={style.joinIcon}>{joinIcon}</div> : null
    const list = data.map((item, i) => {
      return (
        <div key={item.key} className={style.target}>
          {i > 0 ? icon : null}
          <TargetDrag targetType={targetType} data={item} renderTarget={renderTarget} />
          <Position positionKey={item.key} updateKey={i++} />
        </div>
      )
    })
    if (list.length === 0) {
      return null
    }

    return list
  }, [data, joinIcon])

  const title = useMemo(() => {
    if (!props.title) {
      return null
    }
    return <div className={style.label}>{props.title}</div>
  }, [props.title])

  const styleOption = useMemo(() => {
    const style = {
      flexDirection: layout === 'column' ? 'column' : 'row',
    }
    return style
  }, [layout])

  return (
    <div className={style.dndTargets}>
      {title}
      <div ref={drop} className={style.dndPanel} style={styleOption}>
        {children}
      </div>
    </div>
  )
}

function TargetDrag (props) {
  const { targetType, data, renderTarget } = props
  const [{ isDragging }, drag] = useDrag({
    item: { ...data, type: targetType },
    collect (monitor) {
      return {
        isDragging: monitor.isDragging(),
      }
    },
  })

  const children = useMemo(() => {
    return renderTarget(data, isDragging)
  }, [data, isDragging])

  return (
    <div ref={drag} className={style.drag}>
      {children}
    </div>
  )
}
