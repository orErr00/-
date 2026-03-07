# MediaVault + Article Layout & Export Module

A personal media management web application with an integrated article layout and export module.

## Modules

### 🎬 MediaVault — Personal Media Manager

A full-stack personal media management web application for tracking movies, TV shows, books, and games.

**Tech Stack:** Java 17 + Spark Java · SQLite · Gson · Jsoup · Maven · Pure HTML/CSS/JS

### 📝 Article Layout & Export Module

A React-based article layout editor with real-time preview and export capabilities, similar to Word + Obsidian + 小红书长文卡片生成器.

**Tech Stack:** React 19 + Vite · markdown-it · html2canvas · jsPDF

**Features:**
- Two editing modes: Markdown and Plain Text
- Four built-in themes: light, reading, xiaohongshu, dark
- Typography controls: font, size, line height, letter spacing, paragraph spacing, text indent, content width
- Huiwen Mincho font support via @font-face
- Real-time reading info (word count + estimated reading time)
- Export to PNG and PDF
- Long-image splitting (3:4, 2:3, 9:16) with smart block-element cut points

## Quick Start

### MediaVault (Java backend)

```bash
mvn package -q
java -jar target/media-manager-1.0.0-jar-with-dependencies.jar
```

Open [http://localhost:8080](http://localhost:8080).

### Article Layout Editor (React frontend)

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).
