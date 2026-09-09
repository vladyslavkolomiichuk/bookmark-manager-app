export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  readonly details: Array<{
    path: string;
    message: string;
  }>;

  protected constructor(
    message: string,
    details: Array<{
      path: string;
      message: string;
    }> = []
  ) {
    super(message);

    this.name = new.target.name;
    this.details = details;

    Error.captureStackTrace?.(this, new.target);
  }
}
