using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BulletinBoard.Api.Data;
using BulletinBoard.Api.Models;

namespace BulletinBoard.Api.Controllers;

[ApiController]
[Route("api/[Controller]")]
public class BoardController : ControllerBase
{
    private readonly AppDbContext _context;
    
    public BoardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Board>>> GetBoards()
    {
        return await _context.Boards.Include(b => b.Notes).ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Board>> CreateBoard(Board board)
    {
        _context.Boards.Add(board);
        await _context.SaveChangesAsync();
        return Ok(board);
    }

    [HttpPost("{boardId}/notes")]
    public async Task<ActionResult<Note>> AddNote(long boardId, Note note)
    {
        note.BoardId = boardId;
        _context.Notes.Add(note);
        await _context.SaveChangesAsync();
        return Ok(note);
    }

    [HttpPut("notes/{noteId}")]
    public async Task<IActionResult> UpdateNote(long noteId, Note updatedNote)
    {
        var note = await _context.Notes.FindAsync(noteId);
        if (note == null) return NotFound();

        note.X = updatedNote.X;
        note.Y = updatedNote.Y;
        note.Content = updatedNote.Content;
        note.Width = updatedNote.Width;
        note.Height = updatedNote.Height;

        await _context.SaveChangesAsync();
        return NoContent();
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBoard(long id)
    {
        var board = await _context.Boards.Include(b=>b.Notes).FirstOrDefaultAsync(x => x.Id == id);
        if(board == null) return NotFound();

        _context.Boards.Remove(board);
        await _context.SaveChangesAsync();

        return NoContent();
    }


    [HttpDelete("notes/{noteId}")]
    public async Task<IActionResult> DeleteNote(long noteId)
    {
        var note = await _context.Notes.FindAsync(noteId);
        if(note == null) return NotFound();

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncBoards(List<Board> boards)
    {
        // This is a simple 'Wipe and Replace' sync
        var existingBoards = await _context.Boards.Include(b => b.Notes).ToListAsync();
        _context.Boards.RemoveRange(existingBoards);
        
        _context.Boards.AddRange(boards);
        await _context.SaveChangesAsync();
        return Ok();
    }
}
