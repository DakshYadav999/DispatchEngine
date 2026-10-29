import { distance } from "./geometry.js";
import type { Driver, Order } from "./types.js";

export function findNearestDriver(drivers:Driver[],order:Order):Driver | undefined{
    let best:Driver | undefined=undefined;
    let bestDistance=Infinity;

   for (const driver of drivers) {
        if(driver.status!=="idle"){
            continue;
        }
        const currentDistance=distance(driver.location,order.pickup);

        if(currentDistance<bestDistance){
            best=driver;
            bestDistance=currentDistance;
        }
    }
    return best;
}