-- init.sql

-- Create the 'user' role if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'myuser') THEN
      CREATE ROLE "myuser" WITH LOGIN PASSWORD 'mypassword';
   END IF;
END
$do$;

-- Grant privileges to the 'myuser' role on the database
GRANT ALL PRIVILEGES ON DATABASE mynewsdb TO "myuser";

-- Set search path for the 'myuser' role
ALTER ROLE "myuser" SET search_path TO public;

-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    profile_visibility VARCHAR(20) DEFAULT 'public' NOT NULL, -- public, followers_only, private
    show_email VARCHAR(20) DEFAULT 'private' NOT NULL, -- public, followers_only, private
    show_activity_feed BOOLEAN DEFAULT TRUE NOT NULL,
    allow_direct_messages BOOLEAN DEFAULT TRUE NOT NULL,
    show_online_status BOOLEAN DEFAULT TRUE NOT NULL,
    on_new_comment BOOLEAN DEFAULT TRUE NOT NULL,
    on_new_follower BOOLEAN DEFAULT TRUE NOT NULL,
    on_post_like BOOLEAN DEFAULT TRUE NOT NULL,
    on_mention BOOLEAN DEFAULT TRUE NOT NULL,
    on_direct_message BOOLEAN DEFAULT TRUE NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    push_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Follows Table
CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);

-- Blocks Table
CREATE TABLE IF NOT EXISTS blocks (
    blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blocker_id, blocked_id)
);

-- Stocks Table
CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    market VARCHAR(50),
    theme VARCHAR(255),
    price INTEGER,
    change_value INTEGER,
    change_rate FLOAT,
    volume BIGINT,
    market_cap BIGINT,
    pbr FLOAT,
    per FLOAT,
    roe FLOAT,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- News Articles Table
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    url VARCHAR(512) UNIQUE NOT NULL,
    source TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sentiment_score FLOAT,
    sentiment_label VARCHAR(10)
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) DEFAULT '자유 토론' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add other tables like user_visits, etc. as needed...
CREATE TABLE IF NOT EXISTS user_visits (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    visit_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    path TEXT
);

-- Test Data for users (if not already present)
INSERT INTO users (username, email, hashed_password) VALUES
('testuser1', 'test1@example.com', 'hashed_password_1') ON CONFLICT (username) DO NOTHING;

-- Test Data for posts
INSERT INTO posts (title, content, author_id) VALUES
('첫 번째 테스트 게시글', '이것은 첫 번째 테스트 게시글의 내용입니다.', (SELECT id FROM users WHERE username = 'testuser1')),
('두 번째 테스트 게시글', '이것은 두 번째 테스트 게시글의 내용입니다.', (SELECT id FROM users WHERE username = 'testuser1'))
ON CONFLICT DO NOTHING;

-- Test Data for news_articles
INSERT INTO news_articles (title, url, source, published_at, sentiment_score, sentiment_label) VALUES
('테스트 뉴스 1: 경제 성장', 'http://example.com/news1', '뉴스1', CURRENT_TIMESTAMP - INTERVAL '1 hour', 0.8, '긍정적'),
('테스트 뉴스 2: 기술 혁신', 'http://example.com/news2', '뉴스2', CURRENT_TIMESTAMP - INTERVAL '2 hours', 0.1, '중립적'),
('테스트 뉴스 3: 시장 하락', 'http://example.com/news3', '뉴스3', CURRENT_TIMESTAMP - INTERVAL '3 hours', -0.7, '부정적')
ON CONFLICT (url) DO NOTHING;