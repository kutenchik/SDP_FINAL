package dev.hackathon.hub.exception;

import java.util.*;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiExceptionHandler {
  public record ApiError(String message, Map<String, String> errors) {}

  @ExceptionHandler(DomainException.class)
  ResponseEntity<ApiError> domain(DomainException ex) {
    return ResponseEntity.status(ex.getStatus()).body(new ApiError(ex.getMessage(), Map.of()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
    Map<String, String> fields = new LinkedHashMap<>();
    ex.getBindingResult()
        .getFieldErrors()
        .forEach(e -> fields.put(e.getField(), e.getDefaultMessage()));
    return ResponseEntity.badRequest()
        .body(new ApiError("Please check the highlighted fields.", fields));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<ApiError> conflict() {
    return ResponseEntity.status(409)
        .body(
            new ApiError(
                "This name, email or judge evaluation already exists, or the item is still in use.",
                Map.of()));
  }

  @ExceptionHandler({
    HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class
  })
  ResponseEntity<ApiError> malformed() {
    return ResponseEntity.badRequest()
        .body(new ApiError("The request contains an invalid value or date.", Map.of()));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiError> unexpected(Exception ex) {
    LoggerFactory.getLogger(getClass()).error("Request failed", ex);
    return ResponseEntity.internalServerError()
        .body(new ApiError("Something went wrong. Please try again.", Map.of()));
  }
}
