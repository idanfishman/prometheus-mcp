#!/bin/bash

# PostgreSQL AI DBA Test Journey - Single Entry Point
# Starts the complete 60-minute Black Friday simulation with proper timing

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_banner() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                PostgreSQL AI DBA Test Journey               ║"
    echo "║                                                              ║"
    echo "║  Scenario: ShopFast E-commerce Black Friday                 ║"
    echo "║  Duration: 60 minutes of realistic performance issues       ║"
    echo "║  Goal: Test AI agent's DBA capabilities                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

start_postgres() {
    log "Starting PostgreSQL database..."
    docker-compose --profile postgres up -d
    
    log "Waiting for PostgreSQL to be healthy..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps postgres | grep -q "healthy"; then
            log_success "PostgreSQL is healthy and ready"
            return 0
        fi
        
        log "  Attempt $attempt/$max_attempts - waiting for PostgreSQL..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_error "PostgreSQL failed to become healthy after 5 minutes"
    exit 1
}

start_monitoring_stack() {
    log "Waiting 5 minutes before starting monitoring stack..."
    log "This allows PostgreSQL to stabilize and collect initial metrics"
    
    # Show countdown
    for i in {300..1}; do
        printf "\r${BLUE}[$(date '+%H:%M:%S')]${NC} Starting monitoring in %d seconds... " $i
        sleep 1
    done
    printf "\n"
    
    log "Starting monitoring stack (Prometheus, Grafana, Exporters)..."
    docker-compose --profile monitoring up -d
    
    log "Waiting for monitoring services to initialize..."
    sleep 30
    
    # Check service health
    for service in postgres_exporter prometheus prometheus_mcp grafana; do
        if docker-compose ps "$service" | grep -q "Up"; then
            log_success "$service is running"
        else
            log_warning "$service may not be ready yet"
        fi
    done
}

start_load_generator() {
    log "Building and starting the load generator..."
    log "This will run the complete 60-minute Black Friday simulation"
    
    # Start the load generator
    docker-compose --profile bench up --build
}

show_access_info() {
    echo
    log_success "Journey completed! Access your monitoring:"
    echo
    echo "  Prometheus Metrics: http://localhost:9090"
    echo "  Grafana Dashboards: http://localhost:3000 (admin/admin123)"
    echo "  Prometheus MCP: http://localhost:8080"
    echo
    log "Now analyze the data with your AI DBA agent!"
    echo "Use the prompts in ./prompts/ directory:"
    echo "  - core-preformance-analysis.md"
    echo "  - realtime-alert-response.md" 
    echo "  - weekly-newsletter-generator.md"
    echo "  - performance-optimization-hunt.md"
    echo
    log "Container Management:"
    echo "  - View all containers: docker-compose ps"
    echo "  - Stop everything: docker-compose down --profile postgres --profile monitoring --profile bench"
    echo "  - View logs: docker-compose logs [service_name]"
}

cleanup() {
    log "Cleaning up..."
    docker-compose down --profile postgres --profile monitoring --profile bench 2>/dev/null || true
    exit 0
}

main() {
    show_banner
    
    check_prerequisites
    
    echo
    log "Starting the 3-phase deployment:"
    log "  Phase 1: PostgreSQL startup (immediate)"
    log "  Phase 2: Monitoring stack (5 minutes after PostgreSQL)"
    log "  Phase 3: PgBench (after monitoring is ready)"
    echo
    
    # Phase 1: Start PostgreSQL
    start_postgres
    
    # Phase 2: Wait 5 minutes, then start monitoring
    start_monitoring_stack
    
    # Phase 3: Start load generator
    echo
    log "Ready to start the 60-minute load test journey!"
    log "The load generator will automatically run through 6 phases:"
    log "  Phase 1 (0-10m): Normal Operations"
    log "  Phase 2 (10-20m): Traffic Surge"
    log "  Phase 3 (20-35m): Lock Contention Storm [HIGH LOAD]"
    log "  Phase 4 (35-50m): Query Performance Collapse [CRITICAL]"
    log "  Phase 5 (50-65m): Connection Pool Exhaustion [CRITICAL]"
    log "  Phase 6 (65-75m): Recovery & Stabilization [RECOVERY]"
    echo
    
    read -p "Press Enter to begin the Black Friday simulation..."
    
    start_load_generator
    show_access_info
}

trap cleanup SIGINT SIGTERM

main "$@"