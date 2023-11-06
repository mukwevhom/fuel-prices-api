const createInsertValues = (values: any[]) => {
    return values.map((v) => `(${v.map((e:string, j: number) => j==0 ? `'${e}'`: e).join()})`).join()
}

export { createInsertValues }
