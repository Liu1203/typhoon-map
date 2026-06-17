package com.example.blog.config;

import com.example.blog.entity.Article;
import com.example.blog.mapper.ArticleMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ArticleMapper articleMapper;

    public DataInitializer(ArticleMapper articleMapper) {
        this.articleMapper = articleMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        List<Article> articles = articleMapper.selectList(null);
        if (articles.isEmpty()) return;

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:db/content/article-*.md");

        for (Resource resource : resources) {
            String filename = resource.getFilename();
            if (filename == null) continue;

            String idStr = filename.replace("article-", "").replace(".md", "");
            Long id = Long.parseLong(idStr);

            String content = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);

            Article article = new Article();
            article.setId(id);
            article.setContent(content);
            articleMapper.updateById(article);
        }
    }
}