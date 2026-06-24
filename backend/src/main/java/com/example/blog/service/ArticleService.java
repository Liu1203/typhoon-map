package com.example.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.example.blog.entity.Article;
import com.example.blog.entity.ArticleLike;
import com.example.blog.mapper.ArticleLikeMapper;
import com.example.blog.mapper.ArticleMapper;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

@Service
public class ArticleService {

    private final ArticleMapper articleMapper;
    private final ArticleLikeMapper articleLikeMapper;

    public ArticleService(ArticleMapper articleMapper, ArticleLikeMapper articleLikeMapper) {
        this.articleMapper = articleMapper;
        this.articleLikeMapper = articleLikeMapper;
    }

    public List<Article> getAllArticles() {
        return articleMapper.selectList(null);
    }

    public Article getArticleById(Long id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new IllegalArgumentException("文章不存在");
        }
        return article;
    }

    public List<Article> getHotArticles(int limit) {
        return articleMapper.selectList(
                new LambdaQueryWrapper<Article>()
                        .orderByDesc(Article::getViewCount)
                        .last("LIMIT " + limit));
    }

    public List<Article> getRelatedArticles(Long id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            return List.of();
        }
        List<String> tags = article.getTagsList();
        if (tags.isEmpty()) {
            return articleMapper.selectList(
                    new LambdaQueryWrapper<Article>()
                            .ne(Article::getId, id)
                            .orderByDesc(Article::getViewCount)
                            .last("LIMIT 4"));
        }
        List<Article> all = articleMapper.selectList(
                new LambdaQueryWrapper<Article>()
                        .ne(Article::getId, id));
        return all.stream()
                .filter(a -> {
                    List<String> aTags = a.getTagsList();
                    return aTags.stream().anyMatch(tags::contains);
                })
                .sorted((a, b) -> {
                    long aMatch = a.getTagsList().stream().filter(tags::contains).count();
                    long bMatch = b.getTagsList().stream().filter(tags::contains).count();
                    return Long.compare(bMatch, aMatch);
                })
                .limit(4)
                .toList();
    }

    public void incrementViewCount(Long id) {
        articleMapper.update(null,
                new LambdaUpdateWrapper<Article>()
                        .eq(Article::getId, id)
                        .setSql("view_count = view_count + 1"));
    }

    public void likeArticle(Long articleId, Long userId) {
        long count = articleLikeMapper.selectCount(
                new LambdaQueryWrapper<ArticleLike>()
                        .eq(ArticleLike::getArticleId, articleId)
                        .eq(ArticleLike::getUserId, userId));
        if (count == 0) {
            ArticleLike like = new ArticleLike();
            like.setArticleId(articleId);
            like.setUserId(userId);
            articleLikeMapper.insert(like);
            articleMapper.update(null,
                    new LambdaUpdateWrapper<Article>()
                            .eq(Article::getId, articleId)
                            .setSql("like_count = like_count + 1"));
        }
    }

    public void unlikeArticle(Long articleId, Long userId) {
        long deleted = articleLikeMapper.delete(
                new LambdaQueryWrapper<ArticleLike>()
                        .eq(ArticleLike::getArticleId, articleId)
                        .eq(ArticleLike::getUserId, userId));
        if (deleted > 0) {
            articleMapper.update(null,
                    new LambdaUpdateWrapper<Article>()
                            .eq(Article::getId, articleId)
                            .setSql("like_count = like_count - 1"));
        }
    }

    public IPage<Article> searchArticles(String keyword, int page, int size, Long userId) {
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<Article>()
                .and(w -> w.like(Article::getTitle, keyword)
                        .or().like(Article::getContent, keyword))
                .orderByDesc(Article::getViewCount);
        Page<Article> pageParam = new Page<>(page, size);
        IPage<Article> result = articleMapper.selectPage(pageParam, wrapper);
        if (userId != null) {
            for (Article article : result.getRecords()) {
                long liked = articleLikeMapper.selectCount(
                        new LambdaQueryWrapper<ArticleLike>()
                                .eq(ArticleLike::getArticleId, article.getId())
                                .eq(ArticleLike::getUserId, userId));
                article.setLikedByMe(liked > 0);
            }
        }
        return result;
    }
}
