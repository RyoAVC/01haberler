// Ucretsiz katman gecici olarak 429 (kota) veya 5xx (asiri yuk/servis) donebilir;
// bunlar yeniden denenebilir. 400/401/403/404 gibi kalici hatalarda denenmez.
export function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}
