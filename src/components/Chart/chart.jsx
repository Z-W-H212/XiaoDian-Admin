import { useMemo, useRef, useEffect, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { Modal } from 'antd'
import SearchView from '../TableView/SearchView'

function Chart (props) {
  const { data, colList, onDrill, onAnchor, defaultReportType, chartProps, chartRef, xAxis, yAxis } = props

  const handleDrill = (key, value, row) => {
    onDrill && onDrill(key, value, row)
    Modal.destroyAll()
  }

  const handleAnchor = (colName, row, option) => {
    onAnchor && onAnchor(colName, row, option)
    Modal.destroyAll()
  }

  const chartType = (defaultReportType) => {
    switch (defaultReportType) {
      case 'BAR':
        return 'bar'
      case 'LIN':
        return 'line'
    }
  }

  const dimension = useMemo(() => (colList ? colList.find(e => e.colName === xAxis[0]) : []), [colList, xAxis])
  const indexs = useMemo(() => (
    colList ? colList.filter(e => yAxis.indexOf(e.colName) >= 0) : []
  ), [colList, yAxis])
  const series = useMemo(() => (
    colList
      ? indexs.map(e => ({
        type: chartType(defaultReportType),
        name: e.colAlias || e.colName,
        data: data.map(i => i[e.colName] || i[e.colAlias]),
        barMaxWidth: 30,
        label: {
          show: chartProps.style.showGraphTag,
          position: 'top',
        },
      }))
      : []
  ), [colList, indexs, defaultReportType, data, chartProps.style.showGraphTag])

  const legendPosition = (position) => {
    switch (position) {
      case 'TOP':
        return {
          x: 'center',
          y: 'top',
          orient: 'horizontal',
        }
      case 'RIGHT':
        return {
          x: 'right',
          y: 'center',
          orient: 'vertical',
        }
      case 'DOWN':
        return {
          x: 'center',
          y: 'bottom',
          orient: 'horizontal',
        }
      case 'LEFT':
        return {
          x: 'left',
          y: 'center',
          orient: 'vertical',
        }
    }
  }
  const option = {
    backgroundColor: '#fff',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '15%',
      right: '15%',
      top: '15%',
      bottom: '25%',
      containLabel: true,
    },
    legend: {
      type: 'scroll',
      show: chartProps.style.showMap,
      ...legendPosition(chartProps.style.mapPosition),
      data: colList ? colList.filter(i => yAxis.indexOf(i.colName) > -1).map(e => e.colAlias || e.colName) : [],
    },
    dataZoom: [
      {
        type: 'slider',
        show: chartProps.style.showAbbreAxis,
        start: 0,
        end: 100,
        // 如果图例和缩略图同时显示时并且图例在底部时需要让缩略图上移一点  避免重叠
        bottom: chartProps.style.showMap && chartProps.style.mapPosition === 'DOWN' ? 40 : 'auto',
      },
    ],
    xAxis: [
      {
        axisLine: {
          show: chartProps.xAxisProp.showAxis,
        },
        axisTick: {
          show: chartProps.xAxisProp.showAxis,
        },
        axisLabel: {
          show: chartProps.xAxisProp.showTag,
        },
        name: chartProps.xAxisProp.showTitle ? chartProps.xAxisProp.title ? chartProps.xAxisProp.title : dimension?.colAlias : '',
        nameLocation: 'middle',
        nameGap: 50,
        type: 'category',
        data: dimension ? data.map(e => (e[dimension.colAlias] || e[dimension.colName])) : [],
      },
    ],
    yAxis: {
      splitLine: {
        show: chartProps.style.showGridlines,
      },
      axisLine: {
        show: chartProps.yAxisPriProp.showAxis,
      },
      axisTick: {
        show: chartProps.yAxisPriProp.showAxis,
      },
      axisLabel: {
        show: chartProps.yAxisPriProp.showTag,
      },
      name: chartProps.yAxisPriProp.showTitle
        ? chartProps.yAxisPriProp.title
          ? chartProps.yAxisPriProp.title
          : indexs.map(e => e.colAlias || e.colName).join('/') // .slice(0, 20)  产品去掉限制
        : '',
      type: 'value',
    },
    series,
  }

  const onClick = useCallback((params) => {
    const row = data[params.dataIndex]
    const dimensionKey = dimension.colName
    const dimensionValue = row[dimensionKey]

    const indexCol = colList.find(e => e.colAlias === params.seriesName)
    const indexKey = indexCol.colName

    if (dimension.isDrill && indexCol.anchor) {
      Modal.info({
        title: `${params.seriesName}有两个操作`,
        content: (
          <div>
            <p><a onClick={handleDrill.bind(this, dimensionKey, dimensionValue, row)}><u>去下钻</u></a></p>
            {
              indexCol.anchor.length === 1
                ? <p><a onClick={handleAnchor.bind(this, indexKey, row, indexCol.anchor[0])}><u>去跳转</u></a></p>
                : indexCol.anchor.map((item, index) => (
                  <p key={index}>
                    <a onClick={handleAnchor.bind(this, indexKey, row, item)}>
                      <u>跳转{index + 1}: {item.targetName}</u>
                    </a>
                  </p>
                ))
            }
          </div>
        ),
        onOk () { },
      })
      return
    }

    if (dimension.isDrill) {
      handleDrill(dimensionKey, dimensionValue, row)
    } else if (indexCol.anchor) {
      handleAnchorBefore(indexCol.anchor, indexKey)
    } else if (dimension.anchor) {
      handleAnchorBefore(dimension.anchor, dimensionKey)
    }

    function handleAnchorBefore (anchor, key) {
      if (anchor.length > 1) {
        Modal.info({
          title: `${params.seriesName}有${anchor.length}个跳转`,
          content: (
            <div>
              {
                anchor.map((item, index) => (
                  <p key={index}>
                    <a onClick={handleAnchor.bind(this, key, row, item)}>
                      <u>跳转{index + 1}: {item.targetName}</u>
                    </a>
                  </p>
                ))
              }
            </div>
          ),
          onOk () { },
        })
      } else {
        handleAnchor(key, row, anchor[0])
      }
    }
  }, [colList, data, dimension])

  const echartRef = useRef()
  const onEvents = {
    click: onClick,
  }

  const downloadDataURL = async (base64) => {
    const blob = await fetch(base64).then(res => res.blob())
    const downloadElement = document.createElement('a')
    const href = window.URL.createObjectURL(blob)
    downloadElement.href = href
    downloadElement.download = `config-${Date.now()}.png`
    document.body.appendChild(downloadElement)
    downloadElement.click()
    document.body.removeChild(downloadElement)
    window.URL.revokeObjectURL(href)
  }

  useEffect(() => {
    if (chartRef) {
      chartRef.current = {
        captureImage () {
          const echartInstance = echartRef.current.getEchartsInstance()
          const base64 = echartInstance.getDataURL()
          downloadDataURL(base64)
        },
      }
    }
  }, [chartRef])

  return (
    <>
      <SearchView {...props} />
      <ReactECharts
        ref={(e) => { echartRef.current = e }}
        option={option}
        onEvents={onEvents}
        style={{ height: 500 }}
        lazyUpdate
      />
      {
        data.length >= 1000 && <div style={{ color: '#999', fontSize: 12, textAlign: 'center' }}>(仅展示前1000条数据)</div>
      }
    </>
  )
}

export default Chart
