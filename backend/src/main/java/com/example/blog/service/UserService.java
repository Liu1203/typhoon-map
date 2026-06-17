package com.example.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.blog.entity.User;
import com.example.blog.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@Service
public class UserService {

    private final UserMapper userMapper;
    private final String uploadPath;

    public UserService(UserMapper userMapper,
                       @Value("${app.upload.path:./uploads}") String uploadPath) {
        this.userMapper = userMapper;
        this.uploadPath = uploadPath;
    }

    public List<User> getAllUsers() {
        return userMapper.selectList(null);
    }

    public User getUserById(Long id) {
        return userMapper.selectById(id);
    }

    public User getUserByUsername(String username) {
        return userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));
    }

    public User createUser(String name, String email) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setAvatar("");
        user.setPassword("");
        user.setUsername(email);
        userMapper.insert(user);
        return user;
    }

    public String updateAvatar(Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("只支持图片文件");
        }

        String avatarDir = uploadPath + "/avatars";
        try {
            Files.createDirectories(Paths.get(avatarDir));
        } catch (IOException e) {
            throw new RuntimeException("创建头像目录失败: " + e.getMessage(), e);
        }

        String originalFilename = file.getOriginalFilename();
        String ext = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = "avatar_" + userId + "_" + System.currentTimeMillis() + ext;

        File dest = new File(avatarDir, filename);
        try {
            file.transferTo(dest);
        } catch (IOException e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        }

        String avatarUrl = "/uploads/avatars/" + filename;
        User user = userMapper.selectById(userId);
        if (user != null) {
            user.setAvatar(avatarUrl);
            userMapper.updateById(user);
        }
        return avatarUrl;
    }
}
