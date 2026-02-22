//Global Variable
const API_URL = 'http://localhost:8080/api/notes';
let currentNoteId = null;
let currentNote = null;
let autoSaveTimer = null;
let isSaving = false;

//load notes at the start
document.addEventListener('DOMContentLoaded', loadNotes);


// Function to load notes from the API and display them in the DOM
function loadNotes() {
    //Fetch notes from the API
    fetch(API_URL)
        //Convert the response to JSON
        .then(response => response.json())
        //Modify the notes list in the DOM
        .then(notes => {
            // Get the notes list element
            const notesList = document.getElementById('notesList');
            // Clear the existing notes list
            notesList.innerHTML = '';
            // Loop through the notes and create list items for each note
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

                    dropDown.classList.remove('show');  // ✅ close immediately
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
        note.title = newTitle;

        if(currentNoteId === note.id){
            currentNote.title = note.title;
        }

        //Create new span to swap back again
        const span = document.createElement('span');
        span.textContent = newTitle;
        span.classList.add('truncate');
        // span.addEventListener('click', () => enableRename(span,note));

        input.replaceWith(span);

        fetch(`${API_URL}/${note.id}`,{
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                title: newTitle,
                content: content
            })
        });

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
        .then(response => response.json())
        .then(note => {
            // document.getElementById("noteTitle").value = note.title;
            document.getElementById("noteContent").value = note.content;

            currentNoteId = note.id;
            currentNote = note;
        })
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
    document.getElementById("noteContent").value = "";
    currentNoteId = null;
    currentNote = null;
    newNoteElement = document.getElementById("newNote");
    highlightSelected(newNoteElement);
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

function saveNote(){

    //prevent duplicate saving
    if(isSaving)
        return;
    isSaving = true;

    const content = contentInput.value;

    // Use the existing note's title if editing, or default for new note
    let finalTitle;

    if (currentNoteId === null) {
        // New note → default to "Untitled new note" if no title
        finalTitle = currentNote?.title?.trim() || "Untitled new note";
    } else {
        // Existing note → take the title from the note object
        finalTitle = currentNote.title;
    }

    if(currentNoteId===null){

        fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            // assign 
            body: JSON.stringify({
                title: finalTitle,
                content
            })
        })
        .then(response => response.json())
        .then(newNote => {
            currentNoteId = newNote.id;
            loadNotes();
        }).finally(()=>{
            isSaving = false;
        })
    }
    else{
        fetch(`${API_URL}/${currentNoteId}`,{
            method: "PUT",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                title: finalTitle,
                content
            })
        })
        .then(response=>response.json())
        .then(updatedNote => {
            console.log("Note updated");
            // loadNotes();
        })
        .finally(()=>{
            isSaving = false;
        });
    }
}
//<------------------------------------------------>