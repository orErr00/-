import { useState } from 'react'
import ModeSwitcher from './components/ModeSwitcher/ModeSwitcher'
import LayoutEditor from './components/LayoutEditor/LayoutEditor'
import './App.css'

function App() {
  const [content, setContent] = useState('')
  const [style, setStyle] = useState('simple')

  return (
    <div className="app">
      <ModeSwitcher />
      <LayoutEditor
        content={content}
        onContentChange={setContent}
        activeStyle={style}
        onStyleChange={setStyle}
      />
    </div>
  )
}

export default App
