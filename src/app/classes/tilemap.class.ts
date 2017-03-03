export class Tilemap {
    private map;
    private parsedMap;

    constructor(map) {
        this.map = map;
    }

    parseMapObject(obj) {
        let parsedMap = {
            'tileSets': [],

            'numXtiles': obj.width,
            'numYtiles': obj.height,

            'tileSize': {
                'x': obj.tilewidth,
                'y': obj.tileheight
            },

            'totalSize': {
                'x': obj.tilewidth * obj.width,
                'y': obj.tileheight *  obj.height
            },
            'loadCounter': 0,
            'fullyLoaded': false
        }

        for (let i = 0; i < this.map.tilesets.length; i++) {
            let tileSet = {
                    "firstgid": this.map.tilesets[i].firstgid,
                    "imageheight": this.map.tilesets[i].imageheight,
                    "imagewidth": this.map.tilesets[i].imagewidth,
                    "name": this.map.tilesets[i].name,
                    "numXTiles": Math.floor(this.map.tilesets[i].imagewidth / parsedMap.tileSize.x),
                    "numYTiles": Math.floor(this.map.tilesets[i].imageheight / parsedMap.tileSize.y)
                };


            parsedMap.tileSets.push(tileSet);

        }
        return parsedMap;
    }
    saveMap() {
        this.parsedMap = this.parseMapObject(this.map);
    }

    getTilePacket(tileIndex) {

            let pkt = {
                "px": 0,
                "py": 0
            };

            let tile = 0;
            for(tile = this.parsedMap.tileSets.length - 1; tile >= 0; tile--) {
                if(this.parsedMap.tileSets[tile].firstgid <= tileIndex) break;
            }

            let localIdx = tileIndex - this.parsedMap.tileSets[tile].firstgid;

            let lTileX = Math.floor(localIdx % this.parsedMap.tileSets[tile].numXTiles);
            let lTileY = Math.floor(localIdx / this.parsedMap.tileSets[tile].numXTiles);

            pkt.px = (lTileX * this.parsedMap.tileSize.x);
            pkt.py = (lTileY * this.parsedMap.tileSize.y);


            return pkt;
        }

    getMapData() {
        let result = [];

        this.saveMap();

        for(let i = 0; i < this.map.layers.length; i++) {
            let layer = [];
            if(this.map.layers[i].type!=='tilelayer') {
                continue;
            }
            let data = this.map.layers[i].data;

            for(let n = 0; n < data.length; n++) {
                if(data[n] > 0) {
                    let packetData = this.getTilePacket(data[n]);
                    packetData['worldX'] = Math.floor(n % this.parsedMap.numXtiles) * this.parsedMap.tileSize.x;
                    packetData['worldY'] = Math.floor(n / this.parsedMap.numXtiles) * this.parsedMap.tileSize.y;
                    packetData['width'] = this.parsedMap.tileSize.x;
                    packetData['height'] = this.parsedMap.tileSize.y;
                    layer.push(packetData);
                }
            }
            result.push(layer)
        }
    return result;
    }
}
