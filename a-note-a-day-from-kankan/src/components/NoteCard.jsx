import React, { useEffect } from 'react'
import "../styles/NoteCard.css"
import Date from "../assets/date.png"
import { useNotesContext } from '../contexts/NotesContext'
const NoteCard = () => {
    const { todaysNote, today} = useNotesContext();


  return (
    <div className='note-card'>
        <div className="date-container">
          <div className="date">
          
            <div className='date-text'><img src={Date} alt="" /> {today}</div> 
            <div style={{ "float": "right"}}>With love ❤️</div>
          </div>
        </div>
     
    <p>
     {todaysNote}
    </p>
    <div className="footer">- Kankan</div>
    </div>
  )
}

export default NoteCard
