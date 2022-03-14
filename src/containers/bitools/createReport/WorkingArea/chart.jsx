import { useContext } from 'react'
import ReactECharts from 'echarts-for-react'
import Context from '../Context'

function Chart () {
  const { state } = useContext(Context)
  const { previewData, defaultReportType, xAxis, yAxis } = state
  const { colList, pageInfo } = previewData

  const chartType = (defaultReportType) => {
    switch (defaultReportType) {
      case 'BAR':
        return 'bar'
      case 'LIN':
        return 'line'
    }
  }

  const data = pageInfo ? pageInfo.list : []
  const dimension = colList ? colList.find(e => e.colName === xAxis[0]) : []
  const indexs = colList ? colList.filter(e => yAxis.indexOf(e.colName) >= 0) : []

  const series = indexs.length
    ? indexs.map(e => ({
      type: chartType(defaultReportType),
      name: e.colAlias || e.colName,
      data: data.map(i => i[e.colName] || i[e.colAlias]),
      barMaxWidth: 30,
      label: {
        show: state.props.style.showGraphTag,
        position: 'top',
      },
    }))
    : []

  const legendPosition = (position) => {
    switch (position) {
      case 'TOP':
        return {
          x: 'center',
          y: 'top',
          orient: 'horizontal',
        }
      case 'DOWN':
        return {
          x: 'center',
          y: 'bottom',
          orient: 'horizontal',
        }
    }
  }

  const option = {
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
      show: state.props.style.showMap,
      ...legendPosition(state.props.style.mapPosition),
      data: colList ? colList.filter(i => yAxis.indexOf(i.colName) > -1).map(e => e.colAlias || e.colName) : [],
    },
    dataZoom: [
      {
        type: 'slider',
        show: state.props.style.showAbbreAxis,
        start: 0,
        end: 100,
      },
    ],
    xAxis: [
      {
        axisLine: {
          show: state.props.xAxisProp.showAxis,
        },
        axisTick: {
          show: state.props.xAxisProp.showAxis,
          alignWithLabel: true,
        },
        axisLabel: {
          show: state.props.xAxisProp.showTag,
        },
        name: state.props.xAxisProp.showTitle ? state.props.xAxisProp.title ? state.props.xAxisProp.title : dimension?.colAlias : '',
        nameLocation: 'middle',
        nameGap: 50,
        type: 'category',
        data: dimension ? data.map(e => (e[dimension.colAlias] || e[dimension.colName])) : [],
      },
    ],
    yAxis: {
      splitLine: {
        show: state.props.style.showGridlines,
      },
      axisLine: {
        show: state.props.yAxisPriProp.showAxis,
      },
      axisTick: {
        show: state.props.yAxisPriProp.showAxis,
      },
      axisLabel: {
        show: state.props.yAxisPriProp.showTag,
      },
      name: state.props.yAxisPriProp.showTitle
        ? state.props.yAxisPriProp.title
          ? state.props.yAxisPriProp.title
          : indexs.map(e => e.colAlias || e.colName).join('/')
            .slice(0, 20)
        : '',
      type: 'value',
    },
    series,
  }

  if (!colList) {
    return <div />
  }

  return (
    <ReactECharts option={option} notMerge style={{ height: 400 }} />
  )
}

export default Chart
