import { useState } from 'react'
import MainPage from './components/MainPage'
import './App.css'
import { NotesProvider } from './contexts/NotesContext'
function App() {


  return (
    <>
    <NotesProvider>
       <MainPage />
    </NotesProvider>
   
     
    </>
  )
}

export default App
