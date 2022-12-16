const createInsertValues = (values: Array<any>) => {
    return values.map((v) => `(${v.map((e:any, j: number) => j==0 ? `'${e}'`: e).join()})`).join()
}

export { createInsertValues }