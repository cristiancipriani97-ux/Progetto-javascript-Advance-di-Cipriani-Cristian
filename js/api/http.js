import axios from "axios";

/** Crea un client HTTP Axios con baseURL e timeout. È l'unico file che dipende da Axios. */
export function createHttpClient(baseURL, timeout = 10000) {
  return axios.create({ baseURL, timeout });
}
