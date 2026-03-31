type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

function createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const entry = createEntry("info", message, context);
    console.log(JSON.stringify(entry));
  },

  warn(message: string, context?: Record<string, unknown>) {
    const entry = createEntry("warn", message, context);
    console.warn(JSON.stringify(entry));
  },

  error(message: string, context?: Record<string, unknown>) {
    const entry = createEntry("error", message, context);
    console.error(JSON.stringify(entry));
  },
};
