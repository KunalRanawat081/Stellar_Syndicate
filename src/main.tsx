import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'
import './index.css'
import { WalletProvider } from './context/WalletContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ThemeProvider>
    {/* Vercel Analytics: auto-tracks pageviews and Web Vitals on production.
        Rendered outside the Router so it captures every route change. */}
    <Analytics />
  </React.StrictMode>,
)

