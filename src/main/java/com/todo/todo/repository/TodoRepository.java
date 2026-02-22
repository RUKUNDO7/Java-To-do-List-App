package com.todo.todo.repository;

import com.todo.todo.model.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface TodoRepository extends JpaRepository<Todo, Long> {
    Optional<Todo> findByTitle(String title);
    boolean existsByTitle(String title);
    void deleteByTitle(String title);
    java.util.List<Todo> findByStatus(boolean status);
}
