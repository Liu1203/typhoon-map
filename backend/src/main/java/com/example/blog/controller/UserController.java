package com.example.blog.controller;

import com.example.blog.common.ApiResponse;
import com.example.blog.entity.User;
import com.example.blog.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/api/users")
    public ApiResponse<List<User>> getUsers() {
        return ApiResponse.success(userService.getAllUsers());
    }

    @GetMapping("/api/user/{id}")
    public ApiResponse<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user == null) {
            return ApiResponse.error(404, "用户不存在");
        }
        return ApiResponse.success(user);
    }

    @PostMapping("/api/user")
    public ApiResponse<User> createUser(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        if (name == null || email == null) {
            return ApiResponse.error(400, "name 和 email 不能为空");
        }
        return ApiResponse.success(userService.createUser(name, email), "创建成功");
    }

    @PostMapping("/api/user/avatar")
    public ApiResponse<String> updateAvatar(@RequestParam("file") MultipartFile file,
                                              HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }
        String avatarUrl = userService.updateAvatar(userId, file);
        return ApiResponse.success(avatarUrl, "头像更新成功");
    }
}
