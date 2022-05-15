import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ApolloProvider } from '@apollo/client'
import { client } from './graphql'
import App from './App'
import ProjectInfo from './pages/ProjectInfo'
import NewProject from './pages/NewProject'
import Profile from './pages/Profile'

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <Routes>
          <Route path="/">
            <Route index element={<Navigate to="/44787" replace />} />
            <Route path=":chainId" element={<App />}>
              <Route path="new" element={<NewProject />} />
              <Route path=":projectId" element={<ProjectInfo />} />
              <Route path="user/:userAddress" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
