package com.mediamanager.model;

import java.util.ArrayList;
import java.util.List;

public class MediaList {
    private int id;
    private String name;
    private String description;
    private String createdAt;
    private List<MediaListItem> items = new ArrayList<>();

    public MediaList() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public List<MediaListItem> getItems() { return items; }
    public void setItems(List<MediaListItem> items) { this.items = items; }

    public static class MediaListItem {
        private int mediaId;
        private int sortOrder;
        private Media media;
        private String note;
        private Double itemRating;

        public MediaListItem() {}

        public int getMediaId() { return mediaId; }
        public void setMediaId(int mediaId) { this.mediaId = mediaId; }

        public int getSortOrder() { return sortOrder; }
        public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

        public Media getMedia() { return media; }
        public void setMedia(Media media) { this.media = media; }

        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }

        public Double getItemRating() { return itemRating; }
        public void setItemRating(Double itemRating) { this.itemRating = itemRating; }
    }
}
