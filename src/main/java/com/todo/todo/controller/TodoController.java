package com.todo.todo.controller;

import com.todo.todo.model.AppUser;
import com.todo.todo.model.Todo;
import com.todo.todo.service.CurrentUserService;
import com.todo.todo.service.TodoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/todos", "/todos/"})
@CrossOrigin
public class TodoController {

    private final TodoService todoService;
    private final CurrentUserService currentUserService;

    public TodoController(TodoService todoService, CurrentUserService currentUserService) {
        this.todoService = todoService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Todo> getAllTodos() {
        AppUser user = currentUserService.getCurrentUser();
        return todoService.getAllTodosForUser(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public List<Todo> getAllTodosForAdmin() {
        return todoService.getAllTodosForAdmin();
    }

    @GetMapping("/status/{status}")
    public List<Todo> getTodosByStatus(@PathVariable boolean status) {
        AppUser user = currentUserService.getCurrentUser();
        return todoService.getTodosByStatusForUser(user, status);
    }

    @GetMapping("/{id}")
    public Todo getTodoById(@PathVariable Long id) {
        AppUser user = currentUserService.getCurrentUser();
        return todoService.getTodoByIdForUser(user, id);
    }

    @GetMapping("/title/{title}")
    public Todo getTodoByTitle(@PathVariable String title) {
        AppUser user = currentUserService.getCurrentUser();
        return todoService.getTodoByTitleForUser(user, title);
    }

    @PostMapping
    public Todo createTodo(@RequestBody Todo todo) {
        AppUser user = currentUserService.getCurrentUser();
        return todoService.createTodoForUser(user, todo);
    }

    @PutMapping("/{id}")
    public Todo updateTodo(@PathVariable Long id, @RequestBody Todo todo) {
        AppUser user = currentUserService.getCurrentUser();
        return todoService.updateTodoForUser(user, id, todo);
    }

    @PutMapping("/title/{title}")
    public Todo updateTodoByTitle(@PathVariable String title, @RequestBody Todo todo) {
        AppUser user = currentUserService.getCurrentUser();
        return todoService.updateTodoByTitleForUser(user, title, todo);
    }

    @DeleteMapping("/{id}")
    public void deleteTodo(@PathVariable Long id) {
        AppUser user = currentUserService.getCurrentUser();
        todoService.deleteTodoForUser(user, id);
    }

    @DeleteMapping("/title/{title}")
    public void deleteTodoByTitle(@PathVariable String title) {
        AppUser user = currentUserService.getCurrentUser();
        todoService.deleteTodoByTitleForUser(user, title);
    }
}
