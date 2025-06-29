#!/usr/bin/env node

import fs from "fs";

// Read package.json to extract metadata
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

// Generate the DXT manifest
const manifest = {
  dxt_version: "0.1",
  name: packageJson.name,
  display_name: packageJson.description,
  version: packageJson.version,
  description: packageJson.description,
  long_description: `A Model Context Protocol (MCP) server that provides tools for querying Prometheus metrics and time-series data. This extension allows Claude to interact with Prometheus instances to retrieve metrics, execute queries, and analyze monitoring data.

Features:
- Query Prometheus metrics with PromQL
- Retrieve metric metadata and labels
- Access time-series data for analysis
- Support for range and instant queries
- Built-in error handling and validation`,
  author: {
    name: packageJson.author,
    url: "https://github.com/idanfishman",
  },
  repository: {
    type: "git",
    url: "https://github.com/idanfishman/prometheus-mcp-server",
  },
  homepage: "https://github.com/idanfishman/prometheus-mcp-server",
  documentation: "https://github.com/idanfishman/prometheus-mcp-server",
  support: "https://github.com/idanfishman/prometheus-mcp-server/issues",
  icon: "icon.png",
  server: {
    type: "node",
    entry_point: "dist/index.mjs",
    mcp_config: {
      command: "node",
      args: ["${__dirname}/dist/index.mjs", "stdio"],
      env: {
        PROMETHEUS_URL: "${user_config.prometheus_url}",
      },
    },
  },
  tools: [
    {
      name: "prometheus_list_metrics",
      description: "List all available Prometheus metrics",
    },
    {
      name: "prometheus_metric_metadata",
      description: "Get metadata for a specific Prometheus metric",
    },
    {
      name: "prometheus_list_labels",
      description: "List all available Prometheus labels",
    },
    {
      name: "prometheus_label_values",
      description: "Get available values for a specific label",
    },
    {
      name: "prometheus_list_targets",
      description: "List all available Prometheus targets",
    },
    {
      name: "prometheus_scrape_pool_targets",
      description: "Get targets for a specific scrape pool",
    },
    {
      name: "prometheus_runtime_info",
      description: "Get Prometheus runtime information",
    },
    {
      name: "prometheus_build_info",
      description: "Get Prometheus build information",
    },
    {
      name: "prometheus_query",
      description: "Execute PromQL queries against Prometheus",
    },
    {
      name: "prometheus_query_range",
      description: "Execute PromQL range queries for time-series data",
    },
  ],
  tools_generated: false,
  keywords: packageJson.keywords,
  license: packageJson.license,
  compatibility: {
    platforms: ["darwin", "win32", "linux"],
    runtimes: {
      node: packageJson.engines.node,
    },
  },
  user_config: {
    PROMETHEUS_URL: {
      type: "string",
      title: "Prometheus URL",
      description: "The URL of your Prometheus instance (e.g., http://localhost:9090)",
      default: "http://localhost:9090",
    },
    ENABLE_QUERY_TOOLS: {
      type: "boolean",
      title: "Enable Query Tools",
      description: "Enable query tools for Prometheus",
      default: true,
    },
    ENABLE_DISCOVERY_TOOLS: {
      type: "boolean",
      title: "Enable Discovery Tools",
      description: "Enable discovery tools for Prometheus",
      default: true,
    },
    ENABLE_INFO_TOOLS: {
      type: "boolean",
      title: "Enable Info Tools",
      description: "Enable info tools for Prometheus",
      default: true,
    },
  },
};

// Write the manifest file
fs.writeFileSync("manifest.json", JSON.stringify(manifest, null, 2));
console.log("DXT manifest.json generated successfully");
