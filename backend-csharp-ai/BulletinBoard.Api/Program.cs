using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Entity Framework Core with SQLite
builder.Services.AddDbContext<BulletinBoardContext>(options =>
    options.UseSqlite("Data Source=bulletinboard.db"));

builder.Services.AddScoped<IBoardService, BoardService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Apply migrations automatically
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<BulletinBoardContext>();
    context.Database.EnsureCreated();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseHttpsRedirection();

// Board API Endpoints
var boardGroup = app.MapGroup("/api/notes")
    .WithName("BoardAPI")
    .WithOpenApi();

// GET all boards
boardGroup.MapGet("/", GetAllBoards)
    .WithName("GetAllBoards")
    .WithOpenApi();

// POST sync boards
boardGroup.MapPost("/sync", SyncBoards)
    .WithName("SyncBoards")
    .WithOpenApi();

// PUT update board
boardGroup.MapPut("/{id}", UpdateBoard)
    .WithName("UpdateBoard")
    .WithOpenApi();

// DELETE board
boardGroup.MapDelete("/{id}", DeleteBoard)
    .WithName("DeleteBoard")
    .WithOpenApi();

app.Run();

// Endpoint handlers
static async Task<IResult> GetAllBoards(IBoardService boardService)
{
    var boards = await boardService.GetAllBoardsAsync();
    return Results.Ok(boards);
}

static async Task<IResult> SyncBoards(IBoardService boardService, List<Board> boards)
{
    await boardService.SyncBoardsAsync(boards);
    return Results.Ok(new { message = "Synced successfully" });
}

static async Task<IResult> UpdateBoard(IBoardService boardService, long id, Board board)
{
    board.Id = id;
    await boardService.UpdateBoardAsync(board);
    return Results.Ok(board);
}

static async Task<IResult> DeleteBoard(IBoardService boardService, long id)
{
    await boardService.DeleteBoardAsync(id);
    return Results.Ok(new { message = "Board deleted" });
}
