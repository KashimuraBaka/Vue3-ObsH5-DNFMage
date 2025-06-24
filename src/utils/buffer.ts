import axios from "axios";

export const GetAseetsBytes = async (url: string) => {
  return await axios.get<ArrayBuffer>(
    url, { responseType: "arraybuffer" }
  ).then(res => res.data
  ).catch(() => new ArrayBuffer(0));
}

/** 整数转十六进制 */
export const toHex = (value: number) => {
  return value.toString(16).toUpperCase();
}
