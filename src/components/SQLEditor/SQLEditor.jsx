import { useEffect, useRef, useCallback } from 'react'
import MonacoEditor from 'react-monaco-editor'
import Autocomplete from './autocomplete'
import { getAllDatabase } from '@/services/databaseService'
// 解决语法高亮问题
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution'

const SQLEditor = (props) => {
  const { language, width, height, value, onChange, fieldList, dbName } = props
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const completionRef = useRef(null)

  const getDatabases = useCallback(async () => {
    const result = await getAllDatabase({ type: 4 })
    return Object.keys(result).map(e => ({
      dbName: e,
      tables: result[e].map(i => ({ tblName: i.tableName, tableColumns: [] })),
    }))
  }, [])

  // 注册提示器
  const registerCompletion = useCallback(async (monaco) => {
    const getColumns = () => {
      return fieldList.map(e => ({
        columnName: e.colName,
        commentName: e.colDesc,
        columnType: e.colType,
        dbName,
      }))
    }

    const autocomplete = new Autocomplete(monaco, ['@{data_filter}', '@{organization}', '@{order_by} ', '@{children_org}'], getColumns, null, await getDatabases())
    completionRef.current = monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: [' ', '.'],
      provideCompletionItems: (model, position) =>
        autocomplete.provideCompletionItems(model, position),
    })
  }, [dbName, fieldList, getDatabases])

  const updateDimensions = () => {
    editorRef.current.layout()
  }

  const editorDidMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    window.addEventListener('resize', updateDimensions)
  }

  const editorUnmount = () => {
    if (completionRef.current) {
      completionRef.current.dispose()
    }
    window.removeEventListener('resize', updateDimensions)

    // if (editorRef.current) {
    //   editorRef.current.dispose()
    //   const model = editorRef.current.getModel()
    //   if (model) {
    //     model.dispose()
    //   }
    // }
  }

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      registerCompletion(monacoRef.current)
    }

    return () => editorUnmount()
  }, [registerCompletion])

  return (
    <MonacoEditor
      width={width}
      height={height}
      language={language}
      theme="vs-light"
      value={value}
      options={{
        minimap: {
          enabled: false,
        },
      }}
      onChange={onChange}
      editorDidMount={editorDidMount}
    />
  )
}

export default SQLEditor
