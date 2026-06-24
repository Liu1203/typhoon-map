package com.example.blog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.blog.common.ApiResponse;
import com.example.blog.entity.Article;
import com.example.blog.service.ArticleService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public ApiResponse<List<Article>> getArticles() {
        return ApiResponse.success(articleService.getAllArticles());
    }

    @GetMapping("/{id}")
    public ApiResponse<Article> getArticleById(@PathVariable Long id) {
        Article article = articleService.getArticleById(id);
        return ApiResponse.success(article);
    }

    @GetMapping("/hot")
    public ApiResponse<List<Article>> getHotArticles(
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.success(articleService.getHotArticles(limit));
    }

    @GetMapping("/{id}/related")
    public ApiResponse<List<Article>> getRelatedArticles(@PathVariable Long id) {
        return ApiResponse.success(articleService.getRelatedArticles(id));
    }

    @PostMapping("/{id}/view")
    public ApiResponse<Void> incrementViewCount(@PathVariable Long id) {
        articleService.incrementViewCount(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/like")
    public ApiResponse<Void> likeArticle(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }
        articleService.likeArticle(id, userId);
        return ApiResponse.success(null, "点赞成功");
    }

    @DeleteMapping("/{id}/like")
    public ApiResponse<Void> unlikeArticle(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }
        articleService.unlikeArticle(id, userId);
        return ApiResponse.success(null, "取消点赞");
    }

    @GetMapping("/search")
    public ApiResponse<Map<String, Object>> searchArticles(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        IPage<Article> pageResult = articleService.searchArticles(keyword, page, size, userId);
        Map<String, Object> result = new HashMap<>();
        result.put("articles", pageResult.getRecords());
        result.put("total", pageResult.getTotal());
        result.put("page", page);
        result.put("size", size);
        result.put("keyword", keyword);
        return ApiResponse.success(result);
    }
}
