//Global Variable
const API_URL = 'http://localhost:8080/api/notes';
const STORAGE_KEY = "spring_web_notes";
let currentNoteId = null;
let currentNote = null;
let autoSaveTimer = null;
let isSaving = false;

//load notes at the start
document.addEventListener('DOMContentLoaded', loadNotes);

function getLocalNotes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveLocalNotes(notes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// Function to load notes from the API/Localstorage and display them in the DOM
async function loadNotes() {
    let notes = [];

    try{
    //Await fetch notes from backend API if available
        const response = await(fetch(API_URL))
        
        if(!response.ok){
            throw new Error("Backend not available");
        }
        notes = await response.json();
        console.log("Loaded from backend");
    }catch(error){
        console.log("Backend failed, loading from localStorage");
        notes = getLocalNotes();
    }

    renderNotes(notes);
}

function renderNotes(notes){

            const notesList = document.getElementById('notesList');
            notesList.innerHTML = '';
            notes.forEach(note => {
                const li = document.createElement('li');
                li.classList.add('note-item');
                li.style.cursor = "pointer";
                li.dataset.id = note.id;


                // Title of the note
                const title = document.createElement('span');
                title.textContent = note.title;
                title.classList.add(`truncate`);

                // Drop down menu
                const dropDown = document.createElement(`div`);
                dropDown.classList.add('dropdown');
                dropDown.innerHTML = `
                    <div class="dropdown-item edit-item">Edit Title</div>
                    <div class="dropdown-item delete-item">Delete</div>
                `;

                // Menu button
                const menuBtn = document.createElement(`button`);
                menuBtn.textContent = '...';
                // for CSS
                menuBtn.classList.add('menu-btn');
                
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();

                    document.querySelectorAll('.dropdown').forEach(d=>{
                        d.classList.remove('show');
                    })

                    dropDown.classList.toggle('show');
                })

                
                dropDown.querySelector('.edit-item').addEventListener('click',(e)=>{
                    e.stopPropagation();

                    dropDown.classList.remove('show');
                    const currentTitleElement = li.querySelector('span');
                    enableRename(currentTitleElement,note);
                })
                
                dropDown.querySelector('.delete-item').addEventListener('click',(e)=>{
                    e.stopPropagation();
                    deleteNotes(note.id);
                })

                //prevention of notes from loading when you click on dropdown menu and or the button
                li.addEventListener("click",(e) => {
                    if(e.target.closest('.menu-btn') || e.target.closest('.dropdown')) return;

                    //Load the note you selected on the left and highlight it
                    loadIntoNoteEditor(note);
                    highlightSelected(li);
                });

                li.appendChild(title);
                li.appendChild(menuBtn);
                li.appendChild(dropDown);

                notesList.appendChild(li);
            });
}

//Event listener for dropdown menu
document.addEventListener('click',()=>{
    document.querySelectorAll('.dropdown').forEach(d=>d.classList.remove('show'));
});

//Edit title of note
function enableRename(titleElement, note){

    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = note.title;
    input.classList.add('rename-input');

    //Replace title with input
    titleElement.replaceWith(input);
    input.focus();
    input.select();

    //Save on enter
    input.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){
            finishRename(input,note);
        }
    })

    input.addEventListener('blur',finishRename);

    function finishRename(){
        if(!input.parentNode){
            return;
        }

        const newTitle = input.value.trim() || "Untitled new note";

        if(currentNoteId === note.id){
            currentNote.title = newTitle;
        }

        //Create new span to swap back again
        const span = document.createElement('span');
        span.textContent = newTitle;
        span.classList.add('truncate');
        input.replaceWith(span);

        fetch(`${API_URL}/${note.id}`,{
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                title: newTitle,
                content: note.content || ""
            })
        }).then(() => loadNotes());
    }
}

function saveRename(inputElement, note){
    const newTitle = inputElement.value.trim();

    note.title = newTitle;

    const span = document.createElement('span');
    span.textContent = newTitle;
    span.classList.add('truncate');
    inputElement.replaceWith(span);

    span.addEventListener('click', ()=>enableRename(span, note));

    if(currentNoteId === note.id){
        currentNote.title = newTitle;
    }

    fetch(`${API_URL}/${note.id}`,{
        method: 'PUT',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({title: newTitle})
    });
}

//swap rename textbox with text selection again
function createTitleSpan(text){
    const span = document.createElement('span');
    span.textContent = text;
    span.classList.add('note-title');
    return span;
}
//<------------------------------------------------>

//Edit button for each note in notes list
function loadIntoNoteEditor(note) {
    fetch(`${API_URL}/${note.id}`)
        .then(response => {
            if(!response.ok) throw new Error();
            return response.json()})
        .then(note => {
            document.getElementById("noteContent").value = note.content;
            currentNoteId = note.id;
            currentNote = note;
        }).catch(() => {
            //local storage fallback
            const notes = getLocalNotes();
            const foundNote = notes.find(n => n.id === note.id);
            if(foundNote){
                document.getElementById("noteContent").value = foundNote.content;
                currentNoteId = foundNote.id;
                currentNote = foundNote;
            }
        });
}

function highlightSelected(selectedElement) {
    document.querySelectorAll('#notesList li, #newNote')
        .forEach(li=>li.classList.remove('active-note'));

    selectedElement.classList.add('active-note');
}
//<------------------------------------------------>

// To create new notes
document.getElementById('newNote').addEventListener('click', newNotes);

function newNotes(){
    clearTimeout(autoSaveTimer); // Stop pending saves
    contentInput.value = "";     // Clear the editor
    currentNoteId = null;
    currentNote = null;
    highlightSelected(document.getElementById("newNote"));
}
//<------------------------------------------------>

function deleteNotes(id) {
    fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    })
    .then(() => loadNotes());
}
//<------------------------------------------------>


const panel = document.getElementById("sidePanel");
const toggleBtn = document.getElementById("panelToggle");

toggleBtn.addEventListener("click", () => {
    //Change sidePanel to sidePanel.open
    panel.classList.toggle("open");
})

document.addEventListener('click',(e)=> {
        if(!panel.contains(e.target)){
            panel.classList.remove("open");
        }
})
//<------------------------------------------------>

//For note retraction
const notesToggle = document.getElementById('notesToggle');
const notesList = document.getElementById('notesList');

notesToggle.addEventListener("click",()=>{

    notesList.classList.toggle("hidden");

    if(notesList.classList.contains("hidden")){
        notesToggle.textContent = "Your notes ▼";
    }
    else{
        notesToggle.textContent = "Your notes ▲";
        loadNotes();
    }
})
//<------------------------------------------------>

//For auto save when user stops typing
const contentInput = document.getElementById("noteContent");

function triggerAutoSave(){
    clearTimeout(autoSaveTimer);

    autoSaveTimer = setTimeout(()=> {
        saveNote();
    },800) //800ms
}

contentInput.addEventListener("input",triggerAutoSave)

async function saveNote() {
    if (isSaving) {
        triggerAutoSave(); 
        return;
    }

    const content = contentInput.value.trim();
    if (currentNoteId === null && content === "") return;

    isSaving = true;
    
    const isNewNote = (currentNoteId === null);
    let finalTitle = currentNote?.title || "Untitled new note";

    if (isNewNote && content.length > 0) {
        const lines = content.split('\n');
        if (lines[0].trim().length > 0) {
            finalTitle = lines[0].substring(0, 30); // Use first 30 chars
        }
    }

    const notePayload = {
        title: finalTitle,
        content: contentInput.value
    };

    try {
        let response;
        if (isNewNote) {
            response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(notePayload)
            });
        } else {
            response = await fetch(`${API_URL}/${currentNoteId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...notePayload, id: currentNoteId })
            });
        }

        if (response.ok) {
            const savedNote = await response.json();
            
            currentNoteId = savedNote.id;
            currentNote = savedNote;

            // Only refresh the sidebar list if it's a brand new note
            if (isNewNote) {
                await loadNotes();
            }
        } else {
            throw new Error(`Backend Error: ${await response.text()}`);
        }
    } catch (error) {
        console.error("Backend failed, saving to local storage", error);
        handleLocalFallback(isNewNote, finalTitle, content);
    } finally {
        isSaving = false;
    }
}

function handleLocalFallback(isNewNote, title, content) {
    let notes = getLocalNotes();

    if (isNewNote && currentNoteId === null) {
        currentNoteId = Date.now(); 
        currentNote = { id: currentNoteId, title: title, content: content };
    }

    const localPayload = {
        id: currentNoteId,
        title: title,
        content: content
    };

    const index = notes.findIndex(n => n.id === currentNoteId);
    if (index >= 0) {
        notes[index] = localPayload;
    } else {
        notes.push(localPayload);
    }

    saveLocalNotes(notes);
    
    // Only refresh the sidebar list if it's a brand new note
    if (isNewNote) {
        renderNotes(notes);
    }
}
//<------------------------------------------------>