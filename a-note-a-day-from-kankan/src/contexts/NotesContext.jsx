import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../services/supabaseClient";

const NotesContext = createContext();

export const useNotesContext = () => useContext(NotesContext);

export const NotesProvider = ({ children }) => {

    const [ notes, setNotes ] = useState([]);
    const [ todaysNote, setTodaysNote ]= useState("");
    const [ today, setToday ] = useState("");



 



 const fetchNotes = async () => {
        const { data, error } = await supabase.from("notes").select("*");
        if(error) throw error;
        return data;
    }

    const { data, isLoading, error } = useQuery({ 
        queryKey: ["notes"],
        queryFn: fetchNotes,
    })
    useEffect(() => {
        if(data) setNotes(data);
    }, [data])


       console.log(notes)
    useEffect(() => {
        const today = new Date();
        const startDate = new Date("2025-08-31"); // first day to start notes
        const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const index = daysPassed % notes.length;
        console.log(index);
        const note = notes[index];
        if(note && note.message){
            setTodaysNote(note.message);
         
        }

       setToday(formatDate(today));
      
    }, [notes])

      console.log(todaysNote)
    

    

    const formatDate = (date) => {
        const day = date.getDate();
        const month = date.toLocaleString("default", { month: "long" }); // "August"
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`
    }

   const value = {
    notes,
    todaysNote,
    today,
  
   }

   return(
    <NotesContext.Provider value={value}>
        { children }
    </NotesContext.Provider>
   )
    
}