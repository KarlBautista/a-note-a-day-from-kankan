import React from 'react'
import "../styles/MainPage.css"
import NoteCard from './NoteCard'
const MainPage = () => {
  return (
    <div className='main-page'>
        <h1>♡ A Note a Day From Kankan ♡</h1>
        <h2>Because every day with you ganing is special</h2>
        <NoteCard />
      
    </div>
  )
}

export default MainPage
