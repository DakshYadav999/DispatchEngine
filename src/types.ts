import type { Point } from "./geometry.js";

export type DriverStatus="idle" | "busy" | "offline" ;

export type Driver={
    id:string;
    location:Point;
    status:DriverStatus;
}

export type OrderStatus="created" | "assigned" | "picked_up" | "delivered" | "cancelled";

export type Order={
    id:string;
    pickup:Point;
    dropoff:Point;
    status:OrderStatus;
    createdAt:number;
}