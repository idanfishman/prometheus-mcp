# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3](https://github.com/idanfishman/prometheus-mcp/releases/tag/v1.1.3) - 2025-07-14

### Changed

- Bumped dependencies:
  - `@modelcontextprotocol/sdk` to `^1.15.1`
  - `dotenv` to `^17.2.0`
  - `zod` to `^3.25.76`
  - `eslint` to `^9.31.0`
  - `@eslint/js` to `^9.31.0`
  - `@types/node` to `^24.0.13`
  - `typescript-eslint` to `^8.36.0`

## [1.1.2](https://github.com/idanfishman/prometheus-mcp/releases/tag/v1.1.2) - 2025-06-30

### Fixed

- Fixed the issue where the MCP server was not working because of the `dotenv` logging.

### Changed

- Bumped dependencies:
  - `@modelcontextprotocol/sdk` to `^1.13.2`
  - `@eslint/js` to `^9.30.0`
  - `@types/node` to `^24.0.4`
  - `dotenv` to `^17.0.0`
  - `eslint` to `^9.30.0`
  - `eslint-plugin-prettier` to `^5.5.1`
  - `prettier` to `^3.6.2`

## [1.1.1](https://github.com/idanfishman/prometheus-mcp/releases/tag/v1.1.1) - 2025-06-30 [YANKED]

### Added

- Instructions for installing the MCP server in Claude Desktop via DXT extension.

## [1.1.0](https://github.com/idanfishman/prometheus-mcp/releases/tag/v1.1.0) - 2025-06-29

### Added

- PostgreSQL AI DBA Example - Complete demonstration of Claude acting as an AI DBA using the Prometheus MCP server
  - 60-minute Black Friday e-commerce simulation with 6 realistic performance phases
  - Full Docker stack: PostgreSQL, Prometheus, Grafana, PgBench load generator
  - 9 custom SQL workload patterns simulating real-world database issues
  - 4 AI DBA prompt templates for different analysis scenarios
  - Automated orchestration scripts for one-command deployment
- Release workflow for creating `.dxt` extension package for one-click installation in Claude Desktop

### Changed

- Upgraded Docker base image to `node-lts` version `22.17.0`.

## [1.0.3](https://github.com/idanfishman/prometheus-mcp/releases/tag/v1.0.3) - 2025-06-26

### Fixed

- Issue where the `linux/arm64` was not built, enabling support for multiple architectures in the Docker build process.

## [1.0.2](https://github.com/idanfishman/prometheus-mcp/releases/tag/v1.0.2) - 2025-06-24

### Added

- Dependabot configuration for automated npm and Docker dependency updates
- Pull request template with structured changelog sections
- Collapsible installation sections for multiple platforms (VS Code, Cursor, Windsurf, Claude Desktop)

### Changed

- Updated dependencies: `@modelcontextprotocol/sdk` to `^1.13.1`, `@types/node` to `^24.0.4`, `prettier` to `^3.6.0`
- Improved README badge styling and visual presentation
- Enhanced example configurations with environment variables

### Fixed

- Default PROMETHEUS_URL and adjusted default ports for HTTP transport

## [1.0.1](https://github.com/idanfishman/prometheus-mcp/releases/tag/v1.0.1) - 2025-06-24

### Fixed

- **NPM package** - Fixed the NPM package to correctly publish the package.

## [1.0.0](https://github.com/idanfishman/prometheus-mcp/releases/tag/v1.0.0) - 2025-06-23

### Added

- **Model Context Protocol (MCP) server** for Prometheus integration, enabling AI assistants to interact with Prometheus through natural language.
- **NPM package** (`idanfishman/prometheus-mcp`) for easy installation and integration.
- **Docker container** (`idanfishman/prometheus-mcp`) for containerized deployments, including health check endpoints.
- **Dual transport support**:
  - **stdio transport** - For direct integration with MCP clients like VS Code
  - **HTTP transport** - For web-based integrations and API access
- **Configurable tool capabilities** - Enable/disable specific tool categories as needed:
  - All capabilities enabled by default
  - Granular control over Discovery, Info, and Query tools
- **10 Prometheus tools** organized into three categories:
  - Discovery Tools
    - `prometheus_list_metrics` - List all available Prometheus metrics
    - `prometheus_metric_metadata` - Get metadata for specific metrics
    - `prometheus_list_labels` - List all available Prometheus labels
    - `prometheus_label_values` - Get values for specific labels
    - `prometheus_list_targets` - List all Prometheus scrape targets
    - `prometheus_scrape_pool_targets` - Get targets for specific scrape pools
  - Info Tools
    - `prometheus_runtime_info` - Get Prometheus runtime information
    - `prometheus_build_info` - Get Prometheus build information
  - Query Tools
    - `prometheus_query` - Execute instant Prometheus queries
    - `prometheus_query_range` - Execute range queries with time series data.

### Internal

- **Test coverage** - Test coverage for all critical parts.
- **Code quality tools** - ESLint and Prettier configuration
