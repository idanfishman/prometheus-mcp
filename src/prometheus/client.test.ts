import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PrometheusClient } from "./client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the logger
vi.mock("../logging/logging", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("PrometheusClient", () => {
  let client: PrometheusClient;
  const baseUrl = "http://localhost:9090";

  beforeEach(() => {
    client = new PrometheusClient(baseUrl);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct base URL", () => {
      expect(client).toBeInstanceOf(PrometheusClient);
    });
  });

  describe("query", () => {
    it("should make successful query request", async () => {
      const mockResponse = {
        status: "success",
        data: {
          resultType: "vector",
          result: [
            {
              metric: { __name__: "up", job: "prometheus" },
              value: [1640995200, "1"],
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.query("up");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9090/api/v1/query?query=up",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should make query request with time parameter", async () => {
      const mockResponse = {
        status: "success",
        data: { resultType: "vector", result: [] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const time = "2024-01-01T00:00:00Z";
      await client.query("up", time);

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:9090/api/v1/query?query=up&time=${encodeURIComponent(time)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(client.query("up")).rejects.toThrow(
        "http 500: Internal Server Error",
      );
    });

    it("should handle Prometheus API errors", async () => {
      const mockResponse = {
        status: "error",
        error: "invalid query",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(client.query("invalid")).rejects.toThrow(
        "prometheus api error: invalid query",
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.query("up")).rejects.toThrow("Network error");
    });
  });

  describe("queryRange", () => {
    it("should make successful range query request", async () => {
      const mockResponse = {
        status: "success",
        data: {
          resultType: "matrix",
          result: [
            {
              metric: { __name__: "up", job: "prometheus" },
              values: [
                [1640995200, "1"],
                [1640995260, "1"],
              ],
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.queryRange(
        "up",
        "2024-01-01T00:00:00Z",
        "2024-01-01T01:00:00Z",
        "60s",
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9090/api/v1/query_range?query=up&start=2024-01-01T00%3A00%3A00Z&end=2024-01-01T01%3A00%3A00Z&step=60s",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("listMetrics", () => {
    it("should list all metrics", async () => {
      const mockResponse = {
        status: "success",
        data: ["up", "prometheus_build_info", "go_info"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listMetrics();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9090/api/v1/label/__name__/values",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getMetricMetadata", () => {
    it("should get metadata for specific metric", async () => {
      const mockResponse = {
        status: "success",
        data: {
          up: [
            {
              type: "gauge",
              help: "The scraping was successful",
              unit: "",
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getMetricMetadata("up");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9090/api/v1/metadata?metric=up",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("listLabels", () => {
    it("should list all labels", async () => {
      const mockResponse = {
        status: "success",
        data: ["__name__", "job", "instance"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listLabels();

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:9090/api/v1/labels", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getLabelValues", () => {
    it("should get values for specific label", async () => {
      const mockResponse = {
        status: "success",
        data: ["prometheus", "node-exporter"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getLabelValues("job");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9090/api/v1/label/job/values",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle special characters in label names", async () => {
      const mockResponse = {
        status: "success",
        data: ["value1", "value2"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.getLabelValues("label/with/slashes");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9090/api/v1/label/label%2Fwith%2Fslashes/values",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
    });
  });

  describe("listTargets", () => {
    it("should list all targets", async () => {
      const mockResponse = {
        status: "success",
        data: {
          activeTargets: [
            {
              discoveredLabels: { __address__: "localhost:9090" },
              labels: { instance: "localhost:9090", job: "prometheus" },
              scrapePool: "prometheus",
              scrapeUrl: "http://localhost:9090/metrics",
              globalUrl: "http://localhost:9090/metrics",
              lastError: "",
              lastScrape: "2024-01-01T00:00:00Z",
              lastScrapeDuration: 0.001,
              health: "up",
            },
          ],
          droppedTargets: [],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listTargets();

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:9090/api/v1/targets", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should list targets for specific scrape pool", async () => {
      const mockResponse = {
        status: "success",
        data: { activeTargets: [], droppedTargets: [] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.listTargets("prometheus");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9090/api/v1/targets?scrapePool=prometheus",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
    });
  });

  describe("getScrapePoolTargets", () => {
    it("should get targets for specific scrape pool", async () => {
      const mockResponse = {
        status: "success",
        data: { activeTargets: [], droppedTargets: [] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getScrapePoolTargets("prometheus");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9090/api/v1/targets?scrapePool=prometheus",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getRuntimeInfo", () => {
    it("should get runtime information", async () => {
      const mockResponse = {
        status: "success",
        data: {
          startTime: "2024-01-01T00:00:00Z",
          CWD: "/prometheus",
          reloadConfigSuccess: true,
          lastConfigTime: "2024-01-01T00:00:00Z",
          corruptionCount: 0,
          goroutineCount: 100,
          GOMAXPROCS: 4,
          GOGC: "",
          GODEBUG: "",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getRuntimeInfo();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9090/api/v1/status/runtimeinfo",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getBuildInfo", () => {
    it("should get build information", async () => {
      const mockResponse = {
        status: "success",
        data: {
          version: "2.45.0",
          revision: "abc123",
          branch: "HEAD",
          buildUser: "root@buildhost",
          buildDate: "2024-01-01T00:00:00Z",
          goVersion: "go1.20.0",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getBuildInfo();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9090/api/v1/status/buildinfo",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
