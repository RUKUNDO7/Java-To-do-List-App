package com.todo.todo.service;

import com.todo.todo.model.Todo;
import com.todo.todo.repository.TodoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TodoService {

    private final TodoRepository todoRepository;

    public TodoService(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }

    public Todo createTodo(Todo todo) {
        return todoRepository.save(todo);
    }

    public void deleteTodo(Long id) {
        todoRepository.deleteById(id);
    }

    public Todo updateTodo(Long id, Todo updateTodo) {
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        todo.setTitle(updateTodo.getTitle());
        todo.setStatus(updateTodo.isStatus());

        return todoRepository.save(todo);
    }
}
