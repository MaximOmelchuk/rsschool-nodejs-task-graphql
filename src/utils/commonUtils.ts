export const str = (str: string) => JSON.stringify(str);
export const addIfNotInclude = (arr: string[], value: string) => {
  if (!arr.includes(value)) {
    arr.push(value);
  }
};
export const removeIfInclude = (arr: string[], value: string) => {
  if (arr.includes(value)) {
    const index = arr.indexOf(value);
    arr.splice(index, 1);
  }
};
