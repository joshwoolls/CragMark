import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

export default {
  async fetch(request, env, ctx) {
    return new Response('Hello World')
  },
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
