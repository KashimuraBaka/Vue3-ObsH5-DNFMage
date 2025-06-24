/**
 * 获取随机数值
 * @param min 最小值
 * @param max 最大值
 * @returns 返回随机数
 */
export const GetRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * 控制台输出
 */
export const log = {
  error(...args: any[]) {
    console.log(
      `%c Error `,
      "background: #ad4569; padding: 2px; border-radius: 5px",
      ...args
    );
  },
  info(...args: any[]): void {
    console.log(
      `%c Info `,
      "background: #409cff; padding: 2px; border-radius: 5px",
      ...args
    );
  },
}
