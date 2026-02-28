package com.todo.todo.service;

import com.todo.todo.model.AppUser;
import com.todo.todo.model.Todo;
import com.todo.todo.repository.TodoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TodoService {

    private final TodoRepository todoRepository;

    public TodoService(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    public List<Todo> getAllTodosForUser(AppUser user) {
        return todoRepository.findByOwnerId(user.getId());
    }

    public List<Todo> getTodosByStatusForUser(AppUser user, boolean status) {
        return todoRepository.findByOwnerIdAndStatus(user.getId(), status);
    }

    public Todo getTodoByIdForUser(AppUser user, Long id) {
        return todoRepository.findByOwnerIdAndId(user.getId(), id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    public Todo getTodoByTitleForUser(AppUser user, String title) {
        return todoRepository.findByOwnerIdAndTitle(user.getId(), title)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    public Todo createTodoForUser(AppUser user, Todo todo) {
        if (todoRepository.existsByOwnerIdAndTitle(user.getId(), todo.getTitle())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Task with this title already exists");
        }
        todo.setOwner(user);
        return todoRepository.save(todo);
    }

    public void deleteTodoForUser(AppUser user, Long id) {
        getTodoByIdForUser(user, id);
        todoRepository.deleteById(id);
    }

    public void deleteTodoByTitleForUser(AppUser user, String title) {
        if (!todoRepository.existsByOwnerIdAndTitle(user.getId(), title)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
        }

        todoRepository.deleteByOwnerIdAndTitle(user.getId(), title);
    }

    public Todo updateTodoForUser(AppUser user, Long id, Todo updateTodo) {
        Todo todo = getTodoByIdForUser(user, id);

        todo.setTitle(updateTodo.getTitle());
        todo.setStatus(updateTodo.isStatus());

        return todoRepository.save(todo);
    }

    public Todo updateTodoByTitleForUser(AppUser user, String title, Todo updateTodo) {
        Todo todo = getTodoByTitleForUser(user, title);

        todo.setTitle(updateTodo.getTitle());
        todo.setStatus(updateTodo.isStatus());

        return todoRepository.save(todo);
    }

    public long countTotalForUser(AppUser user) {
        return todoRepository.countByOwnerId(user.getId());
    }

    public long countCompletedForUser(AppUser user) {
        return todoRepository.countByOwnerIdAndStatus(user.getId(), true);
    }

    public List<Todo> getAllTodosForAdmin() {
        return todoRepository.findAll();
    }
}
