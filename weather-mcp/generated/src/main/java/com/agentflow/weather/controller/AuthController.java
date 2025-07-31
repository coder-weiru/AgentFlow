package com.agentflow.weather.controller;

import com.agentflow.weather.security.JwtUtil;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        // For demo, accept any username/password
        String token = JwtUtil.generateToken(username);
        return Map.of("token", token);
    }
}
