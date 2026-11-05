/** Thrown by service boundaries whose backend contract has not been provided yet. */
export class NotConfiguredError extends Error {
  constructor(feature: string) {
    super(`${feature} is not connected to the backend yet.`);
    this.name = 'NotConfiguredError';
  }
}
