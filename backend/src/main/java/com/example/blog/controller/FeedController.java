package com.example.blog.controller;

import com.example.blog.entity.Article;
import com.example.blog.mapper.ArticleMapper;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.io.StringWriter;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
public class FeedController {

    private final ArticleMapper articleMapper;

    public FeedController(ArticleMapper articleMapper) {
        this.articleMapper = articleMapper;
    }

    @GetMapping(value = "/feed.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String feed() throws ParserConfigurationException, TransformerException {
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder().newDocument();
        Element rss = doc.createElement("rss");
        rss.setAttribute("version", "2.0");
        rss.setAttribute("xmlns:atom", "http://www.w3.org/2005/Atom");
        doc.appendChild(rss);

        Element channel = doc.createElement("channel");
        rss.appendChild(channel);

        addText(doc, channel, "title", "清 - 前端技术博客");
        addText(doc, channel, "link", "https://qing.dev");
        addText(doc, channel, "description", "分享前端开发、Vue、TypeScript 等技术文章与思考");
        addText(doc, channel, "language", "zh-CN");
        addText(doc, channel, "lastBuildDate", ZonedDateTime.now().format(DateTimeFormatter.RFC_1123_DATE_TIME));

        // Atom self link
        Element atomLink = doc.createElement("atom:link");
        atomLink.setAttribute("href", "https://qing.dev/feed.xml");
        atomLink.setAttribute("rel", "self");
        atomLink.setAttribute("type", "application/rss+xml");
        channel.appendChild(atomLink);

        List<Article> articles = articleMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Article>()
                        .orderByDesc(Article::getDate)
                        .last("LIMIT 20"));

        DateTimeFormatter rfc1123 = DateTimeFormatter.RFC_1123_DATE_TIME;
        for (Article article : articles) {
            Element item = doc.createElement("item");
            addText(doc, item, "title", article.getTitle());
            addText(doc, item, "link", "https://qing.dev/article/" + article.getId());
            addText(doc, item, "guid", "https://qing.dev/article/" + article.getId());
            String desc = article.getContent().replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim();
            if (desc.length() > 300) desc = desc.substring(0, 300) + "...";
            addCdata(doc, item, "description", desc);
            if (article.getDate() != null) {
                addText(doc, item, "pubDate", article.getDate().atStartOfDay(java.time.ZoneOffset.UTC).format(rfc1123));
            }
            if (article.getCategory() != null) {
                addText(doc, item, "category", article.getCategory());
            }
            for (String tag : article.getTagsList()) {
                addText(doc, item, "category", tag);
            }
            channel.appendChild(item);
        }

        TransformerFactory.newInstance().newTransformer()
                .transform(new DOMSource(doc), new StreamResult(new StringWriter()));
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + printDocument(doc);
    }

    private void addText(Document doc, Element parent, String tag, String text) {
        if (text == null || text.isBlank()) return;
        Element el = doc.createElement(tag);
        el.setTextContent(text);
        parent.appendChild(el);
    }

    private void addCdata(Document doc, Element parent, String tag, String text) {
        if (text == null || text.isBlank()) return;
        Element el = doc.createElement(tag);
        el.appendChild(doc.createCDATASection(text));
        parent.appendChild(el);
    }

    private String printDocument(Document doc) {
        try {
            javax.xml.transform.Transformer tf =
                    javax.xml.transform.TransformerFactory.newInstance().newTransformer();
            tf.setOutputProperty(javax.xml.transform.OutputKeys.OMIT_XML_DECLARATION, "yes");
            tf.setOutputProperty(javax.xml.transform.OutputKeys.INDENT, "yes");
            java.io.StringWriter sw = new java.io.StringWriter();
            tf.transform(new javax.xml.transform.dom.DOMSource(doc),
                    new javax.xml.transform.stream.StreamResult(sw));
            return sw.toString();
        } catch (Exception e) {
            return "";
        }
    }
}