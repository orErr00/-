package com.mediamanager.route;

import com.google.gson.Gson;
import com.mediamanager.DatabaseManager;
import com.mediamanager.model.Tag;
import spark.Spark;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class TagRoutes {

    private static final Gson GSON = new Gson();

    public static void register() {
        Spark.get("/api/tags", (req, res) -> {
            res.type("application/json");
            List<Tag> tags = new ArrayList<>();
            String sql = "SELECT t.*, COUNT(mt.media_id) as media_count " +
                         "FROM tags t LEFT JOIN media_tags mt ON t.id = mt.tag_id " +
                         "GROUP BY t.id ORDER BY t.name ASC";
            try (Connection conn = DatabaseManager.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    tags.add(new Tag(rs.getInt("id"), rs.getString("name")));
                }
            } catch (SQLException e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
            return GSON.toJson(tags);
        });

        Spark.delete("/api/tags/:id", (req, res) -> {
            res.type("application/json");
            int id;
            try { id = Integer.parseInt(req.params("id")); }
            catch (NumberFormatException e) { res.status(400); return GSON.toJson(Map.of("error", "Invalid id")); }

            try (Connection conn = DatabaseManager.getConnection();
                 PreparedStatement ps = conn.prepareStatement("DELETE FROM tags WHERE id = ?")) {
                ps.setInt(1, id);
                int deleted = ps.executeUpdate();
                if (deleted == 0) {
                    res.status(404);
                    return GSON.toJson(Map.of("error", "Tag not found"));
                }
            } catch (SQLException e) {
                res.status(500);
                return GSON.toJson(Map.of("error", e.getMessage()));
            }
            res.status(204);
            return "";
        });
    }
}
