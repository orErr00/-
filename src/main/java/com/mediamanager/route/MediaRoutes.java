package com.mediamanager.route;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mediamanager.DatabaseManager;
import com.mediamanager.model.Media;
import spark.Spark;

import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class MediaRoutes {

    private static final Gson GSON = new Gson();

    private static final String OMDB_API_KEY =
        System.getenv("OMDB_API_KEY") != null ? System.getenv("OMDB_API_KEY") : "trilogy";
    private static final String RAWG_API_KEY =
        System.getenv("RAWG_API_KEY") != null ? System.getenv("RAWG_API_KEY") : "";

    public static void register() {
        Spark.get("/api/media", (req, res) -> {
            res.type("application/json");
            String type = req.queryParams("type");
            String tag = req.queryParams("tag");
            String search = req.queryParams("search");

            List<Media> mediaList = new ArrayList<>();
            StringBuilder sql = new StringBuilder(
                "SELECT DISTINCT m.* FROM media m " +
                "LEFT JOIN media_tags mt ON m.id = mt.media_id " +
                "LEFT JOIN tags t ON mt.tag_id = t.id WHERE 1=1"
            );

            List<Object> params = new ArrayList<>();
            if (type != null && !type.isBlank()) {
                sql.append(" AND m.type = ?");
                params.add(type);
            }
            if (tag != null && !tag.isBlank()) {
                sql.append(" AND t.name = ?");
                params.add(tag);
            }
            if (search != null && !search.isBlank()) {
                sql.append(" AND (m.title LIKE ? OR m.description LIKE ?)");
                params.add("%" + search + "%");
                params.add("%" + search + "%");
            }
            sql.append(" ORDER BY m.created_at DESC");

            try (Connection conn = DatabaseManager.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                for (int i = 0; i < params.size(); i++) {
                    ps.setObject(i + 1, params.get(i));
                }
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    mediaList.add(mapRow(rs));
                }
            } catch (SQLException e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
            return GSON.toJson(mediaList);
        });

        Spark.post("/api/media", (req, res) -> {
            res.type("application/json");
            try {
                Media media = GSON.fromJson(req.body(), Media.class);
                if (media.getTitle() == null || media.getTitle().isBlank()) {
                    res.status(400);
                    return GSON.toJson(Map.of("error", "Title is required"));
                }
                if (media.getType() == null || !List.of("movie","tv","book","game").contains(media.getType())) {
                    res.status(400);
                    return GSON.toJson(Map.of("error", "Valid type is required (movie, tv, book, game)"));
                }

                try (Connection conn = DatabaseManager.getConnection()) {
                    conn.setAutoCommit(false);
                    String insertSql = """
                        INSERT INTO media (title, type, cover_url, description, rating, review,
                            director, author, platform, genre, year, tags)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """;
                    try (PreparedStatement ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                        ps.setString(1, media.getTitle());
                        ps.setString(2, media.getType());
                        ps.setString(3, media.getCoverUrl());
                        ps.setString(4, media.getDescription());
                        ps.setObject(5, media.getRating());
                        ps.setString(6, media.getReview());
                        ps.setString(7, media.getDirector());
                        ps.setString(8, media.getAuthor());
                        ps.setString(9, media.getPlatform());
                        ps.setString(10, media.getGenre());
                        ps.setObject(11, media.getYear());
                        ps.setString(12, media.getTags());
                        ps.executeUpdate();
                        ResultSet keys = ps.getGeneratedKeys();
                        if (keys.next()) {
                            media.setId(keys.getInt(1));
                        }
                    }
                    syncTags(conn, media.getId(), media.getTags());
                    conn.commit();
                }
                res.status(201);
                return GSON.toJson(media);
            } catch (Exception e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
        });

        Spark.get("/api/media/:id", (req, res) -> {
            res.type("application/json");
            int id;
            try { id = Integer.parseInt(req.params("id")); }
            catch (NumberFormatException e) { res.status(400); return GSON.toJson(Map.of("error", "Invalid id")); }

            try (Connection conn = DatabaseManager.getConnection();
                 PreparedStatement ps = conn.prepareStatement("SELECT * FROM media WHERE id = ?")) {
                ps.setInt(1, id);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    return GSON.toJson(mapRow(rs));
                }
            } catch (SQLException e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
            res.status(404);
            return GSON.toJson(Map.of("error", "Media not found"));
        });

        Spark.put("/api/media/:id", (req, res) -> {
            res.type("application/json");
            int id;
            try { id = Integer.parseInt(req.params("id")); }
            catch (NumberFormatException e) { res.status(400); return GSON.toJson(Map.of("error", "Invalid id")); }

            try {
                Media media = GSON.fromJson(req.body(), Media.class);
                if (media.getTitle() == null || media.getTitle().isBlank()) {
                    res.status(400);
                    return GSON.toJson(Map.of("error", "Title is required"));
                }

                try (Connection conn = DatabaseManager.getConnection()) {
                    conn.setAutoCommit(false);
                    String updateSql = """
                        UPDATE media SET title=?, type=?, cover_url=?, description=?, rating=?,
                            review=?, director=?, author=?, platform=?, genre=?, year=?, tags=?,
                            updated_at=datetime('now')
                        WHERE id=?
                        """;
                    try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                        ps.setString(1, media.getTitle());
                        ps.setString(2, media.getType());
                        ps.setString(3, media.getCoverUrl());
                        ps.setString(4, media.getDescription());
                        ps.setObject(5, media.getRating());
                        ps.setString(6, media.getReview());
                        ps.setString(7, media.getDirector());
                        ps.setString(8, media.getAuthor());
                        ps.setString(9, media.getPlatform());
                        ps.setString(10, media.getGenre());
                        ps.setObject(11, media.getYear());
                        ps.setString(12, media.getTags());
                        ps.setInt(13, id);
                        int updated = ps.executeUpdate();
                        if (updated == 0) {
                            conn.rollback();
                            res.status(404);
                            return GSON.toJson(Map.of("error", "Media not found"));
                        }
                    }
                    syncTags(conn, id, media.getTags());
                    conn.commit();
                    media.setId(id);
                }
                return GSON.toJson(media);
            } catch (Exception e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
        });

        Spark.delete("/api/media/:id", (req, res) -> {
            res.type("application/json");
            int id;
            try { id = Integer.parseInt(req.params("id")); }
            catch (NumberFormatException e) { res.status(400); return GSON.toJson(Map.of("error", "Invalid id")); }

            try (Connection conn = DatabaseManager.getConnection();
                 PreparedStatement ps = conn.prepareStatement("DELETE FROM media WHERE id = ?")) {
                ps.setInt(1, id);
                int deleted = ps.executeUpdate();
                if (deleted == 0) {
                    res.status(404);
                    return GSON.toJson(Map.of("error", "Media not found"));
                }
            } catch (SQLException e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
            res.status(204);
            return "";
        });

        Spark.post("/api/fetch", (req, res) -> {
            res.type("application/json");
            try {
                JsonObject body = JsonParser.parseString(req.body()).getAsJsonObject();
                String title = body.has("title") ? body.get("title").getAsString() : "";
                String type = body.has("type") ? body.get("type").getAsString() : "movie";

                if (title.isBlank()) {
                    res.status(400);
                    return GSON.toJson(Map.of("error", "Title is required"));
                }

                Media media = fetchMediaInfo(title, type);
                return GSON.toJson(media);
            } catch (Exception e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
        });
    }

    private static Media fetchMediaInfo(String title, String type) {
        Media media = new Media();
        media.setTitle(title);
        media.setType(type);

        try {
            String encodedTitle = URLEncoder.encode(title, StandardCharsets.UTF_8);
            if ("book".equals(type)) {
                fetchFromOpenLibrary(media, encodedTitle);
            } else if ("game".equals(type)) {
                fetchFromRawg(media, encodedTitle);
            } else {
                fetchFromOmdb(media, encodedTitle, type);
            }
        } catch (Exception e) {
            System.err.println("Auto-fetch failed: " + e.getMessage());
        }
        return media;
    }

    private static void fetchFromOpenLibrary(Media media, String encodedTitle) throws Exception {
        String url = "https://openlibrary.org/search.json?title=" + encodedTitle + "&limit=1";
        JsonObject json = httpGet(url);
        if (json == null) return;

        if (json.has("docs") && json.getAsJsonArray("docs").size() > 0) {
            JsonObject doc = json.getAsJsonArray("docs").get(0).getAsJsonObject();
            if (doc.has("title")) media.setTitle(doc.get("title").getAsString());
            if (doc.has("first_publish_year")) media.setYear(doc.get("first_publish_year").getAsInt());
            if (doc.has("author_name") && doc.getAsJsonArray("author_name").size() > 0) {
                media.setAuthor(doc.getAsJsonArray("author_name").get(0).getAsString());
            }
            if (doc.has("subject") && doc.getAsJsonArray("subject").size() > 0) {
                media.setGenre(doc.getAsJsonArray("subject").get(0).getAsString());
            }
            if (doc.has("cover_i")) {
                int coverId = doc.get("cover_i").getAsInt();
                media.setCoverUrl("https://covers.openlibrary.org/b/id/" + coverId + "-L.jpg");
            }
        }
    }

    private static void fetchFromOmdb(Media media, String encodedTitle, String type) throws Exception {
        String url = "https://www.omdbapi.com/?t=" + encodedTitle + "&apikey=" + OMDB_API_KEY;
        JsonObject json = httpGet(url);
        if (json == null) return;

        if (json.has("Response") && "True".equals(json.get("Response").getAsString())) {
            if (json.has("Title")) media.setTitle(json.get("Title").getAsString());
            if (json.has("Plot") && !"N/A".equals(json.get("Plot").getAsString()))
                media.setDescription(json.get("Plot").getAsString());
            if (json.has("Director") && !"N/A".equals(json.get("Director").getAsString()))
                media.setDirector(json.get("Director").getAsString());
            if (json.has("Genre") && !"N/A".equals(json.get("Genre").getAsString()))
                media.setGenre(json.get("Genre").getAsString());
            if (json.has("Poster") && !"N/A".equals(json.get("Poster").getAsString()))
                media.setCoverUrl(json.get("Poster").getAsString());
            if (json.has("Year") && !"N/A".equals(json.get("Year").getAsString())) {
                try { media.setYear(Integer.parseInt(json.get("Year").getAsString().replaceAll("[^0-9]", ""))); }
                catch (NumberFormatException ignored) {}
            }
            if (json.has("imdbRating") && !"N/A".equals(json.get("imdbRating").getAsString())) {
                try {
                    double imdbRating = Double.parseDouble(json.get("imdbRating").getAsString());
                    media.setRating(Math.min(5.0, imdbRating / 2.0));
                } catch (NumberFormatException ignored) {}
            }
        }
    }

    private static void fetchFromRawg(Media media, String encodedTitle) throws Exception {
        String url = "https://api.rawg.io/api/games?search=" + encodedTitle + "&page_size=1&key=" + RAWG_API_KEY;
        JsonObject json = httpGet(url);
        if (json == null) return;

        if (json.has("results") && json.getAsJsonArray("results").size() > 0) {
            JsonObject game = json.getAsJsonArray("results").get(0).getAsJsonObject();
            if (game.has("name")) media.setTitle(game.get("name").getAsString());
            if (game.has("released") && !game.get("released").isJsonNull()) {
                String released = game.get("released").getAsString();
                if (released.length() >= 4) {
                    try { media.setYear(Integer.parseInt(released.substring(0, 4))); }
                    catch (NumberFormatException ignored) {}
                }
            }
            if (game.has("background_image") && !game.get("background_image").isJsonNull()) {
                media.setCoverUrl(game.get("background_image").getAsString());
            }
            if (game.has("rating") && !game.get("rating").isJsonNull()) {
                double rawgRating = game.get("rating").getAsDouble();
                media.setRating(Math.min(5.0, rawgRating));
            }
            if (game.has("platforms") && !game.get("platforms").isJsonNull()) {
                var platforms = game.getAsJsonArray("platforms");
                if (platforms.size() > 0) {
                    var p = platforms.get(0).getAsJsonObject();
                    if (p.has("platform")) {
                        media.setPlatform(p.getAsJsonObject("platform").get("name").getAsString());
                    }
                }
            }
        }
    }

    private static JsonObject httpGet(String urlStr) {
        try {
            URI uri = new URI(urlStr);
            HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setRequestProperty("User-Agent", "MediaManager/1.0");
            int code = conn.getResponseCode();
            if (code == 200) {
                try (var reader = new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)) {
                    return JsonParser.parseReader(reader).getAsJsonObject();
                }
            }
        } catch (Exception e) {
            System.err.println("HTTP GET failed for " + urlStr + ": " + e.getMessage());
        }
        return null;
    }

    private static void syncTags(Connection conn, int mediaId, String tagsStr) throws SQLException {
        try (PreparedStatement del = conn.prepareStatement("DELETE FROM media_tags WHERE media_id = ?")) {
            del.setInt(1, mediaId);
            del.executeUpdate();
        }
        if (tagsStr == null || tagsStr.isBlank()) return;

        for (String tagName : tagsStr.split(",")) {
            String name = tagName.trim();
            if (name.isEmpty()) continue;

            int tagId;
            try (PreparedStatement sel = conn.prepareStatement("SELECT id FROM tags WHERE name = ?")) {
                sel.setString(1, name);
                ResultSet rs = sel.executeQuery();
                if (rs.next()) {
                    tagId = rs.getInt(1);
                } else {
                    try (PreparedStatement ins = conn.prepareStatement(
                            "INSERT INTO tags (name) VALUES (?)", Statement.RETURN_GENERATED_KEYS)) {
                        ins.setString(1, name);
                        ins.executeUpdate();
                        ResultSet keys = ins.getGeneratedKeys();
                        keys.next();
                        tagId = keys.getInt(1);
                    }
                }
            }
            try (PreparedStatement link = conn.prepareStatement(
                    "INSERT OR IGNORE INTO media_tags (media_id, tag_id) VALUES (?, ?)")) {
                link.setInt(1, mediaId);
                link.setInt(2, tagId);
                link.executeUpdate();
            }
        }
    }

    static Media mapRow(ResultSet rs) throws SQLException {
        Media m = new Media();
        m.setId(rs.getInt("id"));
        m.setTitle(rs.getString("title"));
        m.setType(rs.getString("type"));
        m.setCoverUrl(rs.getString("cover_url"));
        m.setDescription(rs.getString("description"));
        double rating = rs.getDouble("rating");
        m.setRating(rs.wasNull() ? null : rating);
        m.setReview(rs.getString("review"));
        m.setDirector(rs.getString("director"));
        m.setAuthor(rs.getString("author"));
        m.setPlatform(rs.getString("platform"));
        m.setGenre(rs.getString("genre"));
        int year = rs.getInt("year");
        m.setYear(rs.wasNull() ? null : year);
        m.setTags(rs.getString("tags"));
        m.setCreatedAt(rs.getString("created_at"));
        m.setUpdatedAt(rs.getString("updated_at"));
        return m;
    }
}
