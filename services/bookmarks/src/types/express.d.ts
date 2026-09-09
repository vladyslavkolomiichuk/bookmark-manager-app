declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
      };
      requestId?: string;
      validated?: {
        params: unknown;
        query: unknown;
        body: unknown;
      };
      // log: Logger;
    }
  }
}

export {};
