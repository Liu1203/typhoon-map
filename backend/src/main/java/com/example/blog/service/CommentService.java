package com.example.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.blog.dto.CreateCommentParams;
import com.example.blog.entity.Comment;
import com.example.blog.mapper.CommentMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommentService {

    private final CommentMapper commentMapper;

    public CommentService(CommentMapper commentMapper) {
        this.commentMapper = commentMapper;
    }

    public List<Comment> getCommentsByArticleId(Long articleId) {
        return commentMapper.selectList(
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getArticleId, articleId)
                        .orderByAsc(Comment::getCreatedAt));
    }

    public Comment createComment(CreateCommentParams params) {
        Comment comment = new Comment();
        comment.setArticleId(params.getArticleId());
        comment.setAuthor(params.getAuthor());
        comment.setAuthorAvatar(params.getAuthorAvatar());
        comment.setContent(params.getContent());

        if (params.getParentId() != null) {
            Comment parent = commentMapper.selectById(params.getParentId());
            if (parent != null) {
                comment.setParentId(parent.getParentId() != null ? parent.getParentId() : params.getParentId());
            }
        }

        comment.setCreatedAt(LocalDateTime.now());
        commentMapper.insert(comment);
        return comment;
    }

    public void deleteComment(Long commentId) {
        Comment comment = commentMapper.selectById(commentId);
        if (comment == null) {
            throw new IllegalArgumentException("评论不存在");
        }
        deleteDescendants(commentId);
        commentMapper.deleteById(commentId);
    }

    private void deleteDescendants(Long parentId) {
        List<Comment> children = commentMapper.selectList(
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getParentId, parentId));
        for (Comment child : children) {
            deleteDescendants(child.getId());
            commentMapper.deleteById(child.getId());
        }
    }
}
