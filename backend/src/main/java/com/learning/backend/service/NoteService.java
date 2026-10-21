package com.learning.backend.service;

import com.learning.backend.dto.Dtos.NoteRequest;
import com.learning.backend.dto.Dtos.NoteView;
import com.learning.backend.entity.ResourceNote;
import com.learning.backend.repository.ResourceNoteRepository;
import com.learning.backend.repository.ResourceRepository;
import com.learning.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class NoteService {
    private final ResourceNoteRepository notes;
    private final ResourceRepository resources;
    private final CurrentUser current;

    public NoteView getNote(Long resourceId) {
        Long uid = current.id();
        return notes.findByUserIdAndResourceId(uid, resourceId)
                .map(n -> new NoteView(n.getResourceId(), n.getText(), n.getUpdatedAt()))
                .orElseGet(() -> new NoteView(resourceId, "", null));
    }

    @Transactional
    public NoteView saveNote(NoteRequest req) {
        Long uid = current.id();
        if (!resources.existsById(req.resourceId())) {
            throw new NoSuchElementException("Resource not found");
        }
        if (req.text() != null && req.text().length() > 2000) {
            throw new IllegalArgumentException("Note text cannot exceed 2000 characters");
        }
        String text = req.text() != null ? req.text() : "";
        ResourceNote n = notes.findByUserIdAndResourceId(uid, req.resourceId())
                .orElseGet(() -> ResourceNote.builder().userId(uid).resourceId(req.resourceId()).build());
        n.setText(text);
        n.setUpdatedAt(LocalDateTime.now());
        ResourceNote saved = notes.save(n);
        return new NoteView(saved.getResourceId(), saved.getText(), saved.getUpdatedAt());
    }
}
