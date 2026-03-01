//Global Variable
const API_URL = 'http://localhost:8080/api/notes';
const STORAGE_KEY = "spring_web_notes";
let autoSaveTimer = null;
let currentBoardId = null;
let allBoards = [];
let lastMousePos = { x: 0, y: 0 };
const boardMenu = document.getElementById('boardContextMenu');

document.addEventListener('DOMContentLoaded', initializeApp);

function getLocalNotes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

//Event listener for dropdown menu
document.addEventListener('click',()=>{
    document.querySelectorAll('.dropdown').forEach(d=>d.classList.remove('show'));
});

//Edit title of note
function enableRename(titleElement, board){

    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = board.boardName;
    input.classList.add('rename-input');

    //Replace title with input
    titleElement.replaceWith(input);
    input.focus();
    input.select();

    const finishRename = async () => {
        if(!input.parentNode){
            return;
        }

        const newName = input.value.trim() || "Untitled new note";

        board.boardName = newName;
        board.updatedAt = Date.now();

        //Create new span to swap back again
        const span = document.createElement('span');
        span.textContent = newName;
        span.classList.add('truncate');

        input.replaceWith(span);

        showStatus("Renaming board...");

        localStorage.setItem(STORAGE_KEY, JSON.stringify(allBoards));

        try{
            await fetch(`${API_URL}/${board.id}`,{
                method: `PUT`,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(board)
            });
            showStatus("Board renamed");
        }catch(error){
            showStatus("Saved locally offline");
        }finally{
            hideStatus();
            renderSidebar();
        }
    };

    // Save on enter
    input.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){
            input.blur();
        }
        if(e.key === 'Escape'){
            const span = document.createElement('span');
            span.textContent = board.boardName;
            span.classList.add('truncate');
            input.replaceWith(span);
        }
    })

    input.addEventListener('blur',finishRename);

}
//<------------------------------------------------>

function highlightSelected(selectedElement) {

    document.querySelectorAll('#boardList li, #newNote')
        .forEach(li=>li.classList.remove('active-note'));

    selectedElement.classList.add('active-note');
}
//<------------------------------------------------>

const newNoteBtn = document.getElementById('newNote');
if (newNoteBtn) {
    newNoteBtn.addEventListener('click', addNewNoteToCurrentBoard);
}

const newBoardBtn = document.getElementById('newBoardBtn');
if (newBoardBtn) {
    newBoardBtn.addEventListener('click', createNewBoard);
}

function addNewStickyNote() {
    if (!currentBoardId) {
        alert("Please select or create a board first!");
        return;
    }
    const board = allBoards.find(b => b.id === currentBoardId);
    const newNote = {
        id: Date.now(),
        content: "",
        x: 100,
        y: 100
    };
    board.notes.push(newNote);
    renderNotesOnBoard(board.notes);
    triggerAutoSave();
}
//<------------------------------------------------>

function deleteStickyNote(noteId) {
    const board = allBoards.find(b => b.id === currentBoardId);
    if (!board) return;

    // Filter out the note
    board.notes = board.notes.filter(n => n.id !== noteId);
    
    // Refresh UI and Sync
    renderNotesOnBoard(board.notes);
    triggerAutoSave();
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
//For board retraction
const boardListToggle = document.getElementById('boardListToggle');
const boardList = document.getElementById('boardList');

boardListToggle.addEventListener("click",()=>{

    boardList.classList.toggle("hidden");

    if(boardList.classList.contains("hidden")){
        boardListToggle.textContent = "Your boards ▼";
    }
    else{
        boardListToggle.textContent = "Your boards ▲";
        renderSidebar();
    }
})
//<------------------------------------------------>
function showStatus(message){
const el = document.getElementById("statusIndicator");
    if (el) {
        el.textContent = message;
        el.classList.add("active");
    }
}

function hideStatus(delay = 1000){ 
    setTimeout(() => {
        document.getElementById("statusIndicator").classList.remove("active");
    }, delay);
}
//<------------------------------------------------>
//Boards
async function initializeApp() {
    const localData = localStorage.getItem(STORAGE_KEY);
    if(localData){
        allBoards = JSON.parse(localData);
        renderSidebar();
        if (allBoards.length > 0) switchBoard(allBoards[0].id);
    }
    await syncWithBackend();
}

async function syncWithBackend(){
    showStatus("Syncing...");
    try{
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Server unreachable");
       const backendBoards = await response.json();
        
        // Simple Sync Logic: Compare the latest timestamp across all boards
        const localTime = Math.max(...allBoards.map(b => b.updatedAt || 0), 0);
        const backendTime = Math.max(...backendBoards.map(b => b.updatedAt || 0), 0);

        if (backendTime > localTime) {
            console.log("Backend is newer. Updating local copy.");
            allBoards = backendBoards;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allBoards));
            renderSidebar();
            if (currentBoardId) switchBoard(currentBoardId);
        } 
        else if (localTime > backendTime || backendBoards.length === 0) {
            console.log("Local is newer. Pushing to backend.");
            await pushAllToBackend();
        }
        
        showStatus("Synced");
    } catch (error) {
        console.warn("Offline mode: using local data only.");
        showStatus("Backend Offline");
    } finally {
        hideStatus();
    }
}

// Helper to push everything if local is ahead
async function pushAllToBackend() {
    try {
        await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allBoards)
        });
    } catch (e) { console.error("Sync push failed", e); }
}

function triggerAutoSave() {
    clearTimeout(autoSaveTimer);
    
    autoSaveTimer = setTimeout(async () => {
        
        const board = allBoards.find(b => b.id === currentBoardId);
        if (board) board.updatedAt = Date.now();

        localStorage.setItem(STORAGE_KEY, JSON.stringify(allBoards));

        showStatus("Syncing...");
        await pushAllToBackend();
        hideStatus();
    }, 1000);
}


async function loadBoards(){
    try{
        const response = await fetch(`${API_URL}/boards`);
        allBoards = await response.json();
        renderSidebar();

        if(allBoards.length > 0 && !currentBoardId){
            switchBoard(allBoards[0].id);
        }
    }catch(error){
        
        console.error("Cannot load board");
    }
}

function renderSidebar(){
    const list = document.getElementById("boardList");

    if (!list) return;

    list.innerHTML = '';

    allBoards.forEach(board => {
        const li = document.createElement('li');
        li.classList.add('board-item');
        li.classList.toggle('active-note', board.id === currentBoardId);

        if(board.id === currentBoardId){
            li.classList.add('active-note');
        }

        const titleSpan = document.createElement('span');
        titleSpan.textContent = board.boardName;
        titleSpan.classList.add('truncate');

        const menuBtn = document.createElement('button');
        menuBtn.textContent = '...';
        menuBtn.classList.add('menu-btn');

        const dropDown = document.createElement('div');
        dropDown.className = 'dropdown';
        dropDown.innerHTML = `
            <div class="dropdown-item edit-board">Rename Board</div>
            <div class="dropdown-item delete-board">Delete Board</div>
        `;
        
        dropDown.querySelector('.edit-board').onclick = (e) => {
            e.stopPropagation();

            dropDown.classList.remove('show');
            enableRename(titleSpan, board);
        };

        dropDown.querySelector('.delete-board').onclick = (e) => {
            e.stopPropagation();
            deleteBoard(board.id);
        };

        menuBtn.onclick = (e) => {
            e.stopPropagation();
            
            const isAlreadyOpen = dropDown.classList.contains('show');
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('show'));
            if (!isAlreadyOpen) {
                dropDown.classList.add('show');
            }
        }

        li.onclick = (e) => {
            if (e.target.tagName !== 'INPUT') { // Don't switch if typing

                const boardExists = allBoards.some(b => b.id === board.id);

                if(boardExists && e.target.tagName !== 'INPUT' && !e.target.classList.contains('menu-btn')){
                    switchBoard(board.id);
                }
            }
        };
        
        li.appendChild(titleSpan);
        li.appendChild(menuBtn); // Added: Actually put the button in the list
        li.appendChild(dropDown); // Added: Actually put the dropdown in the list
        list.appendChild(li);
    });
}

function switchBoard(boardId){
    currentBoardId = boardId;
    const selectedBoard = allBoards.find(b=>b.id===boardId);
    if (!selectedBoard) return;

    renderSidebar();
    renderNotesOnBoard(selectedBoard.notes);
}

function renderNotesOnBoard(notes){
    const boardCanvas = document.getElementById("bulletinBoard");
    if (!boardCanvas) return;
    boardCanvas.innerHTML = '';

    notes.forEach(note => {
        const sticky = createStickyElement(note);
        boardCanvas.appendChild(sticky);
    });
}

function createStickyElement(note){
    const sn = document.createElement('div');
    sn.className = 'sticky-note';

    sn.style.width = note.width ? `${note.width}px` : '200px';
    sn.style.height = note.height ? `${note.height}px` : '200px';
    sn.style.left = `${note.x}px`;
    sn.style.top = `${note.y}px`;

    sn.innerHTML = `
        <div class = delete-sticky>x</div>
        <div class = drag-handle>=</div>
        <textarea>${note.content}</textarea>
    `;

    sn.addEventListener('mouseup', () => {
        const newWidth = parseInt(sn.style.width);
        const newHeight = parseInt(sn.style.height);

        if(newWidth !== note.width || newHeight !== note.height){
            note.width = newWidth;
            note.height = newHeight;
            triggerAutoSave();
        }
    });

    makeDraggable(sn,note);

    sn.querySelector('.delete-sticky').onclick = (e) => {
        e.stopPropagation();
        deleteStickyNote(note.id);
    };

    sn.querySelector(`textarea`).oninput = (e) => {
        note.content = e.target.value;
        triggerAutoSave();
    };


    return sn;
}

function addNewNoteToCurrentBoard(){
    if(!currentBoardId) return;

    const newNote = {
        id: Date.now(),
        content: "",
        x: 100,
        y: 100
    }

    const board = allBoards.find( b => b.id === currentBoardId);
    board.notes.push(newNote);

    renderNotesOnBoard(board.notes);
}

function makeDraggable(element, note){
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const handle = element.querySelector(".drag-handle");

    if(handle){
        handle.onmousedown = dragMouseDown;
    } else {
        element.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e){

        if (e.target.tagName === 'TEXTAREA') return;

        e.stopPropagation();
        e.preventDefault();

        element.style.zIndex = "1000";
        element.style.transform = "scale(1.05)";

        pos3 = e.clientX;
        pos4 = e.clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e){
        e.preventDefault();

        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;

        pos3 = e.clientX;
        pos4 = e.clientY;

        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;

        const board = document.getElementById("bulletinBoard");
        
        if (newTop < 0) newTop = 0;
        if (newLeft < 0) newLeft = 0;
        if (newTop > board.offsetHeight - element.offsetHeight) newTop = board.offsetHeight - element.offsetHeight;
        if (newLeft > board.offsetWidth - element.offsetWidth) newLeft = board.offsetWidth - element.offsetWidth;

        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";

        note.x = newLeft;
        note.y = newTop;
    }

    function closeDragElement(){
        document.onmouseup = null;
        document.onmousemove = null;

        element.style.zIndex = "10";
        element.style.transform = "scale(1)";

        triggerAutoSave();
    }
}

function createNewBoard() {
    const newBoard = {
        id: Date.now(),
        boardName: "New Board",
        notes: [],
        updatedAt: Date.now()
    };
    allBoards.push(newBoard);
    renderSidebar();
    switchBoard(newBoard.id);
    triggerAutoSave();
}

// Open the Menu on right click
document.getElementById('bulletinBoard').addEventListener('contextmenu', (e) => {
    if (e.target.id === 'bulletinBoard') {
        e.preventDefault();
        
        // Save the click position relative to the board
        const rect = e.target.getBoundingClientRect();
        lastMousePos.x = e.clientX - rect.left;
        lastMousePos.y = e.clientY - rect.top;

        // Show the menu at the cursor
        boardMenu.style.display = 'block';
        boardMenu.style.left = e.clientX + 'px';
        boardMenu.style.top = e.clientY + 'px';
       
        e.stopPropagation();
    }
});

document.addEventListener('click', (e) => {
    if (boardMenu && !boardMenu.contains(e.target)) {
        boardMenu.style.display = 'none';
    }
});

document.getElementById('ctxAddNote').addEventListener('click', () => {
    spawnNoteAt(lastMousePos.x, lastMousePos.y);
    boardMenu.style.display = 'none';
});

function spawnNoteAt(x, y) {
    if (!currentBoardId) {
        showStatus("Select a board first!");
        return;
    }

    const board = allBoards.find(b => b.id === currentBoardId);
    const newNote = {
        id: Date.now(),
        content: "",
        x: x - 100,
        y: y - 20,
        width: 200,
        height: 200
    };

    board.notes.push(newNote);
    const sticky = createStickyElement(newNote);
    document.getElementById("bulletinBoard").appendChild(sticky);
    
    // Auto-focus the new note
    sticky.querySelector('textarea').focus();
    triggerAutoSave();
}

async function deleteBoard(boardId) {
    if (!confirm("Deleting board, Are you sure?")) {
        return;
    }

    showStatus("Deleting board...");

    allBoards = allBoards.filter(b => b.id !== boardId);

    if (currentBoardId === boardId) {
        currentBoardId = allBoards.length > 0 ? allBoards[0].id : null;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allBoards));

    renderSidebar();
    if (currentBoardId) {
        switchBoard(currentBoardId);
    } else {
        document.getElementById("bulletinBoard").innerHTML = '';
    }

    try {
        await fetch(`${API_URL}/${boardId}`, {
            method: 'DELETE'
        });
        showStatus("Board deleted");
    } catch (error) {
        showStatus("Deleted locally (Offline)");
    } finally {
        hideStatus();
        renderSidebar();

        // If there's a new current board, load its notes
        if (currentBoardId) {
            switchBoard(currentBoardId);
        } else {
            // If no boards left, clear the canvas
            document.getElementById("bulletinBoard").innerHTML = '';
            renderSidebar();
        }
    }
}