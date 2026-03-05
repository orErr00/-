package com.mediamanager;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.File;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.*;

public class AppTest {

    private File dbFile;

    @Before
    public void setUp() throws Exception {
        dbFile = File.createTempFile("test-media", ".db");
        dbFile.deleteOnExit();
        System.setProperty("db.url", "jdbc:sqlite:" + dbFile.getAbsolutePath());
        DatabaseManager.init();
    }

    @After
    public void tearDown() {
        System.clearProperty("db.url");
        if (dbFile != null) dbFile.delete();
    }

    @Test
    public void testDatabaseTablesCreated() throws Exception {
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement()) {
            ResultSet rs = stmt.executeQuery(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            );
            List<String> tables = new ArrayList<>();
            while (rs.next()) tables.add(rs.getString(1));
            assertTrue("media table should exist", tables.contains("media"));
            assertTrue("lists table should exist", tables.contains("lists"));
            assertTrue("list_items table should exist", tables.contains("list_items"));
            assertTrue("tags table should exist", tables.contains("tags"));
            assertTrue("media_tags table should exist", tables.contains("media_tags"));
        }
    }

    @Test
    public void testInsertAndQueryMedia() throws Exception {
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(
                "INSERT INTO media (title, type) VALUES ('Test Movie', 'movie')"
            );
            ResultSet rs = stmt.executeQuery("SELECT * FROM media WHERE title='Test Movie'");
            assertTrue("Inserted media should be retrievable", rs.next());
            assertEquals("movie", rs.getString("type"));
            assertEquals("Test Movie", rs.getString("title"));
        }
    }
}
