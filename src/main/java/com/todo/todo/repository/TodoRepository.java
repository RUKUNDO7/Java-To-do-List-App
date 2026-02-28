package com.todo.todo.repository;

import com.todo.todo.model.Todo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TodoRepository extends JpaRepository<Todo, Long> {
    List<Todo> findByOwnerId(Long ownerId);
    List<Todo> findByOwnerIdAndStatus(Long ownerId, boolean status);
    Optional<Todo> findByOwnerIdAndId(Long ownerId, Long id);
    Optional<Todo> findByOwnerIdAndTitle(Long ownerId, String title);
    boolean existsByOwnerIdAndTitle(Long ownerId, String title);
    void deleteByOwnerIdAndTitle(Long ownerId, String title);
    long countByOwnerId(Long ownerId);
    long countByOwnerIdAndStatus(Long ownerId, boolean status);
}
