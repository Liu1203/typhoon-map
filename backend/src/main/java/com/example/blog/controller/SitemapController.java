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
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
public class SitemapController {

    private final ArticleMapper articleMapper;

    public SitemapController(ArticleMapper articleMapper) {
        this.articleMapper = articleMapper;
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() throws ParserConfigurationException, TransformerException {
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder().newDocument();
        Element urlset = doc.createElement("urlset");
        urlset.setAttribute("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");
        doc.appendChild(urlset);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        addUrl(doc, urlset, "/home", "1.0", null);
        addUrl(doc, urlset, "/articles", "0.8", null);
        addUrl(doc, urlset, "/about", "0.6", null);
        addUrl(doc, urlset, "/thoughts", "0.6", null);

        List<Article> articles = articleMapper.selectList(null);
        for (Article article : articles) {
            String dateStr = article.getDate() != null ? article.getDate().format(fmt) : null;
            addUrl(doc, urlset, "/article/" + article.getId(), "0.9", dateStr);
        }

        TransformerFactory.newInstance().newTransformer()
                .transform(new DOMSource(doc), new StreamResult(new StringWriter()));
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                printDocument(doc);
    }

    private void addUrl(Document doc, Element urlset, String path, String priority, String lastmod) {
        Element url = doc.createElement("url");
        Element loc = doc.createElement("loc");
        loc.setTextContent("https://qing.dev" + path);
        url.appendChild(loc);
        if (priority != null) {
            Element prio = doc.createElement("priority");
            prio.setTextContent(priority);
            url.appendChild(prio);
        }
        if (lastmod != null) {
            Element lm = doc.createElement("lastmod");
            lm.setTextContent(lastmod);
            url.appendChild(lm);
        }
        urlset.appendChild(url);
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