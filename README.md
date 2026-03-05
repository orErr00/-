# 🎬 MediaVault — Personal Media Manager

A full-stack personal media management web application for tracking movies, TV shows, books, and games.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17 + Spark Java 2.9.4 |
| Database | SQLite (sqlite-jdbc 3.45.3.0) |
| JSON | Gson 2.10.1 |
| Web scraping | Jsoup 1.17.2 |
| Build | Maven |
| Frontend | Pure HTML + CSS + JavaScript (no framework) |

## Features

- **Dashboard** with stats and recently added items
- **Media tracking** for movies, TV shows, books, and games
- **Auto-fetch** metadata from OpenLibrary (books), OMDB (movies/TV), RAWG (games)
- **Star ratings** and personal reviews
- **Custom lists** with drag-and-drop reordering
- **Tags** for flexible organization and filtering
- **Dark/Light mode** toggle
- **Responsive** design for mobile and desktop

## Quick Start

```bash
# Build
mvn package -q

# Run
java -jar target/media-manager-1.0.0-jar-with-dependencies.jar
```

Then open [http://localhost:8080](http://localhost:8080).

The SQLite database (`media.db`) is created automatically in the current directory.

## API Endpoints

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/media?type=&tag=&search=` | List media (filterable) |
| POST | `/api/media` | Create media |
| GET | `/api/media/:id` | Get single item |
| PUT | `/api/media/:id` | Update item |
| DELETE | `/api/media/:id` | Delete item |
| POST | `/api/fetch` | Auto-fetch metadata |

### Lists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lists` | All lists |
| POST | `/api/lists` | Create list |
| GET | `/api/lists/:id` | List with items |
| PUT | `/api/lists/:id` | Update list |
| DELETE | `/api/lists/:id` | Delete list |
| POST | `/api/lists/:id/items` | Add item to list |
| DELETE | `/api/lists/:id/items/:mediaId` | Remove item |
| PUT | `/api/lists/:id/reorder` | Reorder items |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | All tags |
| DELETE | `/api/tags/:id` | Delete tag |

## Project Structure

```
src/
├── main/
│   ├── java/com/mediamanager/
│   │   ├── App.java              # Entry point
│   │   ├── DatabaseManager.java  # SQLite setup
│   │   ├── model/                # Data models
│   │   └── route/                # API route handlers
│   └── resources/public/         # Frontend (HTML/CSS/JS)
└── test/
    └── java/com/mediamanager/
        └── AppTest.java
```