using System.Collections.Generic;

public class Board
{
    public long Id { get; set; }
    public string BoardName { get; set; } = "Untitled Board";
    public List<Note> Notes { get; set; } = new();
    public long UpdatedAt { get; set; }
}
