package com.todo.todo.dto;

public record DashboardResponse(String username, String role, long totalTasks, long openTasks, long completedTasks) {
}
