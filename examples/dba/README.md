<<<<<<< ours

# PostgreSQL DBA Monitoring Example

This example demonstrates a complete PostgreSQL monitoring setup using Prometheus, Grafana, and a "bad" Go application that generates various database performance issues for monitoring and analysis.

## Components

### 1. PostgreSQL Database

- **Image**: `postgres:17-alpine`
- **Port**: `5432`
- **Features**:
  - `pg_stat_statements` extension enabled for query statistics
  - Custom initialization script
  - Health checks configured

### 2. PostgreSQL Exporter

- **Image**: `prometheuscommunity/postgres-exporter:v0.17.1`
- **Port**: `9187`
- **Collectors Enabled**:
  - Database statistics
  - Lock information
  - Long running transactions
  - Statement statistics
  - User table statistics
  - WAL statistics
  - Background writer stats
  - And many more...

### 3. Prometheus

- **Image**: `prom/prometheus:v3.4.1`
- **Port**: `9090`
- **Configuration**: Custom config to scrape PostgreSQL metrics

### 4. Prometheus MCP Server

- **Image**: `ghcr.io/idanfishman/prometheus-mcp:latest`
- **Port**: `8080`
- **Purpose**: Provides MCP interface for querying Prometheus metrics

### 5. Grafana

- **Image**: `grafana/grafana:12.0.2`
- **Port**: `3000`
- **Credentials**: `admin` / `admin123`
- **Features**: Pre-configured Prometheus datasource

### 6. Bad Application (The Star of the Show!)

- **Build**: Custom Go application
- **Port**: `8081`
- **Purpose**: Generates various PostgreSQL performance issues
- **Configuration**: Uses environment variables for database connection

## What the Bad Application Does

The bad application is designed to create realistic database performance problems that you might encounter in production:

### 🔒 **Long-Running Transactions**

- Holds transactions open for 30+ seconds
- Blocks other operations waiting for locks
- Creates transaction ID wraparound concerns

### ⚔️ **Lock Contention**

- Multiple goroutines compete for the same rows
- Creates row-level lock waits
- Demonstrates lock queue buildup

### 🐌 **Inefficient Queries**

- Queries without proper indexes
- Full table scans with functions (`UPPER()`)
- Complex JOINs on unindexed columns
- Slow result processing

### 🌊 **Connection Pool Exhaustion**

- Spawns 60+ concurrent connections (more than pool limit)
- Holds connections with long-running queries
- Demonstrates connection limit issues

### 💾 **Heavy Write Operations**

- Bulk inserts to audit log (1000 records per cycle)
- Bulk updates on user table (500 per cycle)
- Bulk deletes creating dead tuples
- Stresses autovacuum processes

### 💀 **Deadlock Scenarios**

- Two transactions locking resources in different orders
- Classic deadlock patterns (A→B, B→A)
- PostgreSQL deadlock detection in action

### 📊 **Slow Table Scans**

- Expensive aggregations without indexes
- Date-based grouping on large tables
- Complex calculations during scans

## Configuration

The bad application uses the following environment variables for database connection:

| Variable      | Default            | Description              |
| ------------- | ------------------ | ------------------------ |
| `DB_HOST`     | `postgres`         | PostgreSQL host          |
| `DB_PORT`     | `5432`             | PostgreSQL port          |
| `DB_USER`     | `postgres`         | PostgreSQL username      |
| `DB_PASSWORD` | `mysecretpassword` | PostgreSQL password      |
| `DB_NAME`     | `postgres`         | PostgreSQL database name |

These are pre-configured in the docker-compose.yaml file but can be overridden if needed.

## Getting Started

1. **Start the stack**:

   ```bash
   cd examples/dba
   docker-compose up -d
   ```

2. **Wait for initialization** (about 30-60 seconds for the bad app to create tables and data)

3. **Access the services**:
   - **Grafana**: http://localhost:3000 (admin/admin123)
   - **Prometheus**: http://localhost:9090
   - **PostgreSQL Exporter**: http://localhost:9187/metrics
   - **Prometheus MCP**: http://localhost:8080
   - **Bad App Metrics**: http://localhost:8081/metrics

4. **Watch the chaos unfold**:

   ```bash
   # Watch bad app logs
   docker-compose logs -f bad_app

   # Monitor PostgreSQL activity
   docker-compose exec postgres psql -U postgres -c "
   SELECT
     pid,
     state,
     query_start,
     state_change,
     wait_event_type,
     wait_event,
     substring(query, 1, 50) as query
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY query_start;
   "
   ```

## Monitoring Queries

Here are some useful queries to run in Prometheus or through the MCP interface:

### Connection Metrics

```promql
# Active connections
pg_stat_database_numbackends{datname="postgres"}

# Max connections
pg_settings_max_connections
```

### Lock Metrics

```promql
# Lock waits
pg_locks_count{mode="AccessExclusiveLock"}

# Long running transactions
pg_stat_activity_max_tx_duration
```

### Query Performance

```promql
# Slow queries
rate(pg_stat_statements_mean_time_seconds[5m])

# Query calls
rate(pg_stat_statements_calls_total[5m])
```

### Vacuum Metrics

```promql
# Dead tuples
pg_stat_user_tables_n_dead_tup

# Autovacuum runs
pg_stat_user_tables_autovacuum_count
```

## What You'll See

After running for a few minutes, you should observe:

- 🔴 **High connection counts** approaching limits
- 🔴 **Lock waits** and contention in `pg_locks`
- 🔴 **Long-running transactions** in `pg_stat_activity`
- 🔴 **Dead tuple accumulation** in user tables
- 🔴 **Slow query patterns** in `pg_stat_statements`
- 🔴 **Deadlock detection** in PostgreSQL logs
- 🔴 **High CPU/IO usage** from inefficient queries

## Cleanup

```bash
docker-compose down -v
```

This will stop all services and remove the volumes (including the PostgreSQL data).

## Using with MCP

This setup is perfect for testing the Prometheus MCP server's ability to diagnose database issues. You can ask the MCP agent questions like:

- "What database performance issues do you see?"
- "Are there any long-running transactions?"
- "Show me the slowest queries"
- "What's causing the lock contention?"
- "How is the vacuum process performing?"

The MCP server will query Prometheus metrics and provide intelligent analysis of the database performance problems created by our bad application!

## Educational Value

This example demonstrates:

- Real-world database performance issues
- How PostgreSQL metrics expose problems
- The value of comprehensive monitoring
- How different issues interact and compound
- The importance of proper indexing, connection management, and query optimization

Perfect for learning database performance tuning and monitoring! 🎓 ||||||| =======

# PostgreSQL DBA Monitoring Example

This example demonstrates a complete PostgreSQL monitoring setup using Prometheus, Grafana, and a "bad" Go application that generates various database performance issues for monitoring and analysis.

## Components

### 1. PostgreSQL Database

- **Image**: `postgres:17-alpine`
- **Port**: `5432`
- **Features**:
  - `pg_stat_statements` extension enabled for query statistics
  - Custom initialization script
  - Health checks configured

### 2. PostgreSQL Exporter

- **Image**: `prometheuscommunity/postgres-exporter:v0.17.1`
- **Port**: `9187`
- **Collectors Enabled**:
  - Database statistics
  - Lock information
  - Long running transactions
  - Statement statistics
  - User table statistics
  - WAL statistics
  - Background writer stats
  - And many more...

### 3. Prometheus

- **Image**: `prom/prometheus:v3.4.1`
- **Port**: `9090`
- **Configuration**: Custom config to scrape PostgreSQL metrics

### 4. Prometheus MCP Server

- **Image**: `ghcr.io/idanfishman/prometheus-mcp:latest`
- **Port**: `8080`
- **Purpose**: Provides MCP interface for querying Prometheus metrics

### 5. Grafana

- **Image**: `grafana/grafana:12.0.2`
- **Port**: `3000`
- **Credentials**: `admin` / `admin123`
- **Features**: Pre-configured Prometheus datasource

### 6. Bad Application (The Star of the Show!)

- **Build**: Custom Go application
- **Port**: `8081`
- **Purpose**: Generates various PostgreSQL performance issues
- **Configuration**: Uses environment variables for database connection

## What the Bad Application Does

The bad application is designed to create realistic database performance problems that you might encounter in production:

### 🔒 **Long-Running Transactions**

- Holds transactions open for 30+ seconds
- Blocks other operations waiting for locks
- Creates transaction ID wraparound concerns

### ⚔️ **Lock Contention**

- Multiple goroutines compete for the same rows
- Creates row-level lock waits
- Demonstrates lock queue buildup

### 🐌 **Inefficient Queries**

- Queries without proper indexes
- Full table scans with functions (`UPPER()`)
- Complex JOINs on unindexed columns
- Slow result processing

### 🌊 **Connection Pool Exhaustion**

- Spawns 60+ concurrent connections (more than pool limit)
- Holds connections with long-running queries
- Demonstrates connection limit issues

### 💾 **Heavy Write Operations**

- Bulk inserts to audit log (1000 records per cycle)
- Bulk updates on user table (500 per cycle)
- Bulk deletes creating dead tuples
- Stresses autovacuum processes

### 💀 **Deadlock Scenarios**

- Two transactions locking resources in different orders
- Classic deadlock patterns (A→B, B→A)
- PostgreSQL deadlock detection in action

### 📊 **Slow Table Scans**

- Expensive aggregations without indexes
- Date-based grouping on large tables
- Complex calculations during scans

## Configuration

The bad application uses the following environment variables for database connection:

| Variable      | Default            | Description              |
| ------------- | ------------------ | ------------------------ |
| `DB_HOST`     | `postgres`         | PostgreSQL host          |
| `DB_PORT`     | `5432`             | PostgreSQL port          |
| `DB_USER`     | `postgres`         | PostgreSQL username      |
| `DB_PASSWORD` | `mysecretpassword` | PostgreSQL password      |
| `DB_NAME`     | `postgres`         | PostgreSQL database name |

These are pre-configured in the docker-compose.yaml file but can be overridden if needed.

## Getting Started

1. **Start the stack**:

   ```bash
   cd examples/dba
   docker-compose up -d
   ```

2. **Wait for initialization** (about 30-60 seconds for the bad app to create tables and data)

3. **Access the services**:
   - **Grafana**: http://localhost:3000 (admin/admin123)
   - **Prometheus**: http://localhost:9090
   - **PostgreSQL Exporter**: http://localhost:9187/metrics
   - **Prometheus MCP**: http://localhost:8080
   - **Bad App Metrics**: http://localhost:8081/metrics

4. **Watch the chaos unfold**:

   ```bash
   # Watch bad app logs
   docker-compose logs -f bad_app

   # Monitor PostgreSQL activity
   docker-compose exec postgres psql -U postgres -c "
   SELECT
     pid,
     state,
     query_start,
     state_change,
     wait_event_type,
     wait_event,
     substring(query, 1, 50) as query
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY query_start;
   "
   ```

## Monitoring Queries

Here are some useful queries to run in Prometheus or through the MCP interface:

### Connection Metrics

```promql
# Active connections
pg_stat_database_numbackends{datname="postgres"}

# Max connections
pg_settings_max_connections
```

### Lock Metrics

```promql
# Lock waits
pg_locks_count{mode="AccessExclusiveLock"}

# Long running transactions
pg_stat_activity_max_tx_duration
```

### Query Performance

```promql
# Slow queries
rate(pg_stat_statements_mean_time_seconds[5m])

# Query calls
rate(pg_stat_statements_calls_total[5m])
```

### Vacuum Metrics

```promql
# Dead tuples
pg_stat_user_tables_n_dead_tup

# Autovacuum runs
pg_stat_user_tables_autovacuum_count
```

## What You'll See

After running for a few minutes, you should observe:

- 🔴 **High connection counts** approaching limits
- 🔴 **Lock waits** and contention in `pg_locks`
- 🔴 **Long-running transactions** in `pg_stat_activity`
- 🔴 **Dead tuple accumulation** in user tables
- 🔴 **Slow query patterns** in `pg_stat_statements`
- 🔴 **Deadlock detection** in PostgreSQL logs
- 🔴 **High CPU/IO usage** from inefficient queries

## Cleanup

```bash
docker-compose down -v
```

This will stop all services and remove the volumes (including the PostgreSQL data).

## Using with MCP

This setup is perfect for testing the Prometheus MCP server's ability to diagnose database issues. You can ask the MCP agent questions like:

- "What database performance issues do you see?"
- "Are there any long-running transactions?"
- "Show me the slowest queries"
- "What's causing the lock contention?"
- "How is the vacuum process performing?"

The MCP server will query Prometheus metrics and provide intelligent analysis of the database performance problems created by our bad application!

## Educational Value

This example demonstrates:

- Real-world database performance issues
- How PostgreSQL metrics expose problems
- The value of comprehensive monitoring
- How different issues interact and compound
- The importance of proper indexing, connection management, and query optimization

Perfect for learning database performance tuning and monitoring! 🎓

> > > > > > > theirs
