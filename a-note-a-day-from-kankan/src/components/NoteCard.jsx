import React from 'react'
import "../styles/NoteCard.css"
import Date from "../assets/date.png"
const NoteCard = () => {
  return (
    <div className='note-card'>
        <div className="date-container">
          <div className="date">
          
            <div className='date-text'><img src={Date} alt="" />  08/31/2025</div> 
            <div style={{ "float": "right"}}>With love ❤️</div>
          </div>
        </div>
     
    <p>
      My dearest, today I want to remind you how much you mean to me. Your smile brightens even my darkest days, and your love gives me strength I never knew I had. Forever yours, Kankan
    </p>
    <div class="footer">- Kankan</div>
    </div>
  )
}

export default NoteCard
