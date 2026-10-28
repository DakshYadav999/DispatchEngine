export type Point={
    x:number;
    y:number;
}

export function distance(a:Point,b:Point):number{
    return Math.sqrt((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y));
}