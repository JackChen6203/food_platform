# Project Architecture: Leftover Food Platform

## Overview
A mobile platform connecting users with nearby food items that are approaching their expiration date, offered at a discounted price.

## Tech Stack

### 1. Frontend
*   **Framework**: React Native
*   **Purpose**: Cross-platform mobile application (targeting Android first).
*   **Key Features**:
    *   GPS/Location services to find nearby food.
    *   Product listing view (Original Price vs Current Price).
    *   Notifications for new items.

### 2. Backend
*   **Language**: Go (Golang)
*   **Purpose**: High-performance API server.
*   **Key Responsibilities**:
    *   Handle business logic for "auto-listing" based on expiry dates.
    *   Manage user users (Consumers and Merchants).
    *   Geo-spatial queries (PostGIS likely) for "nearby" search.

### 3. Database
*   **System**: PostgreSQL
*   **Purpose**: Persistent relational data storage.
*   **Key Data**:
    *   Users (GPS location updates).
    *   Products (Expiry date, Original Price, Current Price).
    *   Transactions.

## Key Workflows
1.  **Auto-Listing**: System monitors inventory expiry dates. When `CurrentDate >= ExpiryThreshold`, the item is automatically listed on the public marketplace.
2.  **Discovery**: Users open the app, GPS determines location -> Backend queries Postgres for active items within Radius.

## Construction Plan
1.  Setup Go server with Gin or Chi router.
2.  Setup Postgres with PostGIS extension.
3.  Setup React Native project (Expokit or CLI).
4.  Implement "Near Me" API.
5.  Build Android APK.
