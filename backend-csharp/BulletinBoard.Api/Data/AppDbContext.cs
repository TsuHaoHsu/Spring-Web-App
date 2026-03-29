using Microsoft.EntityFrameworkCore;
using BulletinBoard.Api.Models;

namespace BulletinBoard.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Database tables
    public DbSet<Board> Boards { get; set; }
    public DbSet<Note> Notes { get; set; }
}