package com.connectneighbours.admindesktop.back.exposition;

import com.connectneighbours.admindesktop.back.domain.exception.IncidentConflictException;
import com.connectneighbours.admindesktop.back.domain.exception.IncidentDeletionNotAllowedException;
import com.connectneighbours.admindesktop.back.domain.exception.IncidentNotFoundException;
import com.connectneighbours.admindesktop.back.domain.exception.InvalidIncidentException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(InvalidIncidentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleInvalidIncident(InvalidIncidentException ex) {
        return Map.of("error", ex.getMessage());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleConstraintViolation(ConstraintViolationException ex) {
        return Map.of("error", "Invalid pagination parameters");
    }

    @ExceptionHandler(IncidentNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> handleIncidentNotFound(IncidentNotFoundException ex) {
        return Map.of("error", ex.getMessage());
    }

    @ExceptionHandler(IncidentConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> handleIncidentConflict(IncidentConflictException ex) {
        return Map.of("error", ex.getMessage());
    }

    @ExceptionHandler(IncidentDeletionNotAllowedException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> handleDeletionNotAllowed(IncidentDeletionNotAllowedException ex) {
        return Map.of("error", ex.getMessage());
    }


}
