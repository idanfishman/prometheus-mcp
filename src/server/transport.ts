import express from "express";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server";
import { logger } from "../logging/logging";

/**
 * Connects the Prometheus MCP server to stdio transport.
 *
 * This is the standard transport method for MCP servers, allowing direct
 * communication with MCP clients through standard input/output streams.
 * This method is preferred for most integrations as it provides efficient
 * bidirectional communication.
 *
 * The server will:
 * - Create a new server instance with environment-based configuration
 * - Connect to stdio transport for message handling
 * - Log the connection attempt
 *
 * @example
 * ```typescript
 * // Start stdio transport
 * connectStdioTransport();
 * ```
 */
export const connectStdioTransport = () => {
  const server = createServer();
  logger.info("connecting to stdio transport");
  server.connect(new StdioServerTransport());
};

/**
 * Connects the Prometheus MCP server to HTTP transport.
 *
 * Creates an Express HTTP server that handles MCP requests via HTTP POST.
 * This transport method is useful for web-based integrations or when
 * stdio transport is not suitable.
 *
 * The HTTP server provides:
 * - POST /mcp: Handles MCP requests with proper session management
 * - GET /mcp: Returns 405 Method Not Allowed (MCP requires POST)
 * - DELETE /mcp: Returns 405 Method Not Allowed (MCP requires POST)
 *
 * Features:
 * - Automatic session cleanup on request close
 * - Proper error handling with JSON-RPC error responses
 * - Request logging for debugging
 *
 * @param port - The port number to listen on
 *
 * @example
 * ```typescript
 * // Start HTTP transport on port 3000
 * connectStreamableHttpTransport(3000);
 *
 * // Client can then make requests to:
 * // POST http://localhost:3000/mcp
 * ```
 */
export const connectStreamableHttpTransport = (port: number) => {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    try {
      const server = createServer();
      const transport: StreamableHTTPServerTransport =
        new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

      res.on("close", () => {
        logger.info("request closed");
        transport.close();
        server.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error("error handling mcp request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", async (req, res) => {
    logger.info("received GET mcp request");
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "method not allowed",
        },
        id: null,
      }),
    );
  });

  app.delete("/mcp", async (req, res) => {
    logger.info("received DELETE mcp request");
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "method not allowed",
        },
        id: null,
      }),
    );
  });

  app.get("/healthy", (req, res) => {
    res.status(200).end();
  });

  app.get("/ready", (req, res) => {
    res.status(200).end();
  });

  logger.info(`connecting to streamable http transport on port: ${port}`);
  app.listen(port);
};
