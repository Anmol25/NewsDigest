# NewsDigest: AI-Powered News Aggregator and Summarizer

## Description
**NewsDigest** is an intelligent news aggregator that collects articles from multiple sources, eliminates duplicates using semantic similarity, summarizes content using AI, and personalizes user feeds based on preferences and interactions. Built with FastAPI and ReactJS, it provides a seamless and informative news consumption experience.

## Table of Contents
- [Features](#features)
- [Project Snapshots](#project-snapshots)
- [Tech Stack](#tech-stack)
- [⚙️ Installation](#️installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup (Using Docker)](#database-setup-using-docker)
- [🧩 Modules Overview](#-modules-overview)
  - [1. Feed Aggregator](#1-feed-aggregator)
  - [2. Deduplication Algorithm](#2-deduplication-algorithm)
  - [3. Summarizer](#3-summarizer)
  - [4. Recommendation System](#4-recommendation-system)
  - [5. Search Engine](#5-search-engine)
  - [6. Authentication System](#6-authentication-system)
  - [7. User Operations Module](#7-user-operations-module)
  - [8. User Management System](#8-user-management-system)

---

## Features
- 📰 Aggregates news from multiple RSS feeds
- 🤖 AI-generated summaries using DistilBART
- 🧠 Deduplication using SBERT embeddings + cosine similarity
- 🔍 Contextual and keyword-based search
- ❤️ User interactions: likes, bookmarks, history
- 📌 Personalized feed based on user reading history
- 🔐 JWT-based user authentication

## Project Snapshots

![Home](images/home.gif)

<p align="center"><img src="images/recommendation.png" width=50% alt="Home"><img src="images/search.png" width=50% alt="Home"></p>

<p align="center"><img src="images/subscriptions.png" width=50% alt="Home"><img src="images/source.png" width=50% alt="Home"></p>

<p align="center"><img src="images/Liked.png" width=50% alt="Home"><img src="images/bookmarked.png" width=50% alt="Home"></p>

<p align="center"><img src="images/profile.png" width=50% alt="Home"><img src="images/history.png" width=50% alt="Home"></p>

<p><strong>Generating Summaries</strong></p>
<p align="center"><img src="images/summary.gif" width=50% alt="Summary"></p>

## Tech Stack
- **Frontend:** ReactJS
- **Backend:** FastAPI, SQLAlchemy
- **Database:** PostgreSQL + pgvector (To store embeddings)
- **AI Models:** DistilBART (To generate summaries), SBERT (To generate contextual embeddings)
- **Libraries:** Pytorch, Transformers (HuggingFace), Feedparser (To parse RSS Feeds), Newspaper3K (To extract Article Text)
- **Other Tools:** Docker (For Database), Git etc. 

## ⚙️ Installation

### Backend Setup

1. Navigate to the backend directory:
    ```bash
    cd apps/backend
    ```
2. Create and activate a virtual environment:
    ```bash
    python -m venv .venv
    source .venv/bin/activate
    ```
3. Install the required Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4. (Optional for Windows users) If you have a CUDA-enabled GPU, install the GPU version of PyTorch:  
   Example for CUDA 12.6:
    ```bash
    pip install torch --index-url https://download.pytorch.org/whl/cu126
    ```
5. Run the backend server:
    ```bash
    uvicorn main:app
    ```

---

### Frontend Setup

1. Navigate to the frontend directory:
    ```bash
    cd apps/frontend
    ```
2. Install the required Node.js dependencies:
    ```bash
    npm install
    ```
3. Start the development server (for local development):
    ```bash
    npm run dev
    ```

4. **Build the production-ready app:**
    ```bash
    npm run build
    ```

5. **Serve the production build locally:**
    ```bash
    serve -s dist
    ```

---

### Database Setup (Using Docker)

> **Recommended especially for Windows users.**

1. Pull the `pgvector` Docker image:
    ```bash
    docker pull pgvector/pgvector:pg17
    ```
2. Create a volume for persistent database storage:
    ```bash
    docker volume create pgvector-data
    ```
3. Run the PostgreSQL + pgvector Docker container:
    ```bash
    docker run --name pgvector-container \
        -e POSTGRES_PASSWORD=root \
        -e POSTGRES_DB=News-Feed \
        -p 5432:5432 \
        -v pgvector-data:/var/lib/postgresql/data \
        -d pgvector/pgvector:pg17
    ```

✅ On running the backend server, all required tables will be automatically created and initial data will be inserted using SQLAlchemy ORM.

---

## 🧩 Modules Overview

This section provides a detailed overview of the main modules that power **NewsDigest: AI-Powered News Aggregator and Summarizer**.

## 1. Feed Aggregator

**Purpose:**  
To periodically fetch and process news articles from multiple RSS feeds, deduplicate them, and prepare structured entries for storage and personalization.

**Inputs:**
- `feeds.yaml`: A configuration file containing RSS feed URLs and associated metadata (e.g., source name and topic).
- Aggregation interval (default: every 10 minutes).

**Processing / Logic:**
1. **Load Feed Sources:**  
   Reads `feeds.yaml` to retrieve RSS URLs and metadata (source, topic).

2. **Asynchronous Fetching:**  
   Uses **aiohttp** for concurrent HTTP requests to efficiently fetch raw RSS XML data.

3. **Parse Feed Items:**  
   Uses **feedparser** to extract and standardize items into fields: `title`, `link`, `published`, `image`, `source`, `topic`.

4. **Send to Deduplication Module:**  
   - Generate SBERT embeddings for titles.
   - Filter out semantically similar (duplicate) articles.

5. **Database Insertion Logic:**  
   - Insert if the article’s link does not exist.
   - Update if the link exists but with a newer published timestamp.
   - Ignore otherwise.

6. **Scheduled Execution:**  
   Runs on a separate thread and repeats at defined intervals.

**Outputs:**
- Structured articles ready for storage.
- Database entries: newly inserted or selectively updated articles.

---

## 2. Deduplication Algorithm

**Purpose:**  
To remove semantically similar articles based on the contextual similarity of their titles, ensuring a diverse news feed.

**Inputs:**
- A list of article dictionaries (each with a `title` field).
- A Sentence-BERT (SBERT) model instance.
- The target device for inference (`cpu` or `cuda`).

**Processing / Logic:**
- Extracts all titles from the input articles.
- Generates contextual embeddings for these titles using the SBERT model.
- Appends the generated embedding to each corresponding article dictionary.
- Computes pairwise cosine similarity between the embeddings to measure semantic closeness. The cosine similarity between two embeddings **A** and **B** is given by:

  $$ \mathrm{Cosine\ Similarity}\left(\vec{A},\vec{B}\right)=\frac{\vec{A}\cdot\vec{B}}{|\vec{A}|\cdot|\vec{B}|} $$

- If the similarity score exceeds a threshold of **0.9**, one article is marked as a duplicate.
- Filters out the duplicate articles, retaining only distinct ones.

**Output:**
- A list of unique articles with contextual embeddings attached.

---

## 3. Summarizer

**Purpose:**  
The Summarizer module is responsible for generating concise AI summaries of full news articles using a transformer-based model.

**Inputs:**
- `article_id`: Unique identifier of the article to summarize.

**Processing / Logic:**
1. The system receives a request with an `article_id`.
2. It checks if the summary already exists in the database:
   - If found, the summary is retrieved directly and returned.
   - If not, it fetches the full article URL, extracts content using **Newspaper3K**, and generates a summary with **DistilBART** (60-100 words).
3. The system logs this interaction by updating the user’s read history.
4. The final summary is returned to the user interface.

**Outputs:**
- AI-generated summary (60-100 words) of the article content.

---

## 4. Recommendation System

**Purpose:**  
Generates personalized article recommendations based on user reading history, combining contextual embeddings with recency-based weighting to rank articles by relevance and freshness.

**Inputs:**
- `user`: Authenticated user object
- Optional:
  - `recency_factor`: Balance between recency and similarity.
  - `decay_strength`: Weight steepness for recent reads.

**Processing / Logic:**
1. **History Check:**
   - Verifies if the user has reading history.
   - Returns an empty list if no records are found.
   
2. **Time-Weighted Embedding Generation:**
   - Retrieves up to **N** (default: 10) recent articles viewed by the user.
   - For each article, fetches:
     - Title embeddings from the DB.
     - Viewing timestamp.
   - Calculates time-normalized recency for each article, applying exponential weighting:

   $$ w_i=\frac{e^{r_i\cdot\beta}}{\sum_{j=1}^{N}e^{r_j\cdot\beta}} $$

   where **r_i** is the normalized recency, and **β** is the decay strength.

   - Final user embedding:

   $$ \vec{u}=\sum_{i=1}^{N}w_i\cdot\vec{e_i} $$

   where **e_i** is the embedding of article **i**.

3. **Scoring & Filtering:**
   - Filters out articles already viewed by the user.
   - Scores remaining articles using:

   $$ \mathrm{Score}=\left(1-\alpha\right)\cdot\mathrm{CosineDistance}\left(\vec{u},\vec{a}\right)+\alpha\cdot\mathrm{DaysSincePublished} $$

   where **α** is the recency factor.

4. **Pagination:**  
   - Results are paginated and formatted before being returned.

**Outputs:**
- A list of article dictionaries.

---

## 5. Search Engine

**Purpose:**  
The Search Engine module enables users to efficiently find news articles either through direct keyword matches or via semantic similarity, enhancing discoverability and personalization.

**Inputs:**
- `query`: Search string.
- `context`: Boolean indicating keyword or contextual search.

**Processing / Logic:**
- If `context = False`:
  - Performs an OR-based keyword match in article titles/content.
  - Returns the latest matching articles.
  
- If `context = True`:
  - Generates an embedding for the query using SBERT.
  - Computes cosine similarity with stored article embeddings.
  - Returns top-ranked results by similarity.

- Results are paginated and formatted before being returned.

**Output:**
- Paginated list of article dictionaries relevant to the query.

---

## 6. Authentication System

**Purpose:**  
Ensures secure access to the platform by verifying user credentials and managing session tokens. Implements JWT-based authentication to provide stateless, scalable user validation.

**Inputs:**
- `username`: Username entered by the user.
- `password`: Password entered by the user.

**Processing / Logic:**
- Checks if the username exists in the system.
- If the user exists, compares the provided password with the stored hashed password using a secure verification method.
- If valid, generates:
  - A short-lived JWT access token.
  - A long-lived refresh token.

**Output:**
- JSON response containing `access_token`.
- HTTP-only cookie containing `refresh_token`.

---

## 7. User Operations Module

**Purpose:**  
Manages all user interactions with content, including liking, bookmarking, viewing history, and managing subscriptions.

**Inputs:**
- `user_id`: ID of the logged-in user.
- `article_id` (optional): For actions like like, bookmark, or history update.
- `source_id` (optional): For subscribing/unsubscribing to news sources.

**Processing / Logic:**
- **User Likes**: Allows users to like or unlike articles.
- **User Bookmarks**: Allows users to bookmark or unbookmark articles.
- **User History**: Updates when an article is read or summarized, recording timestamps.
- **User Subscriptions**: Allows subscribing or unsubscribing to sources.

**Outputs:**
- Success/failure response.
- User-specific data (liked articles, bookmarks, history, subscriptions).

---

## 8. User Management System

**Purpose:**  
Enables users to create and manage their accounts. Supports secure registration, profile updates, password changes, and account deletion.

**Inputs:**
- `User data` (full name, username, email, password)
- `Updated user information` (name, email, password)
- `Authentication token` (to authorize user actions)

**Processing / Logic:**
- **User Registration**: Accepts and validates user data, stores it securely in the database.
- **Profile Update**: Allows updating name/email after validation.
- **Password Update**: Verifies current password, updates with a hashed new password.
- **Account Deletion**: Permanently deletes the user’s data.

**Output:**
- Confirmation messages for each operation (e.g., "User registered", "Profile updated", "Password changed", "Account deleted").
