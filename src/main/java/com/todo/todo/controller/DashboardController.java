package com.todo.todo.controller;

import com.todo.todo.dto.DashboardResponse;
import com.todo.todo.model.AppUser;
import com.todo.todo.service.CurrentUserService;
import com.todo.todo.service.TodoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final CurrentUserService currentUserService;
    private final TodoService todoService;

    public DashboardController(CurrentUserService currentUserService, TodoService todoService) {
        this.currentUserService = currentUserService;
        this.todoService = todoService;
    }

    @GetMapping
    public DashboardResponse getDashboard() {
        AppUser user = currentUserService.getCurrentUser();
        long total = todoService.countTotalForUser(user);
        long completed = todoService.countCompletedForUser(user);
        return new DashboardResponse(
                user.getUsername(),
                user.getRole().name(),
                total,
                total - completed,
                completed
        );
    }
}
