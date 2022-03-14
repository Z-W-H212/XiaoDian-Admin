import { useMemo, useContext, useEffect } from 'react'
import { useDrop, useDrag } from 'react-dnd'

import { DeleteOutlined, SwapOutlined } from '@ant-design/icons'
import Report from '@/components/Report'
import Context from '../Context'

import { getReportConfig } from '@/services/reportService'

import style from './style.module.less'

export default function Block (props) {
  const { data } = props
  const { dispatch } = useContext(Context)
  const [, drop] = useDrop({
    accept: ['resource'],
    drop (item) {
      const { id, mode, ...arg } = item
      dispatch({
        type: mode === 'cut' ? 'cutResource' : 'addResource',
        payload: { ...arg, id, sequence },
      })
    },
  })

  const { id, sequence, width } = data

  useEffect(() => {
    const fetch = async () => {
      const data = await getReportConfig({ id })
      dispatch({
        type: 'addReportConfig',
        payload: {
          id,
          data,
        },
      })
    }
    id && fetch()
  }, [id, sequence])

  const onDel = (sequence) => {
    dispatch({
      type: 'delResource',
      payload: {
        sequence,
      },
    })
  }

  const children = useMemo(() => {
    if (!id) {
      return null
    }
    return <Resource id={id} sequence={sequence} />
  }, [id, sequence])

  return (
    <div ref={drop} className={style.block} style={{ width: `${width}%` }}>
      <div className={style.blockBorder}>
        {children}
      </div>
      <div className={style.tools}>
        <DeleteOutlined onClick={() => onDel(sequence)} />
      </div>
      <Rocker sequence={sequence} />
    </div>
  )
}

function Resource (props) {
  const { id, sequence } = props
  const [{ isDragging }, drag] = useDrag({
    item: { type: 'resource', mode: 'cut', id, originSequence: sequence },
    collect (monitor) {
      return {
        isDragging: monitor.isDragging(),
      }
    },
  })

  return (
    <div ref={drag} style={{ opacity: +!isDragging }}>
      <Report key={id} id={id} />
    </div>
  )
}

function Rocker (props) {
  const { sequence } = props
  const { dispatch } = useContext(Context)

  const onClick = () => {
    dispatch({
      type: 'changeBlock',
      payload: { sequence },
    })
  }

  return (
    <div className={style.rocker} onClick={onClick}>
      <SwapOutlined />
    </div>
  )
}
