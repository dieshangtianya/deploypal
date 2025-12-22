interface CleanupHandler {
  (): Promise<void> | void;
}

export default class TerminationMgr {
  private static handlers: CleanupHandler[] = [];

  static async cleanup(): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await Promise.resolve(handler());
      } catch (error) {
        console.error('clean up error:', error);
      }
    }
  }

  static registerCleanupHandler(handler: CleanupHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) this.handlers.splice(index, 1);
    };
  }

  static setup(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        await this.cleanup();
        process.exit(0);
      });
    });

    process.on('uncaughtException', async () => {
      await this.cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', async () => {
      await this.cleanup();
      process.exit(1);
    });

    process.stdin.resume();
  }
}
