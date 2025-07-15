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
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stocks_code ON stocks(code);
CREATE INDEX IF NOT EXISTS idx_stocks_market_cap ON stocks(market_cap);

-- News Articles Table
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    url VARCHAR(512) UNIQUE NOT NULL,
    source TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sentiment_score FLOAT,
    sentiment_label VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_news_articles_url ON news_articles(url);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at);

-- Financial Statements Table
CREATE TABLE IF NOT EXISTS financial_statements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    quarter INT NOT NULL,
    revenue BIGINT,
    operating_profit BIGINT,
    net_income BIGINT,
    CONSTRAINT unique_financial_statement UNIQUE (code, year, quarter)
);

CREATE INDEX IF NOT EXISTS idx_financial_statements_code_year_quarter ON financial_statements(code, year DESC, quarter DESC);

-- Backtesting Tables
CREATE TABLE IF NOT EXISTS backtest_strategies (
    id SERIAL PRIMARY KEY,
    strategy_name VARCHAR(100) NOT NULL,
    stock_code VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    parameters JSONB, -- To store strategy params like { "fast_ma": 10, "slow_ma": 50 }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backtest_results (
    id SERIAL PRIMARY KEY,
    strategy_id INT REFERENCES backtest_strategies(id) ON DELETE CASCADE,
    final_value NUMERIC(15, 2),
    sharpe_ratio FLOAT,
    max_drawdown FLOAT,
    run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    results_data JSONB -- To store detailed results like equity curve
);

CREATE INDEX IF NOT EXISTS idx_backtest_results_strategy_id ON backtest_results(strategy_id);

-- ETF Tables
CREATE TABLE IF NOT EXISTS etfs (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    market VARCHAR(50),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS etf_holdings (
    id SERIAL PRIMARY KEY,
    etf_code VARCHAR(20) REFERENCES etfs(code) ON DELETE CASCADE,
    stock_code VARCHAR(20) NOT NULL,
    stock_name VARCHAR(255) NOT NULL,
    weight FLOAT,
    shares BIGINT
);

CREATE INDEX IF NOT EXISTS idx_etfs_code ON etfs(code);
CREATE INDEX IF NOT EXISTS idx_etf_holdings_etf_code ON etf_holdings(etf_code);

-- User Visits Table for traffic monitoring
CREATE TABLE IF NOT EXISTS user_visits (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    visit_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    path TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_visits_visit_time ON user_visits(visit_time);
CREATE INDEX IF NOT EXISTS idx_user_visits_ip_address ON user_visits(ip_address);

-- Users Table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255), -- Nullable for social logins
    email VARCHAR(100) UNIQUE,
    google_id VARCHAR(255) UNIQUE, -- New field for Google ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    profile_picture_url VARCHAR(255),
    location VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);

-- Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- e.g., 'member', 'admin'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_group_id ON chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Transactions Table for payment system
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    status VARCHAR(50) NOT NULL, -- e.g., 'pending', 'completed', 'failed', 'refunded'
    pg_transaction_id VARCHAR(255) UNIQUE, -- Payment Gateway's transaction ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Boards Table
CREATE TABLE IF NOT EXISTS boards (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_id, name) -- Board names must be unique within a group
);

CREATE INDEX IF NOT EXISTS idx_boards_group_id ON boards(group_id);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_board_id ON posts(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

-- Likes Table
CREATE TABLE IF NOT EXISTS likes (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id) -- A user can like a post only once
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Post Tags Table (Junction table for many-to-many)
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);