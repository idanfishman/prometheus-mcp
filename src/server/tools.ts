import { z } from "zod";
import type { PrometheusClient } from "../prometheus/client";
import type {
  QueryResult,
  LabelValues,
  Labels,
  MetricMetadata,
  TargetsResult,
  RuntimeInfo,
  BuildInfo,
} from "../types/prometheus-types";

/**
 * Represents the capabilities of a tool
 * - "discovery": tools that discover metrics, labels, targets, etc.
 * - "info": tools that provide runtime or build information
 * - "query": tools that execute Prometheus queries
 */
export type ToolCapability = "discovery" | "info" | "query";

/**
 * Represents a tool that can be executed against a Prometheus client
 * - capability: the type of functionality the tool provides
 * - name: unique identifier for the tool
 * - title: human-readable title for the tool
 * - description: detailed description of what the tool does
 * - inputSchema: zod schema defining the input parameters for the tool
 * - type: indicates if the tool is readonly or destructive
 * - handle: function that executes the tool logic using a Prometheus client
 */
export type Tool<T extends z.Schema, U> = {
  capability: ToolCapability;
  name: string;
  title: string;
  description: string;
  inputSchema: T;
  type: "readonly" | "destructive";
  handle: (client: PrometheusClient, args: z.output<T>) => Promise<U>;
};

/**
 * Helper function to define a tool with the required properties
 * This ensures consistent structure and typing for all tools
 */
function defineTool<T extends z.Schema, U>(tool: Tool<T, U>): Tool<T, U> {
  return tool;
}

const PrometheusQuerySchema = z.object({
  query: z.string().describe("prometheus query expression"),
  time: z
    .string()
    .optional()
    .describe("optional time parameter for the query, in RFC3339 format"),
});

const PrometheusQueryRangeSchema = z.object({
  query: z.string().describe("prometheus query expression"),
  start: z.string().describe("start timestamp (RFC3339 or unix timestamp)"),
  end: z.string().describe("end timestamp (RFC3339 or unix timestamp)"),
  step: z.string().describe("query resolution step width"),
});

const PrometheusMetricMetadataSchema = z.object({
  metric: z.string().describe("metric name to get metadata for"),
});

const PrometheusLabelValuesSchema = z.object({
  label: z.string().describe("label name to get values for"),
});

const PrometheusScrapePoolTargetsSchema = z.object({
  scrapePool: z.string().describe("scrape pool name"),
});

const EmptySchema = z.object({});

/**
 * Union type representing all possible tool types with their specific schemas and return types
 * This maintains type safety while allowing a heterogeneous array of tools
 */
export type ToolAny =
  | Tool<typeof EmptySchema, Labels>
  | Tool<typeof PrometheusMetricMetadataSchema, MetricMetadata>
  | Tool<typeof EmptySchema, Labels>
  | Tool<typeof PrometheusLabelValuesSchema, LabelValues>
  | Tool<typeof EmptySchema, TargetsResult>
  | Tool<typeof PrometheusScrapePoolTargetsSchema, TargetsResult>
  | Tool<typeof EmptySchema, RuntimeInfo>
  | Tool<typeof EmptySchema, BuildInfo>
  | Tool<typeof PrometheusQuerySchema, QueryResult>
  | Tool<typeof PrometheusQueryRangeSchema, QueryResult>;

export const tools: ToolAny[] = [
  defineTool<typeof EmptySchema, Labels>({
    capability: "discovery",
    name: "prometheus_list_metrics",
    title: "List Prometheus Metrics",
    description: "List all available Prometheus metrics",
    inputSchema: EmptySchema,
    type: "readonly",
    handle: async (client: PrometheusClient) => client.listMetrics(),
  }),
  defineTool<typeof PrometheusMetricMetadataSchema, MetricMetadata>({
    capability: "discovery",
    name: "prometheus_metric_metadata",
    title: "Get Metric Metadata",
    description: "Get metadata for a specific Prometheus metric",
    inputSchema: PrometheusMetricMetadataSchema,
    type: "readonly",
    handle: async (client: PrometheusClient, args) =>
      client.getMetricMetadata(args.metric),
  }),
  defineTool<typeof EmptySchema, Labels>({
    capability: "discovery",
    name: "prometheus_list_labels",
    title: "List Prometheus Labels",
    description: "List all available Prometheus labels",
    inputSchema: EmptySchema,
    type: "readonly",
    handle: async (client: PrometheusClient) => client.listLabels(),
  }),
  defineTool<typeof PrometheusLabelValuesSchema, LabelValues>({
    capability: "discovery",
    name: "prometheus_label_values",
    title: "Get Label Values",
    description: "Get all values for a specific Prometheus label",
    inputSchema: PrometheusLabelValuesSchema,
    type: "readonly",
    handle: async (client: PrometheusClient, args) => client.getLabelValues(args.label),
  }),
  defineTool<typeof EmptySchema, TargetsResult>({
    capability: "discovery",
    name: "prometheus_list_targets",
    title: "List Prometheus Targets",
    description: "List all Prometheus targets",
    inputSchema: EmptySchema,
    type: "readonly",
    handle: async (client: PrometheusClient) => client.listTargets(),
  }),
  defineTool<typeof PrometheusScrapePoolTargetsSchema, TargetsResult>({
    capability: "discovery",
    name: "prometheus_scrape_pool_targets",
    title: "Get Scrape Pool Targets",
    description: "Get targets for a specific scrape pool",
    inputSchema: PrometheusScrapePoolTargetsSchema,
    type: "readonly",
    handle: async (client: PrometheusClient, args) =>
      client.getScrapePoolTargets(args.scrapePool),
  }),
  defineTool<typeof EmptySchema, RuntimeInfo>({
    capability: "info",
    name: "prometheus_runtime_info",
    title: "Get Runtime Info",
    description: "Get Prometheus runtime information",
    inputSchema: EmptySchema,
    type: "readonly",
    handle: async (client: PrometheusClient) => client.getRuntimeInfo(),
  }),
  defineTool<typeof EmptySchema, BuildInfo>({
    capability: "info",
    name: "prometheus_build_info",
    title: "Get Build Info",
    description: "Get Prometheus build information",
    inputSchema: EmptySchema,
    type: "readonly",
    handle: async (client: PrometheusClient) => client.getBuildInfo(),
  }),
  defineTool<typeof PrometheusQuerySchema, QueryResult>({
    capability: "query",
    name: "prometheus_query",
    title: "Prometheus Query",
    description: "Execute a Prometheus query",
    inputSchema: PrometheusQuerySchema,
    type: "readonly",
    handle: async (client: PrometheusClient, args) =>
      client.query(args.query, args.time),
  }),
  defineTool<typeof PrometheusQueryRangeSchema, QueryResult>({
    capability: "query",
    name: "prometheus_query_range",
    title: "Prometheus Query Range",
    description: "Execute a Prometheus range query",
    inputSchema: PrometheusQueryRangeSchema,
    type: "readonly",
    handle: async (client: PrometheusClient, args) =>
      client.queryRange(args.query, args.start, args.end, args.step),
  }),
];
