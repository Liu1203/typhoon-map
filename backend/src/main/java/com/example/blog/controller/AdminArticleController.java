package com.example.blog.controller;

import com.example.blog.common.ApiResponse;
import com.example.blog.dto.CreateArticleParams;
import com.example.blog.dto.PageResult;
import com.example.blog.entity.Article;
import com.example.blog.entity.User;
import com.example.blog.mapper.ArticleMapper;
import com.example.blog.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/articles")
public class AdminArticleController {
    private static final String STATUS_DRAFT = "draft";
    private static final String STATUS_PUBLISHED = "published";

    private final ArticleMapper articleMapper;
    private final UserMapper userMapper;

    public AdminArticleController(ArticleMapper articleMapper, UserMapper userMapper) {
        this.articleMapper = articleMapper;
        this.userMapper = userMapper;
    }

    private boolean checkAdmin(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return false;
        User user = userMapper.selectById(userId);
        return user != null && "admin".equals(user.getRole());
    }

    private String normalizeStatus(String status) {
        if (STATUS_DRAFT.equals(status)) return STATUS_DRAFT;
        if (STATUS_PUBLISHED.equals(status)) return STATUS_PUBLISHED;
        return STATUS_PUBLISHED;
    }

    private void validateArticleParams(CreateArticleParams params, String status) {
        if (STATUS_PUBLISHED.equals(status)) {
            if (params.getTitle() == null || params.getTitle().isBlank()) {
                throw new IllegalArgumentException("请输入文章标题");
            }
            if (params.getContent() == null || params.getContent().isBlank()) {
                throw new IllegalArgumentException("请输入文章内容");
            }
        }
    }

    private String normalizeTitle(String title) {
        return title == null || title.isBlank() ? "未命名草稿" : title;
    }

    @GetMapping
    public ApiResponse<PageResult<Article>> getArticles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            HttpServletRequest request) {
        if (!checkAdmin(request)) return ApiResponse.error(403, "无权限");
        Page<Article> pageResult = articleMapper.selectPage(
                new Page<>(page, pageSize),
                new LambdaQueryWrapper<Article>()
                        .orderByDesc(Article::getDate)
                        .orderByDesc(Article::getId));
        return ApiResponse.success(new PageResult<>(
                pageResult.getRecords(),
                pageResult.getTotal(),
                (int) pageResult.getCurrent(),
                (int) pageResult.getSize()));
    }

    @GetMapping("/{id}")
    public ApiResponse<Article> getArticle(@PathVariable Long id, HttpServletRequest request) {
        if (!checkAdmin(request)) return ApiResponse.error(403, "无权限");
        Article article = articleMapper.selectById(id);
        if (article == null) return ApiResponse.error(404, "文章不存在");
        return ApiResponse.success(article);
    }

    @PostMapping
    public ApiResponse<Article> createArticle(
            @Valid @RequestBody CreateArticleParams params,
            HttpServletRequest request) {
        if (!checkAdmin(request)) return ApiResponse.error(403, "无权限");
        Article article = new Article();
        String status = normalizeStatus(params.getStatus());
        validateArticleParams(params, status);
        article.setTitle(normalizeTitle(params.getTitle()));
        article.setContent(params.getContent() != null ? params.getContent() : "");
        article.setCategory(params.getCategory());
        article.setCategoryColor(params.getCategoryColor());
        article.setTagsList(params.getTags() != null ? params.getTags() : List.of());
        article.setDate(params.getDate() != null ? params.getDate() : java.time.LocalDate.now());
        article.setStatus(status);
        article.setViewCount(0L);
        article.setLikeCount(0L);
        articleMapper.insert(article);
        return ApiResponse.success(article, "创建成功");
    }

    @PutMapping("/{id}")
    public ApiResponse<Article> updateArticle(
            @PathVariable Long id,
            @Valid @RequestBody CreateArticleParams params,
            HttpServletRequest request) {
        if (!checkAdmin(request)) return ApiResponse.error(403, "无权限");
        Article article = articleMapper.selectById(id);
        if (article == null) return ApiResponse.error(404, "文章不存在");
        String status = normalizeStatus(params.getStatus());
        validateArticleParams(params, status);
        article.setTitle(normalizeTitle(params.getTitle()));
        article.setContent(params.getContent() != null ? params.getContent() : "");
        article.setCategory(params.getCategory());
        article.setCategoryColor(params.getCategoryColor());
        article.setTagsList(params.getTags() != null ? params.getTags() : List.of());
        if (params.getDate() != null) article.setDate(params.getDate());
        article.setStatus(status);
        articleMapper.updateById(article);
        return ApiResponse.success(article, "更新成功");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteArticle(@PathVariable Long id, HttpServletRequest request) {
        if (!checkAdmin(request)) return ApiResponse.error(403, "无权限");
        articleMapper.deleteById(id);
        return ApiResponse.success(null, "删除成功");
    }
}
