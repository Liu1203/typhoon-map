package com.example.blog.service;

import com.example.blog.common.JwtUtil;
import com.example.blog.dto.LoginResult;
import com.example.blog.entity.User;
import com.example.blog.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public AuthService(UserService userService, JwtUtil jwtUtil, PasswordEncoder passwordEncoder, UserMapper userMapper) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    public LoginResult login(String username, String password) {
        User user = userService.getUserByUsername(username);
        if (user == null) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        LoginResult.UserInfo userInfo = new LoginResult.UserInfo(
                user.getId(), user.getName(), user.getAvatar());
        return new LoginResult(token, userInfo);
    }

    public LoginResult register(String username, String password, String name, String email) {
        User existing = userService.getUserByUsername(username);
        if (existing != null) {
            throw new IllegalArgumentException("用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setEmail(email);
        user.setAvatar("");
        userMapper.insert(user);

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        LoginResult.UserInfo userInfo = new LoginResult.UserInfo(
                user.getId(), user.getName(), user.getAvatar());
        return new LoginResult(token, userInfo);
    }
}
