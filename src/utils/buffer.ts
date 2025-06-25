import axios from "axios";

export const GetAseetsBytes = async (url: string) => {
  return await axios.get<ArrayBuffer>(
    url, { responseType: "arraybuffer" }
  ).then(res => res.data
  ).catch(() => new ArrayBuffer(0));
}
