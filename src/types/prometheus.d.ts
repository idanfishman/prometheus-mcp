declare namespace Prometheus {
  /**
   * Base client response type
   * Used for all Prometheus API responses
   */
  export type BaseClientResponse = {};

  /**
   * Standard response format for Prometheus API endpoints
   * Based on official Prometheus API documentation
   */
  export type Response<T> = {
    /** Response status - "success" or "error" */
    status: "success" | "error";
    /** The actual response data */
    data: T;
    /** Error type if status is "error" */
    errorType?: string;
    /** Error message if status is "error" */
    error?: string;
    /** Warnings that don't inhibit request execution */
    warnings?: string[];
    /** Info-level annotations for potential query issues */
    infos?: string[];
  };

  /**
   * Result of a Prometheus query execution
   * Based on official Prometheus API documentation
   */
  export type QueryResult = {
    /** Type of the result - "vector", "matrix", "scalar", or "string" */
    resultType: "vector" | "matrix" | "scalar" | "string";
    /** Array of query results containing metric data */
    result: QueryResultValue;
  };

  /**
   * Metric sample value with timestamp
   */
  export type SampleValue = [number, string]; // [timestamp, value]

  /**
   * Individual query result value
   */
  export type QueryResultValue =
    | SampleValue // scalar result
    | string // string result
    | MetricVector[] // vector result
    | MatrixResult[]; // matrix result

  /**
   * Vector result containing metric and value
   */
  export type MetricVector = {
    /** Metric labels */
    metric: Record<string, string>;
    /** Sample value */
    value: SampleValue;
  };

  /**
   * Matrix result containing metric and values over time
   */
  export type MatrixResult = {
    /** Metric labels */
    metric: Record<string, string>;
    /** Array of sample values over time */
    values: SampleValue[];
  };

  /**
   * Label values response
   */
  export type LabelValues = string[];

  /**
   * Labels response
   */
  export type Labels = string[];

  /**
   * Metric metadata information
   */
  export type MetricMetadata = Record<string, MetricMetadataEntry[]>;

  /**
   * Individual metric metadata entry
   */
  export type MetricMetadataEntry = {
    /** Metric type (counter, gauge, histogram, summary, untyped) */
    type: "counter" | "gauge" | "histogram" | "summary" | "untyped";
    /** Help text for the metric */
    help: string;
    /** Unit of the metric */
    unit?: string;
  };

  /**
   * Target discovery information
   */
  export type TargetsResult = {
    /** Active targets */
    activeTargets: Target[];
    /** Dropped targets */
    droppedTargets: DroppedTarget[];
  };

  /**
   * Active target information
   */
  export type Target = {
    /** Discovered labels */
    discoveredLabels: Record<string, string>;
    /** Final labels after relabeling */
    labels: Record<string, string>;
    /** Target URL */
    scrapePool: string;
    /** Target URL */
    scrapeUrl: string;
    /** Global URL */
    globalUrl: string;
    /** Last scrape timestamp */
    lastScrape: string;
    /** Last scrape duration */
    lastScrapeDuration: number;
    /** Last error if any */
    lastError: string;
    /** Target health status */
    health: "up" | "down" | "unknown";
  };

  /**
   * Dropped target information
   */
  export type DroppedTarget = {
    /** Discovered labels */
    discoveredLabels: Record<string, string>;
  };

  /**
   * Runtime information
   */
  export type RuntimeInfo = {
    /** Start time */
    startTime: string;
    /** Command line arguments */
    CWD: string;
    /** Reload config success */
    reloadConfigSuccess: boolean;
    /** Last config time */
    lastConfigTime: string;
    /** Corruption count */
    corruptionCount: number;
    /** Go version */
    GOGC: string;
    /** Go debug */
    GODEBUG: string;
    /** Storage retention */
    storageRetention: string;
  };

  /**
   * Build information
   */
  export type BuildInfo = {
    /** Version */
    version: string;
    /** Revision */
    revision: string;
    /** Branch */
    branch: string;
    /** Build user */
    buildUser: string;
    /** Build date */
    buildDate: string;
    /** Go version */
    goVersion: string;
  };
}
