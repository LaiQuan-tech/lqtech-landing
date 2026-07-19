// 最小 no-op analytics shim。
// lqtech-landing 有自己的 GA（gtag），不移植 來源站的 analytics 實作；
// 這裡只提供被移植過來的 lib / api / 元件所 import 的介面，確保 TypeScript 解析得了。
// 需要真正埋點時，請改用 lqtech 既有的 GA。

/** no-op：接受任意參數、永遠不做事。 */
export function trackEvent(..._args: unknown[]): void {
  /* intentionally empty */
}
