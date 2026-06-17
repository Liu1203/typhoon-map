package com.example.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@TableName("article")
public class Article {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String content;
    private String category;
    private String categoryColor;
    private String tags;
    private LocalDate date;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getCategoryColor() { return categoryColor; }
    public void setCategoryColor(String categoryColor) { this.categoryColor = categoryColor; }

    @JsonIgnore
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    @JsonProperty("tags")
    public List<String> getTagsList() {
        if (tags == null || tags.isBlank()) return Collections.emptyList();
        try {
            return MAPPER.readValue(tags, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of(tags);
        }
    }

    public void setTagsList(List<String> tagsList) {
        try {
            this.tags = MAPPER.writeValueAsString(tagsList);
        } catch (Exception e) {
            this.tags = "[]";
        }
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}
