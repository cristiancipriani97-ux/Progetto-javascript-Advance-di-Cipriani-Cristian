/** True se l'errore deriva da una richiesta annullata volontariamente (fetch o Axios). */
export function isAbortError(err) {
  return err?.name === "AbortError" || err?.name === "CanceledError" || err?.code === "ERR_CANCELED";
}
