import { useState } from 'react'
import Items from './Items'
import Dashboard from './Dashboard'
import './App.css'

const STORAGE_KEY = 'api_key'

type Page = 'items' | 'dashboard'

/**
 * Main App component with navigation between Items and Dashboard pages.
 */
function App() {
  const [currentPage, setCurrentPage] = useState<Page>('items')
  const [token, setToken] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? '',
  )

  function handleDisconnect() {
    localStorage.removeItem(STORAGE_KEY)
    setToken('')
  }

  // If no token, show connection form (handled by Items component)
  if (!token) {
    return <Items token={token} onDisconnect={handleDisconnect} />
  }

  return (
    <div className="app">
      {/* Navigation Header */}
      <header className="nav-header">
        <nav className="nav-menu">
          <button
            className={`nav-button ${currentPage === 'items' ? 'active' : ''}`}
            onClick={() => setCurrentPage('items')}
          >
            Items
          </button>
          <button
            className={`nav-button ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            Dashboard
          </button>
        </nav>
        <button className="btn-disconnect" onClick={handleDisconnect}>
          Disconnect
        </button>
      </header>

      {/* Page Content */}
      <main className="page-content">
        {currentPage === 'items' && (
          <Items token={token} onDisconnect={handleDisconnect} />
        )}
        {currentPage === 'dashboard' && <Dashboard />}
      </main>
    </div>
  )
}

export default App
