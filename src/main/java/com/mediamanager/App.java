package com.mediamanager;

import com.mediamanager.route.ListRoutes;
import com.mediamanager.route.MediaRoutes;
import com.mediamanager.route.TagRoutes;
import spark.Spark;

public class App {
    public static void main(String[] args) {
        int port = 8080;
        Spark.port(port);
        Spark.staticFiles.location("/public");

        DatabaseManager.init();

        Spark.before((req, res) -> {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type");
        });

        Spark.options("/*", (req, res) -> {
            res.status(200);
            return "OK";
        });

        MediaRoutes.register();
        ListRoutes.register();
        TagRoutes.register();

        System.out.println("Media Manager started at http://localhost:" + port);
    }
}
