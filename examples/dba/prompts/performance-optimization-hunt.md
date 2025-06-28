# PostgreSQL Performance Optimization Hunt

## Objective

Systematically identify and prioritize PostgreSQL performance optimization opportunities using metrics analysis to deliver maximum performance improvements with optimal resource investment.

## Role & Context

You are a PostgreSQL performance specialist conducting a comprehensive optimization assessment. Your goal is to find the highest-impact performance improvements across queries, indexes, maintenance, and system configuration. Focus on quantifiable benefits and practical implementation approaches.

## Available Data Sources

### Query Performance Analysis

```promql
# Highest Total Time Consumers
topk(10, pg_stat_statements_total_time)

# Slowest Average Execution Time
topk(10, pg_stat_statements_mean_time)

# Most Frequently Called Slow Queries
pg_stat_statements_calls * pg_stat_statements_mean_time

# Query Resource Consumption
pg_stat_statements_rows / pg_stat_statements_calls
```

### Index Optimization Opportunities

```promql
# Tables with High Sequential Scan Ratios
pg_stat_user_tables_seq_scan / (pg_stat_user_tables_seq_scan + pg_stat_user_tables_idx_scan) > 0.1

# Unused or Inefficient Indexes
pg_statio_user_indexes_idx_blks_hit / (pg_statio_user_indexes_idx_blks_hit + pg_statio_user_indexes_idx_blks_read) < 0.9

# Index Usage Patterns
pg_stat_user_indexes_idx_scan
pg_stat_user_indexes_idx_tup_read
```

### Maintenance & Vacuum Analysis

```promql
# Tables with High Dead Tuple Ratios
pg_stat_user_tables_n_dead_tup / pg_stat_user_tables_n_live_tup > 0.1

# Tables Needing More Frequent Autovacuum
pg_stat_user_tables_n_dead_tup > 10000

# Vacuum Efficiency Metrics
pg_stat_user_tables_vacuum_count
pg_stat_user_tables_autovacuum_count
```

### Connection & I/O Optimization

```promql
# Connection Efficiency Issues
avg_over_time(pg_process_idle_seconds[24h]) > 300

# Peak vs Average Connection Usage
max_over_time(pg_database_numbackends[24h]) / avg_over_time(pg_database_numbackends[24h])

# Cache Hit Ratio Analysis
pg_statio_user_tables_heap_blks_hit / (pg_statio_user_tables_heap_blks_hit + pg_statio_user_tables_heap_blks_read)

# Disk I/O Hotspots
topk(10, rate(pg_statio_user_tables_heap_blks_read[5m]))
```

## Instructions

### Step 1: Data Collection & Baseline Establishment (15% of effort)

1. **Gather Performance Metrics**: Execute all optimization analysis queries
2. **Establish Current Baselines**: Document current performance levels
3. **Validate Data Quality**: Ensure metrics are representative and complete
4. **Identify Analysis Scope**: Determine which databases/schemas to focus on

### Step 2: Query Optimization Analysis (25% of effort)

1. **Identify High-Impact Queries**:
   - Rank queries by total resource consumption
   - Find queries with worst average performance
   - Locate frequently-called inefficient queries

2. **Analyze Query Patterns**:
   - Review execution plans for slow queries
   - Identify common anti-patterns (N+1, missing WHERE clauses)
   - Check for queries that could benefit from rewriting

3. **Calculate Optimization Potential**:
   - Estimate performance improvement potential
   - Assess implementation complexity
   - Prioritize by ROI (Return on Investment)

### Step 3: Index Optimization Assessment (25% of effort)

1. **Missing Index Detection**:
   - Find tables with high sequential scan ratios
   - Identify foreign key columns without indexes
   - Locate WHERE clause columns needing indexes

2. **Unused Index Identification**:
   - Find indexes with zero or minimal usage
   - Calculate storage savings from dropping unused indexes
   - Assess maintenance overhead reduction

3. **Index Efficiency Analysis**:
   - Review indexes with poor hit ratios
   - Identify opportunities for composite indexes
   - Find partial index opportunities

### Step 4: Maintenance Optimization Review (20% of effort)

1. **Vacuum Strategy Assessment**:
   - Identify tables with excessive dead tuples
   - Review autovacuum configuration effectiveness
   - Find tables needing custom vacuum schedules

2. **Statistics & Analyze Optimization**:
   - Check for stale table statistics
   - Identify tables needing more frequent ANALYZE
   - Review auto-analyze configuration

3. **Bloat Analysis**:
   - Calculate table and index bloat ratios
   - Estimate storage reclamation potential
   - Plan REINDEX or CLUSTER operations

### Step 5: System-Level Optimization (15% of effort)

1. **Connection Pool Analysis**:
   - Assess connection efficiency and utilization
   - Identify connection leak opportunities
   - Review pooling configuration optimization

2. **Memory & Cache Optimization**:
   - Analyze buffer cache hit ratios
   - Review shared_buffers and work_mem settings
   - Identify memory allocation improvements

3. **I/O Pattern Analysis**:
   - Find I/O hotspots and bottlenecks
   - Review checkpoint and WAL configuration
   - Assess storage subsystem optimization

## Required Output Format

### Executive Summary

- **Total Optimization Opportunities**: X opportunities identified
- **Estimated Performance Improvement**: X% overall improvement potential
- **Implementation Effort Required**: X person-days estimated
- **Top 3 Recommendations**: Highest-impact items with effort estimates

### 1. Quick Wins (Immediate 20%+ Improvement Potential)

#### Query Optimizations

For each optimization:

- **Query Identifier**: Specific query or query pattern
- **Current Performance**: Execution time, frequency, resource usage
- **Optimization Approach**: Specific changes to make
- **Expected Improvement**: Quantified performance gain
- **Implementation Effort**: Hours/days required
- **Risk Level**: Low/Medium/High with mitigation notes

#### Index Optimizations

For each index opportunity:

- **Table/Column**: Specific location
- **Optimization Type**: Create/Drop/Modify index
- **Current Impact**: Sequential scans, query performance
- **Expected Benefit**: Query speedup, resource savings
- **Implementation Steps**: Specific DDL commands
- **Maintenance Window Required**: Downtime/lock requirements

### 2. Medium Effort Optimizations (Significant Improvements, 1-5 Days)

#### Query Rewrites

- **Complex Query Optimizations**: Multi-table joins, subqueries
- **Schema Changes**: Denormalization, partitioning opportunities
- **Application Changes**: Query pattern improvements

#### Index Reorganization

- **Composite Index Creation**: Multi-column index opportunities
- **Index Consolidation**: Combining similar indexes
- **Partial Index Implementation**: Filtered index opportunities

#### Maintenance Tuning

- **Autovacuum Configuration**: Custom settings per table
- **Statistics Targets**: Improved query planning
- **Bloat Remediation**: REINDEX and CLUSTER operations

### 3. Long-term Projects (Architectural Changes, 1+ Weeks)

#### Infrastructure Improvements

- **Hardware Upgrades**: CPU, memory, storage recommendations
- **Connection Pooling**: PgBouncer or similar implementation
- **Read Replicas**: Query distribution opportunities

#### Schema Evolution

- **Partitioning Implementation**: Large table partitioning
- **Normalization/Denormalization**: Schema restructuring
- **Data Archiving**: Historical data management

#### Application Architecture

- **Caching Strategies**: Application-level caching
- **Query Pattern Changes**: ORM optimization
- **Batch Processing**: ETL and reporting optimization

### 4. Implementation Roadmap

#### Phase 1 (Week 1-2): Quick Wins

- **Priority 1 Items**: Critical performance fixes
- **Resource Requirements**: DBA time, maintenance windows
- **Success Metrics**: Performance benchmarks to track
- **Risk Mitigation**: Rollback plans and monitoring

#### Phase 2 (Week 3-8): Medium Effort Items

- **Project Planning**: Detailed implementation plans
- **Resource Allocation**: Team assignments and timelines
- **Testing Strategy**: Performance validation approach
- **Change Management**: Communication and approval process

#### Phase 3 (Month 2-6): Long-term Projects

- **Architecture Planning**: Design and approval process
- **Vendor Evaluation**: Tool and hardware selection
- **Budget Requirements**: Cost estimates and approvals
- **Migration Planning**: Phased implementation approach

### 5. Monitoring & Measurement Plan

#### Baseline Metrics

Document current performance baselines:

- **Query Response Times**: P50, P95, P99 percentiles
- **Throughput Metrics**: Transactions/second, queries/second
- **Resource Utilization**: CPU, memory, I/O, storage
- **User Experience**: Application response times

#### Success Criteria

Define measurable improvement targets:

- **Performance Improvements**: Specific percentage gains
- **Resource Efficiency**: CPU, memory, storage savings
- **Availability Improvements**: Uptime, error rate reductions
- **Capacity Gains**: Headroom increases

#### Monitoring Strategy

- **Continuous Monitoring**: Automated performance tracking
- **Alert Thresholds**: Performance regression detection
- **Reporting Cadence**: Weekly/monthly progress reports
- **Review Schedule**: Quarterly optimization assessments

### 6. Risk Assessment & Mitigation

#### Implementation Risks

For each major optimization:

- **Technical Risk**: Complexity and failure potential
- **Business Risk**: Service disruption possibility
- **Performance Risk**: Potential negative impacts
- **Rollback Strategy**: How to revert changes quickly

#### Mitigation Strategies

- **Testing Requirements**: Staging environment validation
- **Phased Rollouts**: Gradual implementation approach
- **Monitoring Plans**: Real-time impact assessment
- **Contingency Plans**: Emergency response procedures

## Success Criteria

- Comprehensive analysis completed within 1 week
- All optimization opportunities quantified with ROI calculations
- Implementation roadmap with realistic timelines and resource requirements
- Risk assessment and mitigation strategies for all major changes
- Baseline metrics established for measuring improvement success
- Executive summary suitable for technical leadership decision-making
