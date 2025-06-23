import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PrometheusClient } from "../prometheus/client";
import { logger } from "../logging/logging";
import { type ToolAny, tools } from "./tools";
import packageJSON from "../../package.json";

const ServerConfigSchema = z
  .object({
    prometheusUrl: z
      .string()
      .url("must be a valid url")
      .default("http://localhost:9090"),
    enableDiscoveryTools: z
      .boolean()
      .default(true)
      .describe("enable prometheus discovery tools"),
    enableInfoTools: z.boolean().default(true).describe("enable prometheus info tools"),
    enableQueryTools: z
      .boolean()
      .default(true)
      .describe("enable prometheus query tools"),
  })
  .refine(
    (config) =>
      config.enableQueryTools || config.enableDiscoveryTools || config.enableInfoTools,
    {
      message:
        "at least one tool category must be enabled (enableQueryTools, enableDiscoveryTools, or enableInfoTools)",
    },
  );

/**
 * Maps tool capabilities to their corresponding configuration flags.
 * Used to filter tools based on enabled capabilities.
 */
const capabilityMap = {
  discovery: "enableDiscoveryTools",
  info: "enableInfoTools",
  query: "enableQueryTools",
} as const;

type ServerConfig = z.infer<typeof ServerConfigSchema>;

export class Server extends McpServer {
  private readonly prometheusClient: PrometheusClient;

  constructor(config: ServerConfig) {
    const validatedConfig = ServerConfigSchema.parse(config);

    super({
      name: packageJSON.name,
      version: packageJSON.version,
    });
    this.prometheusClient = new PrometheusClient(validatedConfig.prometheusUrl);

    // Filter tools based on enabled capabilities
    const prometheusTools: ToolAny[] = tools.filter(
      (tool) => validatedConfig[capabilityMap[tool.capability]] ?? false,
    );
    prometheusTools.forEach((tool) => this._registerTool(tool));
  }

  /**
   * Registers a tool with the MCP server.
   *
   * Configures the tool with appropriate metadata, input schema validation,
   * and error handling. All tool executions are logged and wrapped in
   * try-catch blocks for robust error handling.
   *
   * @param tool - The tool to register
   * @private
   */
  private _registerTool(tool: ToolAny) {
    this.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema.shape,
        annotations: {
          title: tool.title,
          readOnlyHint: tool.type === "readonly",
          destructiveHint: tool.type === "destructive",
          openWorldHint: false,
        },
      },
      // This tool is already typed, but the type system is not able to infer the type of the args
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (args: any) => {
        logger.info(`executing tool: ${tool.name}`);
        try {
          const result = await tool.handle(this.prometheusClient, args);
          logger.info(`tool ${tool.name} executed successfully`);
          return {
            isError: false,
            content: [{ type: "text" as const, text: JSON.stringify(result) }],
          };
        } catch (error) {
          logger.error(`tool ${tool.name} execution failed`);
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: error instanceof Error ? error.message : String(error),
              },
            ],
          };
        }
      },
    );
  }
}

export const createServer = () => {
  const config: ServerConfig = {
    prometheusUrl: process.env.PROMETHEUS_URL || "",
    enableQueryTools: parseBoolean(process.env.ENABLE_QUERY_TOOLS),
    enableDiscoveryTools: parseBoolean(process.env.ENABLE_DISCOVERY_TOOLS),
    enableInfoTools: parseBoolean(process.env.ENABLE_INFO_TOOLS),
  };

  return new Server(config);
};

const parseBoolean = (value: string | undefined): boolean => {
  if (value === undefined) return true;
  return value.toLowerCase().trim() === "true";
};
