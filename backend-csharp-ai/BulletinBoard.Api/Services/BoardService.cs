using Microsoft.EntityFrameworkCore;

public interface IBoardService
{
    Task<List<Board>> GetAllBoardsAsync();
    Task<Board?> GetBoardByIdAsync(long id);
    Task UpdateBoardAsync(Board board);
    Task DeleteBoardAsync(long id);
    Task SyncBoardsAsync(List<Board> boards);
}

public class BoardService : IBoardService
{
    private readonly BulletinBoardContext _context;

    public BoardService(BulletinBoardContext context)
    {
        _context = context;
    }

    public async Task<List<Board>> GetAllBoardsAsync()
    {
        return await _context.Boards
            .Include(b => b.Notes)
            .ToListAsync();
    }

    public async Task<Board?> GetBoardByIdAsync(long id)
    {
        return await _context.Boards
            .Include(b => b.Notes)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task UpdateBoardAsync(Board board)
    {
        var existingBoard = await _context.Boards
            .Include(b => b.Notes)
            .FirstOrDefaultAsync(b => b.Id == board.Id);

        if (existingBoard != null)
        {
            board.UpdatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            
            _context.Entry(existingBoard).CurrentValues.SetValues(board);
            
            // Remove notes that are no longer in the list
            var notesToRemove = existingBoard.Notes
                .Where(n => !board.Notes.Any(bn => bn.Id == n.Id))
                .ToList();
            
            foreach (var note in notesToRemove)
            {
                _context.Notes.Remove(note);
            }

            // Add or update notes
            foreach (var note in board.Notes)
            {
                var existingNote = existingBoard.Notes.FirstOrDefault(n => n.Id == note.Id);
                if (existingNote != null)
                {
                    _context.Entry(existingNote).CurrentValues.SetValues(note);
                }
                else
                {
                    existingBoard.Notes.Add(note);
                }
            }

            await _context.SaveChangesAsync();
        }
    }

    public async Task DeleteBoardAsync(long id)
    {
        var board = await _context.Boards.FindAsync(id);
        if (board != null)
        {
            _context.Boards.Remove(board);
            await _context.SaveChangesAsync();
        }
    }

    public async Task SyncBoardsAsync(List<Board> boards)
    {
        // Clear existing boards and notes
        _context.Boards.RemoveRange(_context.Boards);
        await _context.SaveChangesAsync();

        // Add new boards
        foreach (var board in boards)
        {
            if (board.UpdatedAt == 0)
            {
                board.UpdatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            }
            _context.Boards.Add(board);
        }

        await _context.SaveChangesAsync();
    }
}
