export type Point={
    x:number;
    y:number;
}

export function distance(a:Point,b:Point):number{
    return Math.sqrt((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y));
}

export function moveToward(from:Point,to:Point,maxStep:number):Point{
    const d=distance(from,to);
    if (d <= maxStep) {
        return { x: to.x, y: to.y };
    }
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const directionX=dx/d;
    const directionY=dy/d;

    const movementX=directionX*maxStep;
    const movementY=directionY*maxStep;

    const newX=from.x+movementX;
    const newY=from.y+movementY;

    return {x:newX,y:newY};
    //or just i could have wrote
    // return {
    //     x: from.x + ((to.x - from.x) / d) * maxStep,
    //     y: from.y + ((to.y - from.y) / d) * maxStep
    // };
}