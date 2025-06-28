#!/bin/bash

# PostgreSQL AI DBA Test Journey - Full 60-Minute Black Friday Simulation
# This script orchestrates the complete test scenario automatically

set -o pipefail

# Configuration
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_DB=${POSTGRES_DB:-postgres}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-mysecretpassword}

# Colors for logging
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] [INFO]${NC} $1"
}

log_phase() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] PHASE $1:${NC} $2"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] [ERROR]${NC} $1"
}

# Wait for PostgreSQL to be ready
wait_for_postgres() {
    log "Waiting for PostgreSQL to be ready..."
    for i in {1..60}; do
        if PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" >/dev/null 2>&1; then
            log "PostgreSQL is ready!"
            return 0
        fi
        log "  Attempt $i/60 - PostgreSQL not ready yet..."
        sleep 5
    done
    log_error "PostgreSQL not ready after 5 minutes"
    exit 1
}

# Run pgbench workload in background
run_workload() {
    local workload_file=$1
    local clients=$2
    local jobs=$3
    local duration=$4
    local description="$5"
    
    log "  Starting: $description"
    log "  File: $workload_file | Clients: $clients | Jobs: $jobs | Duration: ${duration}s"
    
    # Check if workload file exists
    if [[ ! -f "$workload_file" ]]; then
        log_error "Workload file not found: $workload_file"
        return 1
    fi
    
    # Test database connection first
    if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" >/dev/null 2>&1; then
        log_error "Database connection failed for workload: $description"
        return 1
    fi
    
    PGPASSWORD=$POSTGRES_PASSWORD pgbench \
        -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB \
        -c $clients -j $jobs -T $duration \
        -f "$workload_file" \
        --progress=60 \
        >/dev/null 2>&1 &
}

# Wait for background processes
wait_for_workloads() {
    local pids=("$@")
    log "  Waiting for ${#pids[@]} workload(s) to complete..."
    
    local failed=0
    for pid in "${pids[@]}"; do
        if wait $pid; then
            log "  Workload $pid completed successfully"
        else
            local exit_code=$?
            log_warning "Workload $pid failed with exit code $exit_code (continuing...)"
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -eq 0 ]; then
        log "  All workloads completed successfully"
    else
        log_warning "$failed workload(s) had issues, but continuing test journey"
    fi
}

# Show progress during phases
show_progress() {
    local phase_name="$1"
    local duration=$2
    local interval=30
    local elapsed=0
    
    while [ $elapsed -lt $duration ]; do
        sleep $interval
        elapsed=$((elapsed + interval))
        local remaining=$((duration - elapsed))
        log "  $phase_name - ${elapsed}s elapsed, ${remaining}s remaining..."
    done
}

# Main test journey
main() {
    log "Starting PostgreSQL AI DBA Test Journey"
    log "Scenario: ShopFast E-commerce Black Friday"
    log "Duration: 60 minutes (3600 seconds)"
    log "Goal: Generate realistic performance issues for AI analysis"
    echo
    
    wait_for_postgres
    
    # Initialize pgbench tables (idempotent)
    log "Initializing pgbench tables..."
    PGPASSWORD=$POSTGRES_PASSWORD pgbench \
        -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB \
        -i -s 1 >/dev/null 2>&1 || true
    
    echo
    log "Beginning Black Friday simulation..."
    echo
    
    # ============================================================================
    # PHASE 1: Normal Operations (0-10 minutes)
    # ============================================================================
    log_phase "1" "Normal Operations (10 minutes)"
    log "Expected: Baseline performance, healthy metrics"
    
    run_workload "normal_operations.sql" 10 2 600 "Regular shopping activity"
    pid1=$!
    show_progress "Normal Operations" 600 &
    progress_pid1=$!
    
    wait_for_workloads $pid1
    kill $progress_pid1 2>/dev/null || true
    
    log "30-second buffer between phases..."
    sleep 30
    echo
    
    # ============================================================================
    # PHASE 2: Traffic Surge (10-20 minutes)
    # ============================================================================
    log_phase "2" "Traffic Surge - Black Friday Begins! (10 minutes)"
    log "Expected: 3x traffic increase, slight performance degradation"
    
    run_workload "heavy_browsing.sql" 30 4 600 "Heavy browsing traffic"
    pid2a=$!
    run_workload "product_searches.sql" 15 2 600 "Product search surge"
    pid2b=$!
    
    show_progress "Traffic Surge" 600 &
    progress_pid2=$!
    
    wait_for_workloads $pid2a $pid2b
    kill $progress_pid2 2>/dev/null || true
    
    log "30-second buffer between phases..."
    sleep 30
    echo
    
    # ============================================================================
    # PHASE 3: Lock Contention Storm (20-35 minutes)
    # ============================================================================
    log_phase "3" "Lock Contention Storm [HIGH LOAD] (15 minutes)"
    log "Expected: Inventory deadlocks, long-running transactions"
    log "This should trigger CRITICAL ALERTS in your AI agent!"
    
    run_workload "inventory_updates.sql" 5 1 900 "Inventory management locks"
    pid3a=$!
    run_workload "purchase_attempts.sql" 20 4 900 "Competing purchase flows"
    pid3b=$!
    
    show_progress "Lock Contention Storm" 900 &
    progress_pid3=$!
    
    wait_for_workloads $pid3a $pid3b
    kill $progress_pid3 2>/dev/null || true
    
    log "30-second buffer between phases..."
    sleep 30
    echo
    
    # ============================================================================
    # PHASE 4: Query Performance Collapse (30-45 minutes)
    # ============================================================================
    log_phase "4" "Query Performance Collapse [CRITICAL] (15 minutes)"
    log "Expected: Slow queries, sequential scans, cache misses"
    log "AI should identify specific problematic queries"
    
    run_workload "expensive_analytics.sql" 15 3 900 "Resource-intensive analytics"
    pid4a=$!
    run_workload "unoptimized_searches.sql" 10 2 900 "Unoptimized search patterns"
    pid4b=$!
    
    show_progress "Query Performance Collapse" 900 &
    progress_pid4=$!
    
    wait_for_workloads $pid4a $pid4b
    kill $progress_pid4 2>/dev/null || true
    
    log "30-second buffer between phases..."
    sleep 30
    echo
    
    # ============================================================================
    # PHASE 5: Connection Pool Exhaustion (40-55 minutes)
    # ============================================================================
    log_phase "5" "Connection Pool Exhaustion [CRITICAL] (15 minutes)"
    log "Expected: Connection limit approached, idle connections"
    log "This should trigger CRITICAL ALERTS - connection leak detected!"
    
    run_workload "connection_leak.sql" 70 10 900 "Mobile app connection leak"
    pid5=$!
    
    show_progress "Connection Pool Exhaustion" 900 &
    progress_pid5=$!
    
    wait_for_workloads $pid5
    kill $progress_pid5 2>/dev/null || true
    
    log "30-second buffer between phases..."
    sleep 30
    echo
    
    # ============================================================================
    # PHASE 6: Recovery & Stabilization (50-60 minutes)
    # ============================================================================
    log_phase "6" "Recovery & Stabilization [RECOVERY] (10 minutes)"
    log "Expected: Metrics return to normal, system stabilizes"
    log "AI should detect recovery and provide post-incident analysis"
    
    run_workload "recovery_load.sql" 15 3 600 "Gradual load reduction"
    pid6=$!
    
    show_progress "Recovery & Stabilization" 600 &
    progress_pid6=$!
    
    wait_for_workloads $pid6
    kill $progress_pid6 2>/dev/null || true
    
    echo
    log "Black Friday simulation completed successfully!"
    echo
    log "What happened during the 60-minute journey:"
    log "  - Phase 1 (0-10m): Normal baseline operations"
    log "  - Phase 2 (10-20m): 3x traffic surge begins"
    log "  - Phase 3 (20-35m): Lock contention storm [HIGH LOAD]"
    log "  - Phase 4 (35-50m): Query performance collapse [CRITICAL]"
    log "  - Phase 5 (50-65m): Connection pool exhaustion [CRITICAL]"
    log "  - Phase 6 (65-75m): Recovery and stabilization [RECOVERY]"
    echo
    log "Now it's time for your AI DBA agent to analyze the data!"
    log "Access Prometheus: http://localhost:9090"
    log "Access Grafana: http://localhost:3000 (admin/admin123)"
    log "Use prompts in: ./prompts/ directory"
    echo
    log "Key metrics to investigate:"
    log "  - pg_database_numbackends (connection count)"
    log "  - pg_locks_count (lock contention)"
    log "  - pg_stat_statements_mean_time (query performance)"
    log "  - pg_database_blks_hit / pg_database_blks_read (cache efficiency)"
    echo
    log "The load generator will now keep running with minimal background activity..."
    
    # Keep container alive with minimal background load
    while true; do
        sleep 300  # 5 minutes
        PGPASSWORD=$POSTGRES_PASSWORD pgbench \
            -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB \
            -c 2 -j 1 -T 60 \
            -f "normal_operations.sql" \
            >/dev/null 2>&1 || true
    done
}

# Handle shutdown gracefully
cleanup() {
    log "Shutting down load generator..."
    # Kill any remaining background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

main "$@" 