namespace BulletinBoard.Api.Models;

public class Note
{
    public long Id {get; set;}
    public string Content {get; set;} = "";
    public int X { get; set; }
    public int Y { get; set; }
    public int Width { get; set; } = 200;
    public int Height { get; set; } = 200;

    public long BoardId { get; set; }
    
}