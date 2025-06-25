# Prometheus MCP Server

[![npm](https://img.shields.io/npm/v/prometheus-mcp?color=bright-green&logo=npm&logoColor=white&label=npm)](https://www.npmjs.com/package/prometheus-mcp)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-brightgreen?logo=docker&logoColor=white)](https://github.com/idanfishman/prometheus-mcp/pkgs/container/prometheus-mcp)
[![codecov](https://img.shields.io/codecov/c/github/idanfishman/prometheus-mcp?color=brightgreen&logo=codecov&logoColor=white&label=coverage)](https://codecov.io/gh/idanfishman/prometheus-mcp)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides seamless integration between AI
assistants and [Prometheus](https://prometheus.io/), enabling natural language
interactions with your monitoring infrastructure. This server allows for effortless
querying, discovery, and analysis of metrics through Visual Studio Code, Cursor,
Windsurf, Claude Desktop, and other MCP clients.

## Key Features

- **Fast and lightweight**. Direct API integration with Prometheus, no complex parsing
  needed.
- **LLM-friendly**. Structured JSON responses optimized for AI assistant consumption.
- **Configurable capabilities**. Enable/disable tool categories based on your security
  and operational requirements.
- **Dual transport support**. Works with both stdio and HTTP transports for maximum
  compatibility.

## Requirements

- Node.js 20.19.0 or newer
- Access to a Prometheus server
- VS Code, Cursor, Windsurf, Claude Desktop or any other MCP client

## Getting Started

First, install the Prometheus MCP server with your client. A typical configuration looks
like this:

```json
{
  "mcpServers": {
    "prometheus": {
      "command": "npx",
      "args": ["prometheus-mcp@latest", "stdio"],
      "env": {
        "PROMETHEUS_URL": "http://localhost:9090"
      }
    }
  }
}
```

<details><summary><b>Install in VS Code</b></summary>

```bash
# For VS Code
code --add-mcp '{"name":"prometheus","command":"npx","args":["prometheus-mcp@latest","stdio"],"env":{"PROMETHEUS_URL":"http://localhost:9090"}}'

# For VS Code Insiders
code-insiders --add-mcp '{"name":"prometheus","command":"npx","args":["prometheus-mcp@latest","stdio"],"env":{"PROMETHEUS_URL":"http://localhost:9090"}}'
```

After installation, the Prometheus MCP server will be available for use with your GitHub
Copilot agent in VS Code.

</details>

<details><summary><b>Install in Cursor</b></summary>

Go to `Cursor Settings` → `MCP` → `Add new MCP Server`. Name to your liking, use
`command` type with the command `npx prometheus-mcp`. You can also verify config or add
command arguments via clicking `Edit`.

```json
{
  "mcpServers": {
    "prometheus": {
      "command": "npx",
      "args": ["prometheus-mcp@latest", "stdio"],
      "env": {
        "PROMETHEUS_URL": "http://localhost:9090"
      }
    }
  }
}
```

</details>

<details><summary><b>Install in Windsurf</b></summary>

Follow Windsurf MCP documentation. Use the following configuration:

```json
{
  "mcpServers": {
    "prometheus": {
      "command": "npx",
      "args": ["prometheus-mcp@latest", "stdio"],
      "env": {
        "PROMETHEUS_URL": "http://localhost:9090"
      }
    }
  }
}
```

</details>

<details><summary><b>Install in Claude Desktop</b></summary>

Follow the [MCP install guide](https://modelcontextprotocol.io/clients#claude-desktop),
use the following configuration:

```json
{
  "mcpServers": {
    "prometheus": {
      "command": "npx",
      "args": ["prometheus-mcp@latest", "stdio"],
      "env": {
        "PROMETHEUS_URL": "http://localhost:9090"
      }
    }
  }
}
```

</details>
  
## Configuration

Prometheus MCP server supports the following arguments. They can be provided in the JSON
configuration above, as part of the `"args"` list:

```bash
> npx prometheus-mcp@latest --help

Commands:
  stdio  Start Prometheus MCP server using stdio transport
  http   Start Prometheus MCP server using HTTP transport

Options:
  --help     Show help                          [boolean]
  --version  Show version number                [boolean]
```

### Environment Variables

You can also configure the server using environment variables:

- `PROMETHEUS_URL` - Prometheus server URL
- `ENABLE_DISCOVERY_TOOLS` - Set to "false" to disable discovery tools (default: true)
- `ENABLE_INFO_TOOLS` - Set to "false" to disable info tools (default: true)
- `ENABLE_QUERY_TOOLS` - Set to "false" to disable query tools (default: true)

## Standalone MCP Server

When running in server environments or when you need HTTP transport, run the MCP server
with the `http` command:

```bash
npx prometheus-mcp@latest http --port 3000
```

And then in your MCP client config, set the `url` to the HTTP endpoint:

```json
{
  "mcpServers": {
    "prometheus": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:3000/mcp"]
    }
  }
}
```

## Docker

Run the Prometheus MCP server using Docker:

```json
{
  "mcpServers": {
    "prometheus": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--init",
        "--pull=always",
        "-e",
        "PROMETHEUS_URL=http://host.docker.internal:9090",
        "ghcr.io/idanfishman/prometheus-mcp",
        "stdio"
      ]
    }
  }
}
```

## Tools

The Prometheus MCP server provides 10 tools organized into three configurable
categories:

<details><summary><b>Discovery</b></summary>

Tools for exploring your Prometheus infrastructure:

- **`prometheus_list_metrics`**
  - **Description**: List all available Prometheus metrics
  - **Parameters**: None
  - **Read-only**: **true**

- **`prometheus_metric_metadata`**
  - **Description**: Get metadata for a specific Prometheus metric
  - **Parameters**:
    - `metric` (string): Metric name to get metadata for
  - **Read-only**: **true**

- **`prometheus_list_labels`**
  - **Description**: List all available Prometheus labels
  - **Parameters**: None
  - **Read-only**: **true**

- **`prometheus_label_values`**
  - **Description**: Get all values for a specific Prometheus label
  - **Parameters**:
    - `label` (string): Label name to get values for
  - **Read-only**: **true**

- **`prometheus_list_targets`**
  - **Description**: List all Prometheus scrape targets
  - **Parameters**: None
  - **Read-only**: **true**

- **`prometheus_scrape_pool_targets`**
  - **Description**: Get targets for a specific scrape pool
  - **Parameters**:
    - `scrapePool` (string): Scrape pool name
  - **Read-only**: **true**

</details>

<details><summary><b>Info</b></summary>

Tools for accessing Prometheus server information:

- **`prometheus_runtime_info`**
  - **Description**: Get Prometheus runtime information
  - **Parameters**: None
  - **Read-only**: **true**

- **`prometheus_build_info`**
  - **Description**: Get Prometheus build information
  - **Parameters**: None
  - **Read-only**: **true**

</details>

<details><summary><b>Query</b></summary>

Tools for executing Prometheus queries:

- **`prometheus_query`**
  - **Description**: Execute an instant Prometheus query
  - **Parameters**:
    - `query` (string): Prometheus query expression
    - `time` (string, optional): Time parameter for the query (RFC3339 format)
  - **Read-only**: **true**

- **`prometheus_query_range`**
  - **Description**: Execute a Prometheus range query
  - **Parameters**:
    - `query` (string): Prometheus query expression
    - `start` (string): Start timestamp (RFC3339 or unix timestamp)
    - `end` (string): End timestamp (RFC3339 or unix timestamp)
    - `step` (string): Query resolution step width
  - **Read-only**: **true**

</details>

## Example Usage

Here are some example interactions you can have with your AI assistant:

### Basic Queries

- "Show me all available metrics in Prometheus"
- "What's the current CPU usage across all instances?"
- "Get the memory usage for the last hour"

### Discovery and Exploration

- "List all scrape targets and their status"
- "What labels are available for the `http_requests_total` metric?"
- "Show me all metrics related to 'cpu'"

### Advanced Analysis

- "Compare CPU usage between production and staging environments"
- "Show me the top 10 services by memory consumption"
- "What's the error rate trend for the API service over the last 24 hours?"

## Security Considerations

- **Network Access**: The server requires network access to your Prometheus instance
- **Resource Usage**: Range queries can be resource-intensive; monitor your Prometheus
  server load

## Troubleshooting

### Connection Issues

- Verify your Prometheus server is accessible at the configured URL
- Check firewall settings and network connectivity
- Ensure Prometheus API is enabled (default on port 9090)

### Permission Errors

- Verify the MCP server has network access to Prometheus
- Check if authentication is required for your Prometheus setup

### Tool Availability

- If certain tools are missing, check if they've been disabled via configuration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for
details.

## Support

- **GitHub Issues**:
  [Report bugs or request features](https://github.com/idanfishman/prometheus-mcp/issues)
- **Documentation**:
  [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- **Prometheus**: [Prometheus Documentation](https://prometheus.io/docs/)

Built with ❤️ for the Prometheus and MCP communities
