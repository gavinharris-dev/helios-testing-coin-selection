export class CoinSelectionError extends Error {
  private code: number;

  constructor(error: CoinSelectionErrorType) {
    super(error.message);
    this.code = error.code;
  }
}

type CoinSelectionErrorType = {
  message: string;
  code: number;
};
