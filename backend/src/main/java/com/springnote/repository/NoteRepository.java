package com.springnote.repository;
import com.springnote.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<Note, Long> {
    // JpaRepository provides basic CRUD operations for the Note entity, allowing us to easily interact with the database.
}
