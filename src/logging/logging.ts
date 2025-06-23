import { pino } from "pino";
import { stderr } from "process";

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
  },
  pino.destination(stderr),
);
