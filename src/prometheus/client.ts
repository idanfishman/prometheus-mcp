import { logger } from "../logging/logging";
import type {
  Response,
  QueryResult,
  LabelValues,
  Labels,
  MetricMetadata,
  TargetsResult,
  RuntimeInfo,
  BuildInfo,
} from "../types/prometheus-types";

/**
 * A client for interacting with the Prometheus HTTP API.
 *
 * This class provides methods to query metrics, retrieve metadata, list targets,
 * and get runtime information from a Prometheus server.
 *
 * @example
 * ```typescript
 * const client = new PrometheusClient('http://localhost:9090');
 * const result = await client.query('up');
 * console.log(result);
 * ```
 */
export class PrometheusClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  /**
   * Creates a new PrometheusClient instance.
   *
   * @param baseUrl - The base URL of the Prometheus server (e.g., 'http://localhost:9090')
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Makes an HTTP request to the Prometheus API.
   *
   * @template T - The expected response data type
   * @param endpoint - The API endpoint path (e.g., '/api/v1/query')
   * @param params - Optional query parameters to include in the request
   * @returns Promise resolving to the response data
   * @throws Error if the HTTP request fails or the API returns an error
   * @private
   */
  private async request<T>(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    const queryParams = new URLSearchParams(params);
    if (queryParams) {
      url.search = queryParams.toString();
    }
    logger.debug("making prometheus request", { endpoint, url });

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.headers,
      });

      if (!response.ok) {
        const error = `http ${response.status}: ${response.statusText}`;
        logger.error(error, { endpoint, status: response.status });
        throw new Error(error);
      }

      const result: Response<T> = await response.json();

      if (result.status !== "success") {
        const errorMsg = result.error || "unknown error";
        const error = `prometheus api error: ${errorMsg}`;
        logger.error(error, { endpoint, status: result.status });
        throw new Error(error);
      }

      logger.debug("prometheus request successful", { endpoint });
      return result.data;
    } catch (error) {
      logger.error("prometheus request failed", {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Executes a Prometheus query at a single point in time.
   *
   * @param query - The PromQL query string to execute
   * @param time - Optional timestamp for the query in RFC3339 format or Unix timestamp
   * @returns Promise resolving to the query result
   * @throws Error if the query fails or is invalid
   *
   * @example
   * ```typescript
   * // Query current values
   * const result = await client.query('up');
   *
   * // Query at specific time
   * const result = await client.query('up', '2023-01-01T00:00:00Z');
   * ```
   */
  async query(query: string, time?: string): Promise<QueryResult> {
    const endpoint = "/api/v1/query";
    const params: Record<string, string> = { query };
    if (time) {
      params.time = time;
    }
    return this.request<QueryResult>(endpoint, params);
  }

  /**
   * Executes a Prometheus query over a range of time.
   *
   * @param query - The PromQL query string to execute
   * @param start - Start timestamp in RFC3339 format or Unix timestamp
   * @param end - End timestamp in RFC3339 format or Unix timestamp
   * @param step - Query resolution step width (e.g., '15s', '1m', '1h')
   * @returns Promise resolving to the query result with time series data
   * @throws Error if the query fails or parameters are invalid
   *
   * @example
   * ```typescript
   * const result = await client.queryRange(
   *   'rate(http_requests_total[5m])',
   *   '2023-01-01T00:00:00Z',
   *   '2023-01-01T01:00:00Z',
   *   '1m'
   * );
   * ```
   */
  async queryRange(
    query: string,
    start: string,
    end: string,
    step: string,
  ): Promise<QueryResult> {
    const endpoint = "/api/v1/query_range";
    const params: Record<string, string> = { query, start, end, step };
    return this.request<QueryResult>(endpoint, params);
  }

  /**
   * Retrieves a list of all available metric names.
   *
   * @returns Promise resolving to an array of metric names
   * @throws Error if the request fails
   *
   * @example
   * ```typescript
   * const metrics = await client.listMetrics();
   * console.log(metrics); // ['up', 'http_requests_total', ...]
   * ```
   */
  async listMetrics(): Promise<LabelValues> {
    const endpoint = "/api/v1/label/__name__/values";
    return this.request<LabelValues>(endpoint);
  }

  /**
   * Retrieves metadata for a specific metric.
   *
   * @param metric - The metric name to get metadata for
   * @returns Promise resolving to the metric metadata including type, help text, and unit
   * @throws Error if the metric doesn't exist or the request fails
   *
   * @example
   * ```typescript
   * const metadata = await client.getMetricMetadata('http_requests_total');
   * console.log(metadata); // { type: 'counter', help: 'Total HTTP requests', unit: '' }
   * ```
   */
  async getMetricMetadata(metric: string): Promise<MetricMetadata> {
    const endpoint = "/api/v1/metadata";
    const params: Record<string, string> = { metric };
    return this.request<MetricMetadata>(endpoint, params);
  }

  /**
   * Retrieves a list of all label names.
   *
   * @returns Promise resolving to an array of label names
   * @throws Error if the request fails
   *
   * @example
   * ```typescript
   * const labels = await client.listLabels();
   * console.log(labels); // ['__name__', 'instance', 'job', ...]
   * ```
   */
  async listLabels(): Promise<Labels> {
    const endpoint = "/api/v1/labels";
    return this.request<Labels>(endpoint);
  }

  /**
   * Retrieves all possible values for a specific label.
   *
   * @param label - The label name to get values for
   * @returns Promise resolving to an array of label values
   * @throws Error if the label doesn't exist or the request fails
   *
   * @example
   * ```typescript
   * const values = await client.getLabelValues('job');
   * console.log(values); // ['prometheus', 'node-exporter', ...]
   * ```
   */
  async getLabelValues(label: string): Promise<LabelValues> {
    const endpoint = `/api/v1/label/${encodeURIComponent(label)}/values`;
    return this.request<LabelValues>(endpoint);
  }

  /**
   * Retrieves the current state of target discovery.
   *
   * @param scrapePool - Optional scrape pool name to filter targets
   * @returns Promise resolving to information about active and dropped targets
   * @throws Error if the request fails
   *
   * @example
   * ```typescript
   * // Get all targets
   * const allTargets = await client.listTargets();
   *
   * // Get targets for specific scrape pool
   * const poolTargets = await client.listTargets('my-scrape-pool');
   * ```
   */
  async listTargets(scrapePool?: string): Promise<TargetsResult> {
    const endpoint = "/api/v1/targets";
    const params: Record<string, string> = {};
    if (scrapePool) {
      params.scrapePool = scrapePool;
    }
    return this.request<TargetsResult>(endpoint, params);
  }

  /**
   * Retrieves targets for a specific scrape pool.
   *
   * @param scrapePool - The scrape pool name
   * @returns Promise resolving to information about targets in the specified pool
   * @throws Error if the scrape pool doesn't exist or the request fails
   *
   * @example
   * ```typescript
   * const targets = await client.getScrapePoolTargets('node-exporter');
   * ```
   */
  async getScrapePoolTargets(scrapePool: string): Promise<TargetsResult> {
    return this.listTargets(scrapePool);
  }

  /**
   * Retrieves Prometheus runtime information.
   *
   * @returns Promise resolving to runtime information including Go version, uptime, etc.
   * @throws Error if the request fails
   *
   * @example
   * ```typescript
   * const runtimeInfo = await client.getRuntimeInfo();
   * console.log(runtimeInfo.startTime); // '2023-01-01T00:00:00Z'
   * ```
   */
  async getRuntimeInfo(): Promise<RuntimeInfo> {
    const endpoint = "/api/v1/status/runtimeinfo";
    return this.request<RuntimeInfo>(endpoint);
  }

  /**
   * Retrieves Prometheus build information.
   *
   * @returns Promise resolving to build information including version, branch, and build date
   * @throws Error if the request fails
   *
   * @example
   * ```typescript
   * const buildInfo = await client.getBuildInfo();
   * console.log(buildInfo.version); // '2.40.0'
   * ```
   */
  async getBuildInfo(): Promise<BuildInfo> {
    const endpoint = "/api/v1/status/buildinfo";
    return this.request<BuildInfo>(endpoint);
  }
}
