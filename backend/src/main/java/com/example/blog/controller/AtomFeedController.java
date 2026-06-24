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

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
public class AtomFeedController {

    private final ArticleMapper articleMapper;

    public AtomFeedController(ArticleMapper articleMapper) {
        this.articleMapper = articleMapper;
    }

    @GetMapping(value = "/atom.xml", produces = "application/atom+xml")
    public String atomFeed() throws ParserConfigurationException, TransformerException {
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder().newDocument();
        Element feed = doc.createElement("feed");
        feed.setAttribute("xmlns", "http://www.w3.org/2005/Atom");
        doc.appendChild(feed);

        addText(doc, feed, "title", "清 - 前端技术博客");
        addText(doc, feed, "subtitle", "分享前端开发、Vue、TypeScript 等技术文章与思考");
        addText(doc, feed, "link", "https://qing.dev");
        addSelfLink(doc, feed, "https://qing.dev/atom.xml");
        addText(doc, feed, "id", "https://qing.dev");
        addText(doc, feed, "updated", ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        List<Article> articles = articleMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Article>()
                        .orderByDesc(Article::getDate)
                        .last("LIMIT 20"));

        for (Article article : articles) {
            Element entry = doc.createElement("entry");
            addText(doc, entry, "title", article.getTitle());
            addLink(doc, entry, "https://qing.dev/article/" + article.getId());
            addText(doc, entry, "id", "https://qing.dev/article/" + article.getId());
            String desc = article.getContent().replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim();
            if (desc.length() > 300) desc = desc.substring(0, 300) + "...";
            addText(doc, entry, "summary", desc);
            if (article.getDate() != null) {
                addText(doc, entry, "updated", article.getDate().atStartOfDay(java.time.ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
            }
            if (article.getCategory() != null) {
                Element cat = doc.createElement("category");
                cat.setAttribute("term", article.getCategory());
                entry.appendChild(cat);
            }
            for (String tag : article.getTagsList()) {
                Element cat = doc.createElement("category");
                cat.setAttribute("term", tag);
                entry.appendChild(cat);
            }
            feed.appendChild(entry);
        }

        TransformerFactory.newInstance().newTransformer()
                .transform(new DOMSource(doc), new StreamResult(new java.io.StringWriter()));
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + printDocument(doc);
    }

    private void addText(Document doc, Element parent, String tag, String text) {
        if (text == null || text.isBlank()) return;
        Element el = doc.createElement(tag);
        el.setTextContent(text);
        parent.appendChild(el);
    }

    private void addSelfLink(Document doc, Element parent, String href) {
        Element link = doc.createElement("link");
        link.setAttribute("href", href);
        link.setAttribute("rel", "self");
        link.setAttribute("type", "application/atom+xml");
        parent.appendChild(link);
    }

    private void addLink(Document doc, Element parent, String href) {
        Element link = doc.createElement("link");
        link.setAttribute("href", href);
        parent.appendChild(link);
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