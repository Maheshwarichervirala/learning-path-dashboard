package com.learning.backend.controller;

import com.learning.backend.dto.Dtos.NoteRequest;
import com.learning.backend.dto.Dtos.NoteView;
import com.learning.backend.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {
    private final NoteService notes;

    @GetMapping
    public NoteView getNote(@RequestParam Long resourceId) {
        return notes.getNote(resourceId);
    }

    @PutMapping
    public NoteView saveNote(@Valid @RequestBody NoteRequest req) {
        return notes.saveNote(req);
    }
}
