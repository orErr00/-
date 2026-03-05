package com.mediamanager.model;

import java.util.ArrayList;
import java.util.List;

public class Media {
    private int id;
    private String title;
    private String type;
    private String coverUrl;
    private String description;
    private Double rating;
    private String review;
    private String director;
    private String author;
    private String platform;
    private String genre;
    private Integer year;
    private String tags;
    private String createdAt;
    private String updatedAt;

    public Media() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public String getReview() { return review; }
    public void setReview(String review) { this.review = review; }

    public String getDirector() { return director; }
    public void setDirector(String director) { this.director = director; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public List<String> getTagList() {
        List<String> list = new ArrayList<>();
        if (tags != null && !tags.isBlank()) {
            for (String t : tags.split(",")) {
                String trimmed = t.trim();
                if (!trimmed.isEmpty()) list.add(trimmed);
            }
        }
        return list;
    }
}
