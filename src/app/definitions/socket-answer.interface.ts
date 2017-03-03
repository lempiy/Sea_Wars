interface Data {
    timestap: number,
    author: string,
    text: string,
    value?: any
}

export interface SocketAnswer {
    data?: Data;
    type:string;
}
