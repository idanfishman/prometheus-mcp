# PostgreSQL AI DBA Agent

## Overview

This comprehensive test suite validates AI-powered PostgreSQL database administration capabilities by simulating realistic performance scenarios. Using Prometheus metrics from `postgres_exporter`, we test whether AI agents can accurately diagnose, analyze, and recommend solutions for database performance issues.

- **Single Command Setup**: `./entrypoint.sh` - Everything runs automatically
- **Realistic Scenarios**: 60-minute Black Friday simulation with 6 distinct performance phases
- **Fully Containerized**: No local dependencies except Docker
- **Complete Monitoring**: Prometheus + Grafana + postgres_exporter included
- **AI-Ready**: Specialized prompts for different DBA analysis scenarios
- **Automated Orchestration**: Load generator manages the entire journey

## Real-World Scenario: E-commerce Black Friday

**Setting:** "ShopFast" - A high-traffic e-commerce platform during Black Friday

**Database Stats:**

- 2M active users
- 500K products in catalog
- Multiple microservices architecture
- Peak traffic multiplier: 5x normal load

**Business Impact:** Critical revenue period requiring 99.9% uptime and optimal performance

## Test Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │ Prometheus       │    │ AI DBA Agent    │
│   Database      │◄──►│ + postgres_      │◄──►│ Analysis &      │
│   + pgbench     │    │   exporter       │    │ Recommendations │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Components

- **PostgreSQL 14+** with realistic e-commerce schema
- **Prometheus** with postgres_exporter v0.17.1
- **pgbench** for controlled load generation
- **AI Agent** with specialized DBA prompts

## The 60-Minute Journey

### Phase 1: Normal Operations (0-10 minutes)

**Scenario:** Regular shopping activity, typical user behavior

**Simulation:**

```bash
pgbench -c 10 -j 2 -T 600 -f normal_operations.sql
```

**Expected Metrics:**

- Connections: 15-20
- Cache hit ratio: 95%+
- Query response time: <50ms

**AI Validation:** System should report healthy baseline

---

### Phase 2: Traffic Surge (10-20 minutes)

**Scenario:** Black Friday begins, 3x traffic increase

**Simulation:**

```bash
pgbench -c 30 -j 4 -T 600 -f heavy_browsing.sql &
pgbench -c 15 -j 2 -T 600 -f product_searches.sql &
```

**Expected Metrics:**

- Connections: 45+
- Slight performance degradation
- Increased query volume

**AI Validation:** Should detect traffic pattern change and recommend monitoring

---

### Phase 3: Lock Contention Storm (20-35 minutes)

**Scenario:** Inventory updates during high purchase volume create deadlocks

**Simulation:**

```bash
pgbench -c 5 -j 1 -T 900 -f inventory_updates.sql &
pgbench -c 20 -j 4 -T 900 -f purchase_attempts.sql &
```

**Target Metrics:**

- `pg_locks_count{mode="RowExclusiveLock"}` spikes
- `pg_long_running_transactions_max_duration_seconds` > 30s
- `pg_database_deadlocks` increases

**AI Validation:**

- Should trigger **CRITICAL ALERT**
- Identify blocking inventory queries
- Recommend immediate intervention

---

### Phase 4: Query Performance Collapse (30-45 minutes)

**Scenario:** Recommendation engine deploys inefficient queries

**Simulation:**

```bash
pgbench -c 15 -j 3 -T 900 -f expensive_analytics.sql &
pgbench -c 10 -j 2 -T 900 -f unoptimized_searches.sql &
```

**Target Metrics:**

- `pg_stat_statements_mean_time` dramatically increases
- `pg_stat_user_tables_seq_scan` spikes
- Cache hit ratio drops to <90%

**AI Validation:**

- Identify specific slow queries
- Recommend index creation
- Suggest query optimization

---

### Phase 5: Connection Pool Exhaustion (40-55 minutes)

**Scenario:** Mobile app connection leak during peak traffic

**Simulation:**

```bash
pgbench -c 70 -j 10 -T 900 -f connection_leak.sql &
```

**Target Metrics:**

- `pg_database_numbackends` approaches max_connections (100)
- `pg_process_idle_seconds` shows many long-idle connections
- New connections start failing

**AI Validation:**

- Should trigger **CRITICAL ALERT**
- Distinguish between high load vs. connection leak
- Recommend immediate connection cleanup

---

### Phase 6: Recovery & Stabilization (50-60 minutes)

**Scenario:** DBA intervention successful, system recovers

**Simulation:**

```bash
# Gradual load reduction
pgbench -c 15 -j 3 -T 600 -f recovery_load.sql
```

**Expected Metrics:**

- All metrics return to normal ranges
- Performance indicators improve
- System stability restored

**AI Validation:**

- Detect recovery pattern
- Confirm system stabilization
- Provide post-incident analysis

## Database Schema & Data

### E-commerce Schema

```sql
-- Products catalog (500K items)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT,
    category_id INT,
    price DECIMAL(10,2),
    stock_quantity INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Order management
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT,
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Order line items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    product_id INT REFERENCES products(id),
    quantity INT,
    price DECIMAL(10,2)
);

-- Indexes (some intentionally missing for testing)
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
-- Missing: products(name), products(description) - for seq scan testing
```

### Data Generation

```sql
-- Generate 500K products
INSERT INTO products
SELECT
    generate_series(1,500000),
    'Product ' || generate_series(1,500000),
    (random() * 100)::int + 1,
    (random() * 1000 + 10)::decimal(10,2),
    (random() * 1000)::int,
    'Description for product ' || generate_series(1,500000),
    NOW() - (random() * interval '365 days');

-- Generate 1M orders
INSERT INTO orders
SELECT
    generate_series(1,1000000),
    (random() * 100000)::int + 1,
    (random() * 5000 + 10)::decimal(10,2),
    CASE WHEN random() < 0.8 THEN 'completed' ELSE 'pending' END,
    NOW() - (random() * interval '180 days');
```

## pgbench Workload Files

### normal_operations.sql

```sql
-- Typical user browsing patterns
\set product_id random(1, 500000)
\set user_id random(1, 100000)

SELECT * FROM products WHERE id = :product_id;
SELECT COUNT(*) FROM orders WHERE user_id = :user_id;
SELECT * FROM products WHERE category_id = (random() * 100)::int LIMIT 20;
```

### inventory_updates.sql

```sql
-- Inventory management causing locks
\set product_id random(1, 1000)

BEGIN;
SELECT stock_quantity FROM products WHERE id = :product_id FOR UPDATE;
\sleep 5000ms
UPDATE products SET stock_quantity = stock_quantity - (random() * 5)::int
WHERE id = :product_id;
COMMIT;
```

### expensive_analytics.sql

```sql
-- Intentionally inefficient analytics queries
SELECT p.name, p.price, COUNT(oi.id) as order_count
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE p.description LIKE '%premium%'
GROUP BY p.id, p.name, p.price
ORDER BY order_count DESC
LIMIT 100;

-- Sequential scan generator
SELECT COUNT(*) FROM products WHERE name LIKE '%' || (random() * 1000)::int || '%';
```

### connection_leak.sql

```sql
-- Simulate connection leaks with long idle times
SELECT pg_sleep(30 + random() * 60);
SELECT 1;
\sleep 10000ms
```

## Prometheus Metrics Monitored

### Core Performance Indicators

- `pg_database_numbackends` - Active connections
- `pg_database_xact_commit` - Transaction throughput
- `pg_database_blks_hit` / `pg_database_blks_read` - Cache efficiency

### Lock & Transaction Monitoring

- `pg_locks_count{mode, locktype}` - Lock contention patterns
- `pg_long_running_transactions_max_duration_seconds` - Blocking transactions
- `pg_database_deadlocks` - Deadlock frequency

### Query Performance Tracking

- `pg_stat_statements_calls` - Query execution frequency
- `pg_stat_statements_mean_time` - Average query duration
- `pg_stat_statements_total_time` - Total query time

### I/O & Table Statistics

- `pg_stat_user_tables_seq_scan` - Sequential scan frequency
- `pg_stat_user_tables_idx_scan` - Index scan efficiency
- `pg_statio_user_tables_heap_blks_read` - Disk I/O patterns

## AI Agent Validation Strategy

### Post-Test Analysis (Primary Validation)

**After 60-minute test completion:**

#### 1. Core Performance Analysis

Feed complete metrics dataset to AI agent using the Core Performance Analysis prompt:

- **Input**: 1 hour of collected PostgreSQL metrics from Black Friday simulation
- **Expected Output**: Comprehensive DBA report identifying all 6 performance phases
- **Validation**: Should detect progression from normal ops → traffic surge → lock contention → query degradation → connection exhaustion → recovery

#### 2. Simulated Real-time Alert Response

Extract critical moments from recorded data and test alert response using Real-time Alert Response prompt:

**Alert Moment 1 (Phase 3 - Minute 25):**

```
pg_locks_count{mode="RowExclusiveLock"} = 45
pg_long_running_transactions_max_duration_seconds = 180
pg_database_deadlocks rate = 0.5/min
```

**Alert Moment 2 (Phase 5 - Minute 45):**

```
pg_database_numbackends = 87 (approaching max_connections: 100)
pg_process_idle_seconds avg = 450
New connection failures detected
```

### Success Criteria

#### Historical Analysis Validation

- **Phase Detection**: Identifies 5/6 performance phases correctly
- **Root Cause Accuracy**: Links symptoms to causes (lock contention → inventory updates)
- **Trend Analysis**: Recognizes performance degradation patterns over time
- **Recovery Recognition**: Detects system stabilization in final phase

#### Alert Response Validation

- **Alert Triggering**: Would have generated appropriate alerts for critical moments
- **Severity Assessment**: Correctly prioritizes connection exhaustion over query slowdowns
- **Immediate Actions**: Provides specific intervention steps
- **Investigation Queries**: Suggests correct PromQL queries for deeper analysis

#### Communication Quality

- **Executive Summary**: Clear business impact assessment
- **Technical Details**: Actionable recommendations for DBA team
- **Priority Matrix**: Immediate vs. long-term fixes properly categorized

## Quick Start

### Prerequisites

- **Docker & Docker Compose** - Complete containerized solution

```bash
# Install Docker (if not already installed)
# macOS: brew install docker docker-compose
# Ubuntu: sudo apt-get install docker.io docker-compose
# Windows: Download Docker Desktop

# Verify installation
docker --version
docker-compose --version
```

### One Command to Run Everything

Start the complete 60-minute Black Friday simulation with one command:

```bash
# 1. Navigate to the DBA example directory
cd examples/dba

# 2. Start the complete journey
./entrypoint.sh
```

**That's it!** This single command will:

- Start PostgreSQL with realistic e-commerce data
- Launch Prometheus + postgres_exporter for metrics collection
- Start Grafana with pre-configured dashboards
- Build and run the load generator container
- Execute the complete 60-minute Black Friday simulation automatically

### What Happens During the Journey

The load generator will automatically orchestrate 6 realistic performance scenarios:

1. **Phase 1 (0-10m)**: Normal Operations - Baseline performance
2. **Phase 2 (10-20m)**: Traffic Surge - Black Friday begins, 3x traffic
3. **Phase 3 (20-35m)**: Lock Contention Storm - Inventory deadlocks
4. **Phase 4 (35-50m)**: Query Performance Collapse - Slow analytics
5. **Phase 5 (50-65m)**: Connection Pool Exhaustion - Connection leaks
6. **Phase 6 (65-75m)**: Recovery & Stabilization - System recovers

### Access Monitoring

Once tests are running, access your monitoring dashboards:

- **Prometheus Metrics**: http://localhost:9090
- **Grafana Dashboards**: http://localhost:3000 (admin/admin123)
- **Prometheus MCP Server**: http://localhost:8080

## Expected Outcomes

### Successful AI Agent Should:

1. **Detect all 6 phases** of performance degradation
2. **Trigger alerts** for critical issues (Phases 3 & 5)
3. **Provide accurate root cause analysis** for each scenario
4. **Recommend appropriate fixes** with priority levels
5. **Generate executive summary** of overall test period

### Metrics Success Thresholds:

- **Detection Rate:** >90% of injected issues identified
- **Response Time:** <5 minutes for critical alerts
- **False Positive Rate:** <10%
- **Remediation Accuracy:** >85% of recommendations appropriate

## Business Value

This test suite validates that AI agents can:

- **Replace on-call DBA** for initial triage
- **Provide 24/7 monitoring** with expert-level analysis
- **Reduce MTTR** through accurate root cause identification

**ROI Calculation:**

- Manual DBA response time: 20-60 minutes
- AI agent response time: 2-5 minutes
- Cost savings: 70-85% reduction in incident response time
