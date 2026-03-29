using Microsoft.EntityFrameworkCore;

public class BulletinBoardContext : DbContext
{
    public BulletinBoardContext(DbContextOptions<BulletinBoardContext> options)
        : base(options)
    {
    }

    public DbSet<Board> Boards { get; set; }
    public DbSet<Note> Notes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Board entity
        modelBuilder.Entity<Board>()
            .HasKey(b => b.Id);

        modelBuilder.Entity<Board>()
            .HasMany(b => b.Notes)
            .WithOne()
            .OnDelete(DeleteBehavior.Cascade);

        // Configure Note entity
        modelBuilder.Entity<Note>()
            .HasKey(n => n.Id);
    }
}
