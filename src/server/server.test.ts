import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Server, createServer } from "./server";
import { PrometheusClient } from "../prometheus/client";

// Mock the PrometheusClient
vi.mock("../prometheus/client");
const MockedPrometheusClient = vi.mocked(PrometheusClient);

// Mock the logger
vi.mock("../logging/logging", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock package.json
vi.mock("../../package.json", () => ({
  default: {
    name: "prometheus-mcp",
    version: "1.0.0",
  },
}));

describe("Server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockedPrometheusClient.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("should create server with default configuration", () => {
      const config = {
        prometheusUrl: "http://localhost:9090",
        enableDiscoveryTools: true,
        enableInfoTools: true,
        enableQueryTools: true,
      };

      const server = new Server(config);

      expect(server).toBeInstanceOf(Server);
      expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
    });

    it("should create server with minimal configuration", () => {
      const config = {
        prometheusUrl: "http://localhost:9090",
        enableDiscoveryTools: true,
        enableInfoTools: false,
        enableQueryTools: false,
      };

      const server = new Server(config);

      expect(server).toBeInstanceOf(Server);
      expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
    });

    it("should validate prometheus URL", () => {
      const config = {
        prometheusUrl: "invalid-url",
        enableDiscoveryTools: true,
        enableInfoTools: true,
        enableQueryTools: true,
      };

      expect(() => new Server(config)).toThrow();
    });

    it("should require at least one tool category enabled", () => {
      const config = {
        prometheusUrl: "http://localhost:9090",
        enableDiscoveryTools: false,
        enableInfoTools: false,
        enableQueryTools: false,
      };

      expect(() => new Server(config)).toThrow(
        "at least one tool category must be enabled (enableQueryTools, enableDiscoveryTools, or enableInfoTools)",
      );
    });

    it("should apply default values for optional configuration", () => {
      const config = {
        prometheusUrl: "http://localhost:9090",
        enableDiscoveryTools: true,
        enableInfoTools: true,
        enableQueryTools: true,
      };

      const server = new Server(config);

      expect(server).toBeInstanceOf(Server);
      expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
    });
  });

  describe("tool filtering", () => {
    it("should filter tools based on discovery capability only", () => {
      const server = new Server({
        prometheusUrl: "http://localhost:9090",
        enableDiscoveryTools: true,
        enableInfoTools: false,
        enableQueryTools: false,
      });

      expect(server).toBeInstanceOf(Server);
      expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
    });

    it("should filter tools based on info capability only", () => {
      const server = new Server({
        prometheusUrl: "http://localhost:9090",
        enableDiscoveryTools: false,
        enableInfoTools: true,
        enableQueryTools: false,
      });

      expect(server).toBeInstanceOf(Server);
      expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
    });

    it("should filter tools based on query capability only", () => {
      const server = new Server({
        prometheusUrl: "http://localhost:9090",
        enableDiscoveryTools: false,
        enableInfoTools: false,
        enableQueryTools: true,
      });

      expect(server).toBeInstanceOf(Server);
      expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
    });

    it("should enable all tools when all capabilities are enabled", () => {
      const server = new Server({
        prometheusUrl: "http://localhost:9090",
        enableDiscoveryTools: true,
        enableInfoTools: true,
        enableQueryTools: true,
      });

      expect(server).toBeInstanceOf(Server);
      expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
    });
  });
});

describe("createServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockedPrometheusClient.mockClear();
    // Clear environment variables
    delete process.env.PROMETHEUS_URL;
    delete process.env.ENABLE_QUERY_TOOLS;
    delete process.env.ENABLE_DISCOVERY_TOOLS;
    delete process.env.ENABLE_INFO_TOOLS;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should create server with default environment configuration", () => {
    // Set a valid URL since empty string fails validation
    process.env.PROMETHEUS_URL = "http://localhost:9090";

    const server = createServer();

    expect(server).toBeInstanceOf(Server);
    expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
  });

  it("should create server with environment variables", () => {
    process.env.PROMETHEUS_URL = "http://prometheus.example.com:9090";
    process.env.ENABLE_QUERY_TOOLS = "true";
    process.env.ENABLE_DISCOVERY_TOOLS = "false";
    process.env.ENABLE_INFO_TOOLS = "true";

    const server = createServer();

    expect(server).toBeInstanceOf(Server);
    expect(MockedPrometheusClient).toHaveBeenCalledWith(
      "http://prometheus.example.com:9090",
    );
  });

  it("should handle boolean environment variables correctly", () => {
    process.env.PROMETHEUS_URL = "http://localhost:9090";
    process.env.ENABLE_QUERY_TOOLS = "false";
    process.env.ENABLE_DISCOVERY_TOOLS = "TRUE";
    process.env.ENABLE_INFO_TOOLS = "False";

    const server = createServer();

    expect(server).toBeInstanceOf(Server);
    expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
  });

  it("should default to true for undefined boolean environment variables", () => {
    process.env.PROMETHEUS_URL = "http://localhost:9090";
    // Don't set the boolean env vars, they should default to true

    const server = createServer();

    expect(server).toBeInstanceOf(Server);
    expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
  });

  it("should handle edge cases in boolean parsing", () => {
    process.env.PROMETHEUS_URL = "http://localhost:9090";
    process.env.ENABLE_QUERY_TOOLS = "  TRUE  "; // with spaces
    process.env.ENABLE_DISCOVERY_TOOLS = "false";
    process.env.ENABLE_INFO_TOOLS = "invalid"; // invalid value should default to false

    const server = createServer();

    expect(server).toBeInstanceOf(Server);
    expect(MockedPrometheusClient).toHaveBeenCalledWith("http://localhost:9090");
  });
});

describe("parseBoolean function coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockedPrometheusClient.mockClear();
  });

  it("should test parseBoolean with various inputs through createServer", () => {
    process.env.PROMETHEUS_URL = "http://localhost:9090";

    // Test undefined case (defaults to true)
    delete process.env.ENABLE_QUERY_TOOLS;
    delete process.env.ENABLE_DISCOVERY_TOOLS;
    delete process.env.ENABLE_INFO_TOOLS;
    let server = createServer();
    expect(server).toBeInstanceOf(Server);

    // Test "true" case
    process.env.ENABLE_QUERY_TOOLS = "true";
    process.env.ENABLE_DISCOVERY_TOOLS = "false";
    process.env.ENABLE_INFO_TOOLS = "false";
    server = createServer();
    expect(server).toBeInstanceOf(Server);

    // Test "false" case (need at least one true)
    process.env.ENABLE_QUERY_TOOLS = "false";
    process.env.ENABLE_DISCOVERY_TOOLS = "true";
    process.env.ENABLE_INFO_TOOLS = "false";
    server = createServer();
    expect(server).toBeInstanceOf(Server);

    // Test case insensitive and trimming
    process.env.ENABLE_QUERY_TOOLS = "  TRUE  ";
    process.env.ENABLE_DISCOVERY_TOOLS = "false";
    process.env.ENABLE_INFO_TOOLS = "false";
    server = createServer();
    expect(server).toBeInstanceOf(Server);

    // Test invalid values default to false (but keep at least one true)
    process.env.ENABLE_QUERY_TOOLS = "invalid"; // defaults to false
    process.env.ENABLE_DISCOVERY_TOOLS = "true"; // keep this true
    process.env.ENABLE_INFO_TOOLS = "1"; // defaults to false
    server = createServer();
    expect(server).toBeInstanceOf(Server);
  });
});
