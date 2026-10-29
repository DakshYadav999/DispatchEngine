import type {Driver,Order} from "./types.js";
import { distance } from "./geometry.js";

const drivers:Driver[]=[
    {
        id:"Omar Little",
        location:{x:3,y:3},
        status:"idle"
    },
    {
        id:"Bodie Bodus",
        location:{x:7,y:9},
        status:"busy"
    },
    {
        id:"Slim Charles",
        location:{x:4,y:6},
        status:"offline"
    }
]

const order:Order={
    id:"Glock",
    pickup:{x:3,y:4},
    dropoff:{x:5,y:6},
    status:"created",
    createdAt:1
}

for(const driver of drivers){
    const d=distance(driver.location,order.pickup);
    console.log(`${driver.id} and the distance calculated is ${d}`);
}
