export class Grid
{
    private _keyMap:any;
    private _map:any;
    private _gridDict:any;
    public square:number;

    constructor(square:number) {
        this._keyMap = new WeakMap
        this._map = new WeakMap
        this._gridDict = new Map
        this.square = square
    }

    //basic methods

    set(key, value)
    {
        this._keyMap.set(value, key)
        this._gridDict.set(`${value.column}${value.row}`, value)
        return this._map.set(key, value)
    }

    get(key)
    {
        return this._map.get(key)
    }

    getKey(value)
    {
        return this._keyMap.get(value)
    }

    getByString(column, row) {
        return this.getKey(this._gridDict.get(`${column}${row}`))
    }

    //navigation methods

    getSiblingsRight(key, howMany:number, getAsGraphic?:boolean)
    {
        ++howMany;
        let cell = this.get(key)
        let overLap = this.square - ((cell.column.charCodeAt(0) - 65) % this.square)
        let sum = overLap > howMany ? howMany : overLap
        let i;
        let result = [];
        for (i = 1; i < sum; i++)
        {
            if (getAsGraphic) {
                result.push(this.getKey(this._gridDict.get(`${String.fromCharCode(cell.column.charCodeAt(0) + i)}${cell.row}`)))
            } else {
                result.push(this._gridDict.get(`${String.fromCharCode(cell.column.charCodeAt(0) + i)}${cell.row}`))
            }
        }
        return result;
    }

    getSiblingsLeft(key, howMany:number, getAsGraphic?:boolean)
    {
        ++howMany;
        let cell = this.get(key)
        let overLap = (this.square + 1) - (this.square - ((cell.column.charCodeAt(0) - 65) % this.square))
        let sum = overLap > howMany ? howMany : overLap
        let result = [];
        let i;
        for (i = --sum; i > 0; i--)
        {
            if (getAsGraphic) {
                result.push(this.getKey(this._gridDict.get(`${String.fromCharCode(cell.column.charCodeAt(0) - i)}${cell.row}`)))
            } else {
                result.push(this._gridDict.get(`${String.fromCharCode(cell.column.charCodeAt(0) - i)}${cell.row}`))
            }
        }
        return result;
    }

    getSiblingsBottom(key, howMany:number, getAsGraphic?:boolean)
    {
        ++howMany;
        let cell = this.get(key)
        let overLap = this.square - ((cell.row - 1) % this.square)
        let sum = overLap > howMany ? howMany : overLap
        let i;
        let result = [];
        for (i = 1; i < sum; i++)
        {
            if (getAsGraphic) {
                result.push(this.getKey(this._gridDict.get(`${cell.column}${cell.row + i}`)))
            } else {
                result.push(this._gridDict.get(`${cell.column}${cell.row + i}`))
            }
        }
        return result;
    }

    getSiblingsTop(key, howMany:number, getAsGraphic?:boolean)
    {
        ++howMany;
        let cell = this.get(key)
        let overLap = (this.square + 1) - (this.square - ((cell.row - 1) % this.square))
        let sum = overLap > howMany ? howMany : overLap
        let result = [];
        let i;
        for (i = --sum; i > 0; i--)
        {
            if (getAsGraphic) {
                result.push(this.getKey(this._gridDict.get(`${cell.column}${cell.row - i}`)))
            } else {
                result.push(this._gridDict.get(`${cell.column}${cell.row - i}`))
            }
        }
        return result;
    }

    getCentredVerticSlice(centerKey, length:number, getAsGraphic?:boolean) {
        let center = this.get(centerKey)
        --length;

        let bottomPartLength = length % 2 ? Math.ceil(length / 2) : length / 2;
        let topPartLength = length % 2 ? Math.floor(length / 2) : length / 2;

        let bottomOverLap = (this.square - ((center.row - 1) % this.square)) - (length == 1 ? length + 1 : length)
        let topOverLap = (this.square + 1) - (this.square - ((center.row - 1) % this.square)) -
            (length % 2 ? length - 1 : length);


        let bottomPart = this.getSiblingsBottom(centerKey, bottomPartLength - (topOverLap < 0 ? topOverLap : 0), getAsGraphic)

        let topPart = this.getSiblingsTop(centerKey, topPartLength - (bottomOverLap < 0 ? bottomOverLap : 0), getAsGraphic);

        return topPart.concat((getAsGraphic ? this.getKey(center) : center), bottomPart)
    }


    getCentredHorizontalSlice(centerKey, length:number, getAsGraphic?:boolean) {
        let center = this.get(centerKey)
        --length;

        let rightPartLength = length % 2 ? Math.ceil(length / 2) : length / 2;
        let leftPartLength = length % 2 ? Math.floor(length / 2) : length / 2;

        let rightOverLap = (this.square - ((center.column.charCodeAt(0) - 65) % this.square)) - (length == 1 ? length + 1 : length)
        let leftOverLap = (this.square + 1) - (this.square - ((center.column.charCodeAt(0) - 65) % this.square)) -
            (length % 2 ? length - 1 : length);

        let rightPart = this.getSiblingsRight(centerKey, rightPartLength - (leftOverLap < 0 ? leftOverLap : 0), getAsGraphic)
        let leftPart = this.getSiblingsLeft(centerKey, leftPartLength - (rightOverLap < 0 ? rightOverLap : 0), getAsGraphic);

        return leftPart.concat((getAsGraphic ? this.getKey(center) : center), rightPart)
    }

    getTouchedCells(arrOfCells, orientation:string, getAsGraphic?:boolean, convertToGraphic?:boolean) {
        if (convertToGraphic) {
            arrOfCells = arrOfCells.map(cell => this.getKey(cell));
        }
        let first = this.get(arrOfCells[0]);
        let last = this.get(arrOfCells[arrOfCells.length - 1]);

        if (orientation === 'horizontal') {

            let numberCode = first.row

            let firstSibling = this._gridDict.get(`${String.fromCharCode(first.column.charCodeAt(0) - 1)}${numberCode}`);
            firstSibling = firstSibling ? (getAsGraphic ? this.getKey(firstSibling) : firstSibling) : [];

            let lastSibling = this._gridDict.get(`${String.fromCharCode(last.column.charCodeAt(0) + 1)}${numberCode}`);
            lastSibling = lastSibling ? (getAsGraphic ? this.getKey(lastSibling) : lastSibling) : [];

            let top = [];
            let bottom = [];
            let i;

            for (i = 0; i < arrOfCells.length; i++)
            {
                let cell = this.get(arrOfCells[i])
                let nextLetter = String.fromCharCode(cell.column.charCodeAt(0));
                let siblingSell = this._gridDict.get(`${nextLetter}${numberCode - 1}`)

                if (!siblingSell) continue;
                if (getAsGraphic) {
                    top.push(this.getKey(siblingSell))
                } else {
                    top.push(siblingSell)
                }
            }

            for (i = 0; i < arrOfCells.length; i++)
            {
                let cell = this.get(arrOfCells[arrOfCells.length - 1 - i])
                let prevLetter = String.fromCharCode(cell.column.charCodeAt(0));
                let siblingSell = this._gridDict.get(`${prevLetter}${numberCode + 1}`)
                if (!siblingSell) continue;
                if (getAsGraphic) {
                    bottom.push(this.getKey(siblingSell))
                } else {
                    bottom.push(siblingSell)
                }
            }

            return top.concat(lastSibling, bottom, firstSibling) //clockwise order

        } else {
            let letterCode = String.fromCharCode(first.column.charCodeAt(0))

            let topSibling = this._gridDict.get(`${letterCode}${first.row - 1}`);
            topSibling = topSibling ? (getAsGraphic ? this.getKey(topSibling) : topSibling) : [];

            let botSibling = this._gridDict.get(`${letterCode}${last.row + 1}`);
            botSibling = botSibling ? (getAsGraphic ? this.getKey(botSibling) : botSibling) : [];

            let right = [];
            let left = [];
            let i;

            for (i = 0; i < arrOfCells.length; i++)
            {
                let cell = this.get(arrOfCells[i])
                let nextLetter = String.fromCharCode(cell.column.charCodeAt(0) + 1);
                let siblingSell = this._gridDict.get(`${nextLetter}${cell.row}`)

                if (!siblingSell) continue;
                if (getAsGraphic) {
                    right.push(this.getKey(siblingSell))
                } else {
                    right.push(siblingSell)
                }
            }

            for (i = 0; i < arrOfCells.length; i++)
            {
                let cell = this.get(arrOfCells[arrOfCells.length - 1 - i])
                let prevLetter = String.fromCharCode(cell.column.charCodeAt(0) - 1);
                let siblingSell = this._gridDict.get(`${prevLetter}${cell.row}`)
                if (!siblingSell) continue;
                if (getAsGraphic) {
                    left.push(this.getKey(siblingSell))
                } else {
                    left.push(siblingSell)
                }
            }

            return [].concat(topSibling, right, botSibling, left) //clockwise order

        }
    }

    checkTouchedCells(arrOfCells, orientation) {
       return arrOfCells.every(cell => {
            let item = this.get(cell);
           return !item.occupied && !item.touched
        });
    }
}
