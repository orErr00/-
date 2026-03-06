package com.mediamanager;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseManager {

    private static String getDbUrl() {
        String sysProp = System.getProperty("db.url");
        if (sysProp != null) return sysProp;
        String envVar = System.getenv("DB_URL");
        if (envVar != null) return envVar;
        return "jdbc:sqlite:media.db";
    }

    private DatabaseManager() {}

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(getDbUrl());
    }

    public static void init() {
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("PRAGMA foreign_keys = ON");

            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS media (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    type TEXT NOT NULL CHECK(type IN ('movie','tv','book','game')),
                    cover_url TEXT,
                    description TEXT,
                    rating REAL,
                    review TEXT,
                    director TEXT,
                    author TEXT,
                    platform TEXT,
                    genre TEXT,
                    year INTEGER,
                    tags TEXT,
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                )
                """);

            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS lists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
                """);

            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS list_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    list_id INTEGER NOT NULL,
                    media_id INTEGER NOT NULL,
                    sort_order INTEGER DEFAULT 0,
                    FOREIGN KEY(list_id) REFERENCES lists(id) ON DELETE CASCADE,
                    FOREIGN KEY(media_id) REFERENCES media(id) ON DELETE CASCADE,
                    UNIQUE(list_id, media_id)
                )
                """);

            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS tags (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE
                )
                """);

            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS media_tags (
                    media_id INTEGER NOT NULL,
                    tag_id INTEGER NOT NULL,
                    PRIMARY KEY(media_id, tag_id),
                    FOREIGN KEY(media_id) REFERENCES media(id) ON DELETE CASCADE,
                    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
                )
                """);

            // Add note and item_rating to list_items if not already present
            try { stmt.executeUpdate("ALTER TABLE list_items ADD COLUMN note TEXT"); } catch (SQLException e) { /* column exists */ }
            try { stmt.executeUpdate("ALTER TABLE list_items ADD COLUMN item_rating REAL"); } catch (SQLException e) { /* column exists */ }

            System.out.println("Database initialized successfully.");
        } catch (SQLException e) {
            throw new RuntimeException("Failed to initialize database", e);
        }
    }
}
