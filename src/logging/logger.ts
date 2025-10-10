export class Logger {
  static error(message: string, context?: Record<string, unknown>): void {
    console.error(message, context ? JSON.stringify(context, null, 2) : '');
  }

  static warn(message: string, context?: Record<string, unknown>): void {
    console.warn(message, context ? JSON.stringify(context, null, 2) : '');
  }

  static info(message: string, context?: Record<string, unknown>): void {
    console.info(message, context ? JSON.stringify(context, null, 2) : '');
  }

  static debug(message: string, context?: Record<string, unknown>): void {
    console.debug(message, context ? JSON.stringify(context, null, 2) : '');
  }
}
