package com.mediamanager.route;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mediamanager.DatabaseManager;
import com.mediamanager.model.MediaList;
import spark.Spark;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ListRoutes {

    private static final Gson GSON = new Gson();

    public static void register() {
        Spark.get("/api/lists", (req, res) -> {
            res.type("application/json");
            List<MediaList> lists = new ArrayList<>();
            String sql = """
                SELECT l.*, COUNT(li.id) as item_count
                FROM lists l
                LEFT JOIN list_items li ON l.id = li.list_id
                GROUP BY l.id
                ORDER BY l.created_at DESC
                """;
            try (Connection conn = DatabaseManager.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lists.add(mapRow(rs, false));
                }
            } catch (SQLException e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
            return GSON.toJson(lists);
        });

        Spark.post("/api/lists", (req, res) -> {
            res.type("application/json");
            try {
                JsonObject body = JsonParser.parseString(req.body()).getAsJsonObject();
                String name = body.has("name") ? body.get("name").getAsString() : "";
                String description = body.has("description") ? body.get("description").getAsString() : null;

                if (name.isBlank()) {
                    res.status(400);
                    return GSON.toJson(Map.of("error", "Name is required"));
                }

                try (Connection conn = DatabaseManager.getConnection();
                     PreparedStatement ps = conn.prepareStatement(
                         "INSERT INTO lists (name, description) VALUES (?, ?)",
                         Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1, name);
                    ps.setString(2, description);
                    ps.executeUpdate();
                    ResultSet keys = ps.getGeneratedKeys();
                    keys.next();
                    int id = keys.getInt(1);

                    try (PreparedStatement sel = conn.prepareStatement("SELECT * FROM lists WHERE id = ?")) {
                        sel.setInt(1, id);
                        ResultSet selRs = sel.executeQuery();
                        selRs.next();
                        res.status(201);
                        return GSON.toJson(mapRow(selRs, false));
                    }
                }
            } catch (Exception e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
        });

        Spark.get("/api/lists/:id", (req, res) -> {
            res.type("application/json");
            int id;
            try { id = Integer.parseInt(req.params("id")); }
            catch (NumberFormatException e) { res.status(400); return GSON.toJson(Map.of("error", "Invalid id")); }

            try (Connection conn = DatabaseManager.getConnection()) {
                try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM lists WHERE id = ?")) {
                    ps.setInt(1, id);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) {
                        res.status(404);
                        return GSON.toJson(Map.of("error", "List not found"));
                    }
                    MediaList list = mapRow(rs, false);
                    list.setItems(fetchItems(conn, id));
                    return GSON.toJson(list);
                }
            } catch (SQLException e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
        });

        Spark.put("/api/lists/:id", (req, res) -> {
            res.type("application/json");
            int id;
            try { id = Integer.parseInt(req.params("id")); }
            catch (NumberFormatException e) { res.status(400); return GSON.toJson(Map.of("error", "Invalid id")); }

            try {
                JsonObject body = JsonParser.parseString(req.body()).getAsJsonObject();
                String name = body.has("name") ? body.get("name").getAsString() : "";
                String description = body.has("description") ? body.get("description").getAsString() : null;

                if (name.isBlank()) {
                    res.status(400);
                    return GSON.toJson(Map.of("error", "Name is required"));
                }

                try (Connection conn = DatabaseManager.getConnection();
                     PreparedStatement ps = conn.prepareStatement(
                         "UPDATE lists SET name = ?, description = ? WHERE id = ?")) {
                    ps.setString(1, name);
                    ps.setString(2, description);
                    ps.setInt(3, id);
                    int updated = ps.executeUpdate();
                    if (updated == 0) {
                        res.status(404);
                        return GSON.toJson(Map.of("error", "List not found"));
                    }
                    try (PreparedStatement sel = conn.prepareStatement("SELECT * FROM lists WHERE id = ?")) {
                        sel.setInt(1, id);
                        ResultSet rs = sel.executeQuery();
                        rs.next();
                        return GSON.toJson(mapRow(rs, false));
                    }
                }
            } catch (Exception e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
        });

        Spark.delete("/api/lists/:id", (req, res) -> {
            res.type("application/json");
            int id;
            try { id = Integer.parseInt(req.params("id")); }
            catch (NumberFormatException e) { res.status(400); return GSON.toJson(Map.of("error", "Invalid id")); }

            try (Connection conn = DatabaseManager.getConnection();
                 PreparedStatement ps = conn.prepareStatement("DELETE FROM lists WHERE id = ?")) {
                ps.setInt(1, id);
                int deleted = ps.executeUpdate();
                if (deleted == 0) {
                    res.status(404);
                    return GSON.toJson(Map.of("error", "List not found"));
                }
            } catch (SQLException e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
            res.status(204);
            return "";
        });

        Spark.post("/api/lists/:id/items", (req, res) -> {
            res.type("application/json");
            int listId;
            try { listId = Integer.parseInt(req.params("id")); }
            catch (NumberFormatException e) { res.status(400); return GSON.toJson(Map.of("error", "Invalid id")); }

            try {
                JsonObject body = JsonParser.parseString(req.body()).getAsJsonObject();
                if (!body.has("mediaId")) {
                    res.status(400);
                    return GSON.toJson(Map.of("error", "mediaId is required"));
                }
                int mediaId = body.get("mediaId").getAsInt();

                try (Connection conn = DatabaseManager.getConnection()) {
                    try (PreparedStatement check = conn.prepareStatement("SELECT id FROM lists WHERE id = ?")) {
                        check.setInt(1, listId);
                        if (!check.executeQuery().next()) {
                            res.status(404);
                            return GSON.toJson(Map.of("error", "List not found"));
                        }
                    }
                    try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT OR IGNORE INTO list_items (list_id, media_id, sort_order) " +
                        "SELECT ?, ?, COALESCE(MAX(sort_order),0)+1 FROM list_items WHERE list_id = ?")) {
                        ps.setInt(1, listId);
                        ps.setInt(2, mediaId);
                        ps.setInt(3, listId);
                        ps.executeUpdate();
                    }
                    MediaList list = new MediaList();
                    list.setId(listId);
                    list.setItems(fetchItems(conn, listId));
                    res.status(201);
                    return GSON.toJson(list);
                }
            } catch (Exception e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
        });

        Spark.delete("/api/lists/:id/items/:mediaId", (req, res) -> {
            res.type("application/json");
            int listId, mediaId;
            try {
                listId = Integer.parseInt(req.params("id"));
                mediaId = Integer.parseInt(req.params("mediaId"));
            } catch (NumberFormatException e) {
                res.status(400);
                return GSON.toJson(Map.of("error", "Invalid id"));
            }

            try (Connection conn = DatabaseManager.getConnection();
                 PreparedStatement ps = conn.prepareStatement(
                     "DELETE FROM list_items WHERE list_id = ? AND media_id = ?")) {
                ps.setInt(1, listId);
                ps.setInt(2, mediaId);
                ps.executeUpdate();
            } catch (SQLException e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
            res.status(204);
            return "";
        });

        Spark.put("/api/lists/:id/reorder", (req, res) -> {
            res.type("application/json");
            int listId;
            try { listId = Integer.parseInt(req.params("id")); }
            catch (NumberFormatException e) { res.status(400); return GSON.toJson(Map.of("error", "Invalid id")); }

            try {
                var arr = JsonParser.parseString(req.body()).getAsJsonArray();
                try (Connection conn = DatabaseManager.getConnection()) {
                    conn.setAutoCommit(false);
                    try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE list_items SET sort_order = ? WHERE list_id = ? AND media_id = ?")) {
                        for (var elem : arr) {
                            JsonObject item = elem.getAsJsonObject();
                            int mediaId = item.get("mediaId").getAsInt();
                            int order = item.get("order").getAsInt();
                            ps.setInt(1, order);
                            ps.setInt(2, listId);
                            ps.setInt(3, mediaId);
                            ps.addBatch();
                        }
                        ps.executeBatch();
                    }
                    conn.commit();
                }
                return GSON.toJson(Map.of("success", true));
            } catch (Exception e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
        });
    }

    private static List<MediaList.MediaListItem> fetchItems(Connection conn, int listId) throws SQLException {
        List<MediaList.MediaListItem> items = new ArrayList<>();
        String sql = """
            SELECT li.media_id, li.sort_order, m.*
            FROM list_items li
            JOIN media m ON li.media_id = m.id
            WHERE li.list_id = ?
            ORDER BY li.sort_order ASC
            """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, listId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                MediaList.MediaListItem item = new MediaList.MediaListItem();
                item.setMediaId(rs.getInt("media_id"));
                item.setSortOrder(rs.getInt("sort_order"));
                item.setMedia(MediaRoutes.mapRow(rs));
                items.add(item);
            }
        }
        return items;
    }

    private static MediaList mapRow(ResultSet rs, boolean withItems) throws SQLException {
        MediaList list = new MediaList();
        list.setId(rs.getInt("id"));
        list.setName(rs.getString("name"));
        list.setDescription(rs.getString("description"));
        list.setCreatedAt(rs.getString("created_at"));
        return list;
    }
}
