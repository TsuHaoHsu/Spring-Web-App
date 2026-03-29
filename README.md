# Spring Web App

An application created to practice JavaScript for the frontend, with C# for the backend.

---

## Current Features

### Bulletin Board
- Add note by right clicking the board.
- Board works just like a real bulletin board (can drag around)
- Auto-saves after any user text input into the note, with **"New Board"** as the default name.  
- Currently deployed on GitHub, so notes are saved in **browser storage** (Local storage).
- Can switch between bulletin using the board's title in the sidebar.  
- Can delete a board using the dropdown menu in the sidebar.  
- Can edit a board's name using the dropdown menu in the sidebar.
- Can add board using the sidebar.
- Delete note using X button on top right
---

## Work in Progress (WIP)
- User login system to store notes privately per account.  
- Additional features beyond a simple notepad, such as messaging between users.

---

## Tech Stack
- **Frontend:** JavaScript, HTML, CSS  
- **Backend:** C#
- **Database:** SQL Lite (demo uses localStorage)
- **Deployment for demo:** GitHub Pages (frontend with localStorage)

## Website link to try it out
https://tsuhaohsu.github.io/Spring-Web-App/

Update log:
02/25/2026 - Completed local storage fallback and added message indicator on bottom right.
02/03/2026 - Swapped to bulletin board style instead of just one notes per page.
03/29/2026 - Backend changed to use C# MVC with Entity Framework, database now uses SQL lite.