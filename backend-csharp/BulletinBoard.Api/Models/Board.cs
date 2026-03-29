namespace BulletinBoard.Api.Models;

public class Board
{
    public long Id { get; set; }
    public string BoardName {get; set;} = "New Board";
    public long UpdatedAt {get; set;}

    public List<Note> Notes {get; set;} = new();

}