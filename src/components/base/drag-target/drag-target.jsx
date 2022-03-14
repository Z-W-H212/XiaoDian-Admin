import { useMemo } from 'react'
import { useDrag } from 'react-dnd'
import Target from '@/components/base/Target'

export default function DragTarget (props) {
  const { dragType, id, highlight, ...arg } = props
  const [{ isDragging }, drag] = useDrag({
    item: { type: dragType, id },
    collect (monitor) {
      return {
        isDragging: monitor.isDragging(),
      }
    },
  })
  const children = useMemo(() => {
    if (dragType) {
      return (
        <div ref={drag}>
          <Target {...arg} isDragging={isDragging} highlight={highlight} />
        </div>
      )
    }
    return <Target {...arg} />
  }, [dragType, isDragging, highlight])

  return children
}
