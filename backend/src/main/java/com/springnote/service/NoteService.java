package com.springnote.service;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import com.springnote.model.Note;
import com.springnote.repository.NoteRepository;
import java.util.List;

@Service
public class NoteService {
    
    private final NoteRepository noteRepository;
    
    public NoteService(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    //Create
    public Note createNote(@RequestBody Note note) {
        return noteRepository.save(note);
    }

    //Get
    public Note getNoteById(@PathVariable Long id) {
        return noteRepository.findById(id).orElse(null);
    }
    public List<Note> getAllNotes() {
        return noteRepository.findAll();
    }

    //Update
    public Note updateNote(@PathVariable Long id, @RequestBody Note updatedNote) {
        return noteRepository.findById(id).map(note -> {
            note.setTitle(updatedNote.getTitle());
            note.setContent(updatedNote.getContent());
            return noteRepository.save(note);
        }).orElse(null);
    }

    public void deleteNote(@PathVariable Long id) {
        noteRepository.deleteById(id);
    }
}
//./mvnw spring-boot:run
