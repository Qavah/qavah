import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Explorer from './pages/Explorer'
import ProjectInfo from './pages/ProjectInfo'
import Profile from './pages/Profile'

const container = document.getElementById('root')
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path='/'>
          <Route index element={<Navigate to='/42220' replace />} />
          <Route path=':chainId' element={<App />}>
            <Route index element={<Explorer />} />
            <Route path='new' element={<ProjectInfo create />} />
            <Route path=':projectId' element={<ProjectInfo />} />
            <Route path='user/:userAddress' element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
