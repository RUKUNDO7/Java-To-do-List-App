package com.todo.todo.dto;

import com.todo.todo.model.AppUser;

public record AuthResponse(Long id, String username, String email, String role) {
    public static AuthResponse from(AppUser user) {
        return new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name());
    }
}
