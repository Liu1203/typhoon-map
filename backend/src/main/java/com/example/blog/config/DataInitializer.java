package com.example.blog.config;

import com.example.blog.entity.Article;
import com.example.blog.entity.User;
import com.example.blog.mapper.ArticleMapper;
import com.example.blog.mapper.UserMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ArticleMapper articleMapper;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(ArticleMapper articleMapper, UserMapper userMapper, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.articleMapper = articleMapper;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        migrateArticleStatusColumn();
        migrateAdminPassword();
        loadArticleContent();
    }

    private void migrateArticleStatusColumn() {
        jdbcTemplate.execute("ALTER TABLE article ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published'");
        jdbcTemplate.update("UPDATE article SET status = 'published' WHERE status IS NULL OR status = ''");
    }

    private void migrateAdminPassword() {
        User admin = userMapper.selectById(1L);
        if (admin != null && !admin.getPassword().startsWith("$2a$")) {
            admin.setPassword(passwordEncoder.encode(admin.getPassword()));
            userMapper.updateById(admin);
        }
    }

    private void loadArticleContent() throws Exception {
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
