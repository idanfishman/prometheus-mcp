import yargs, { Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import {
  connectStdioTransport,
  connectStreamableHttpTransport,
} from "../server/transport";
import packageJSON from "../../package.json";

export const cmd = () => {
  const exe = yargs(hideBin(process.argv))
    .scriptName(packageJSON.name)
    .version(packageJSON.version);

  exe.command("stdio", "Start Prometheus MCP server using stdio", () =>
    connectStdioTransport(),
  );

  exe.command(
    "http",
    "Start Prometheus MCP server using Streamable HTTP",
    (yargs: Argv) => {
      return yargs.option("port", { type: "number", default: 3000 });
    },
    (args: { port: number }) => connectStreamableHttpTransport(args.port),
  );

  exe.demandCommand().parseSync();
};
