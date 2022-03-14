import { useEffect, useRef } from 'react'
import _ from 'lodash'

const { abs } = Math

function getElCenterPoint (el) {
  const rect = el.getBoundingClientRect()
  const { left, top, width, height } = rect
  return {
    x: left + width / 2,
    y: top + height / 2,
  }
}

export default function position () {
  const pointMap = {}
  const updateMap = {}

  const pos = {
    updatePosition () {
      _.forOwn(updateMap, (value, key) => {
        value()
      })
    },

    getNearestKey (pageX, pageY) {
      let nearestKey
      let diff = 999999
      Object.keys(pointMap).forEach((key) => {
        const point = pointMap[key]
        const diffX = abs(point.x - pageX)
        const diffY = abs(point.y - pageY)
        const length = diffX + diffY
        if (length < diff) {
          diff = length
          nearestKey = key
        }
      })
      return nearestKey
    },

    Position (props) {
      const { positionKey, updateKey } = props
      const ref = useRef()

      useEffect(() => {
        if (ref.current) {
          const update = () => {
            pointMap[positionKey] = getElCenterPoint(ref.current)
          }
          update()
          updateMap[positionKey] = update

          return () => {
            delete pointMap[positionKey]
            delete updateMap[positionKey]
          }
        }
      }, [ref.current])

      useEffect(() => {
        updateMap[positionKey]()
      }, [updateKey])

      return <div ref={ref} id={positionKey} />
    },
  }

  return pos
}
