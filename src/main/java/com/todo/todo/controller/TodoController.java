package com.todo.todo.controller;

import com.todo.todo.model.Todo;
import com.todo.todo.service.TodoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/todos", "/todos/"})
@CrossOrigin
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public List<Todo> getAllTodos() {
        return todoService.getAllTodos();
    }

    @GetMapping("/status/{status}")
    public List<Todo> getTodosByStatus(@PathVariable boolean status) {
        return todoService.getTodosByStatus(status);
    }

    @GetMapping("/{id}")
    public Todo getTodoById(@PathVariable Long id) {
        return todoService.getTodoById(id);
    }

    @GetMapping("/title/{title}")
    public Todo getTodoByTitle(@PathVariable String title) {
        return todoService.getTodoByTitle(title);
    }

    @PostMapping
    public Todo createTodo(@RequestBody Todo todo) {
        return todoService.createTodo(todo);
    }

    @PutMapping("/{id}")
    public Todo updateTodo(@PathVariable Long id, @RequestBody Todo todo) {
        return todoService.updateTodo(id, todo);
    }

    @PutMapping("/title/{title}")
    public Todo updateTodoByTitle(@PathVariable String title, @RequestBody Todo todo) {
        return todoService.updateTodoByTitle(title, todo);
    }

    @DeleteMapping("/{id}")
    public void deleteTodo(@PathVariable Long id) {
        todoService.deleteTodo(id);
    }

    @DeleteMapping("/title/{title}")
    public void deleteTodoByTitle(@PathVariable String title) {
        todoService.deleteTodoByTitle(title);
    }
}
