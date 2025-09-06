// 2025/09/01 - Each level of the Marching Square algorithm is now added by string
// Marching Square Algorithm from The Coding Train

let animationID;
let isAnimating = false;
let stopped = false;
let lastUpdate = 0;
const targetFPS = 5; // ~50ms per frame
const interval = 1000 / targetFPS;
let t = 0; // tracks calculation
let curtime = new Date();
let pasttime = new Date();

// Animation tracker
let currentField = null;
let num_colors = null;
let colorlist = null;
let incrementFactor = null;
let dampeningFactor = null;
let scaleFactor = null;

class PVector {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.level = level;
    }
}
// Ken Perlin noise implementation
class Perlin {
    constructor() {
        this.permutation = [];
        for (let i = 0; i < 256; i++) this.permutation[i] = i;
        // Shuffle
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }
        this.permutation = this.permutation.concat(this.permutation);
    }

    fade(t) { 
        return t * t * t * (t * (t * 6 - 15) + 10); 
    }

    lerp(t, a, b) { 
        return a + t * (b - a); 
    }

    grad(hash, x, y, z) {
        const h = hash & 15;   // take the last 4 bits of hash
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }

    noise(x, y, z = 0) {
        // Find unit cube containing point
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        // Relative coords in cube
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        const zf = z - Math.floor(z);

        // Fade curves
        const u = this.fade(xf);
        const v = this.fade(yf);
        const w = this.fade(zf);

        // Hash coordinates of cube corners
        const p = this.permutation;
        const A  = p[X] + Y;
        const AA = p[A] + Z;
        const AB = p[A + 1] + Z;
        const B  = p[X + 1] + Y;
        const BA = p[B] + Z;
        const BB = p[B + 1] + Z;

        // Add blended results from all 8 cube corners
        const val = this.lerp(w, 
            this.lerp(v, 
                this.lerp(u, this.grad(p[AA], xf, yf, zf),
                             this.grad(p[BA], xf - 1, yf, zf)),
                this.lerp(u, this.grad(p[AB], xf, yf - 1, zf),
                             this.grad(p[BB], xf - 1, yf - 1, zf))
            ),
            this.lerp(v,
                this.lerp(u, this.grad(p[AA + 1], xf, yf, zf - 1),
                             this.grad(p[BA + 1], xf - 1, yf, zf - 1)),
                this.lerp(u, this.grad(p[AB + 1], xf, yf - 1, zf - 1),
                             this.grad(p[BB + 1], xf - 1, yf - 1, zf - 1))
            )
        );

        return (val + 1) / 2; // normalize to [0, 1]
    }
}

function generatePerlin(field, scale, dfactor, t) {
    for (let i = 0; i < field.length; i++) {
        for (let j = 0; j < field[i].length; j++) {
            let x = i * scale;
            let y = j * scale;
            let dampening = dfactor;
            let value = perlin.noise(x * dampening ,y * dampening,t);
            field[i][j] = 255 * value;
        }
    }
    console.log("t = ", t);
    console.log(field);
    return field;
}

function setup(res, containerID) {
    // Get the SVG element and setup
    const mesh = document.getElementById(containerID);
    let width = mesh.clientWidth;
    let height = mesh.clientHeight;
    // cols and rows to the nearest multiple of 2

    let cols = Math.floor(width / res);
    let rows = Math.floor(height / res);
    // multiple of two to make sure the marching square algorithm works
    if (width % 2 !== 0) {
        cols = Math.floor(width / res) + 1;
    }
    if (height % 2 !== 0) {
        rows = Math.floor(height / res) + 1;
    }
    let field = [];

    // circle parameters
    let z = 0;
    let r = 200;
    let cx = width / 2;
    let cy = height / 2;

    for (let i = 0; i < cols; i++) {
        field[i] = [];
        for (let j = 0; j < rows; j++) {
            field[i][j] = 0;
            // let x = i * res;
            // let y = j * res;

            // //let inCirc = (((x - cx) ** 2 + (y - cy) ** 2 + (z ** 2)) < (r ** 2)) ? true : false;
            // let distance = (x - cx) ** 2 + (y - cy) ** 2 + (z ** 2);
            // let inCirc = distance < (r ** 2) ? true : false;

            // // assign color instead of just 1/0
            // if (inCirc == true) {
            //     // further away from the source, more white it is, closer to the center more black.
            //     //distance - r = 0 => 0, distance = 0 -> 255 (need to normalize)
            //     let value = 255 - ((r ** 2) - distance) / (r ** 2) * 255;
            //     field[i][j] = value;
            // } else {
            //     field[i][j] =  82;
            // // }
        }
    }
    return field;
}


const perlin = new Perlin();


// Drawing
function draw(field, num_color, colorStops = [[0, 0, 0], [255, 255, 255]]) {
    const svg = document.getElementById("heroMesh");
    let cols = field.length;
    let rows = field[0].length;

    // Define contour levels evenly spaced between min and max
    const minVal = 0;
    const maxVal = 255;
    const levelStep = (maxVal - minVal) / num_color;
    const levels = [];
    const colors = [];
    const svg_level = {}; // all svg path elements added here

    // helper: linear interpolation
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    for (let i = 0; i < num_color; i++) {
        const level = minVal + i * levelStep;
        levels.push(level);

        // Find which colorStops we are between
        const t = i / (num_color - 1); // normalized 0..1
        const scaled = t * (colorStops.length - 1);
        const idx = Math.floor(scaled);
        const frac = scaled - idx;

        const c1 = colorStops[idx];
        const c2 = colorStops[Math.min(idx + 1, colorStops.length - 1)];

        const r = Math.round(lerp(c1[0], c2[0], frac));
        const g = Math.round(lerp(c1[1], c2[1], frac));
        const b = Math.round(lerp(c1[2], c2[2], frac));

        colors.push(`rgb(${r},${g},${b})`);
        svg_level[i] = "";
    }


    // Add each point to its respective pathString

    for (let i = 0; i < cols - 1; i++) {
        for (let j = 0; j < rows - 1; j++) {
            // Values of the square corners
            let v0 = field[i][j];
            let v1 = field[i + 1][j];
            let v2 = field[i + 1][j + 1];
            let v3 = field[i][j + 1];

            // Find min and max
            const minValCell = Math.min(v0,v1,v2,v3);
            const maxValCell = Math.max(v0,v1,v2,v3);

            // Find levels that intersect this cell
            const levelsBtw = levels.filter(l => l > minValCell && l <= maxValCell);
            if (levelsBtw.length == 0) {
                continue; // no levels intersect this cell and can skip
            }

            for (let k = 0; k < levelsBtw.length; k++) {
                const threshold = levelsBtw[k];
                
                const color = colors[levels.indexOf(threshold)];
                const state = getState(v0, v1, v2, v3, threshold);
                if(state !== 0 && state !== 15) {
                    const newPath = addMS(state, i, j, res);
                    svg_level[levels.indexOf(threshold)] += newPath; // add string to svg_level[k]
                    //drawMarchingSquare(svg, state, i, j, res, color); 
                }
            }
        }
    }
    for (let k = 0; k < levels.length; k++) {
        if (svg_level[k] != "")  {
        let shapes = sortSVG(svg_level[k]);
        for (let s = 0; s < shapes.length; s++) {
            let shape = "M" + shapes[s].points.map(p => p).join(" L");
            if (shapes[s].type == "closed") {
                shape += " Z";
                drawPath(svg, shape, colors[k]);
            } else {
                // open is problem
                drawPath(svg, shape, colors[k]);
            }
        }
        console.log("Level:", k, "Shapes:", shapes);
        }
    }
}

function drawPath(svg, pathString, color = "black") {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathString);
    path.setAttribute("stroke", color);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-width", 1);
    svg.appendChild(path);
}
function addMS(state, i, j, res) { // returns the corresponding string to marching square algorithm
    let x = i * res;
    let y = j * res;
    let a = new PVector(x + res * 0.5, y);
    let b = new PVector(x + res, y + res * 0.5);
    let c = new PVector(x + res * 0.5, y + res);
    let d = new PVector(x, y + res * 0.5);

    switch (state) {
        case 1:
            return `M${c.x},${c.y} L${d.x},${d.y} `;
        case 2:
            return `M${b.x},${b.y} L${c.x},${c.y} `;
        case 3:
            return `M${b.x},${b.y} L${d.x},${d.y} `;
        case 4:
            return `M${a.x},${a.y} L${b.x},${b.y} `;
        case 5:
            return `M${a.x},${a.y} L${d.x},${d.y} M${b.x},${b.y} L${c.x},${c.y} `;
        case 6:
            return `M${a.x},${a.y} L${c.x},${c.y} `;
        case 7:
            return `M${a.x},${a.y} L${d.x},${d.y} `;
        case 8:
            return `M${a.x},${a.y} L${d.x},${d.y} `;
        case 9:
            return `M${a.x},${a.y} L${c.x},${c.y} `;
        case 10:
            return `M${a.x},${a.y} L${b.x},${b.y} M${c.x},${c.y} L${d.x},${d.y} `;
        case 11:
            return `M${a.x},${a.y} L${b.x},${b.y} `;
        case 12:
            return `M${b.x},${b.y} L${d.x},${d.y} `;
        case 13:
            return `M${b.x},${b.y} L${c.x},${c.y} `;
        case 14:
            return `M${c.x},${c.y} L${d.x},${d.y} `;
    }
}

function getState(a, b, c, d, threshold) {
    // Find the corresponding level of the max and min
    a = a >= threshold ? 1 : 0;
    b = b >= threshold ? 1 : 0;
    c = c >= threshold ? 1 : 0;
    d = d >= threshold ? 1 : 0;
    return a * 8 + b * 4 + c * 2 + d * 1;
}

// sort an unsorted string of svg lines into shapes
function sortSVG(svgString) {
    if (!svgString) return [];

    // Step 1: Parse string into edge pairs
    const path = svgString.replace(/[ML]/g, "").trim().split(/\s+/);
    const newpath = [];
    for (let i = 0; i < path.length; i += 2) {
        if (path[i + 1]) {
            newpath.push([path[i], path[i + 1]]);
        }
    }

    // Step 2: Build adjacency map
    const adjacency = {};
    const edges = new Set(); // mark edges as "unused"
    for (let [a, b] of newpath) {
        if (!adjacency[a]) adjacency[a] = [];
        if (!adjacency[b]) adjacency[b] = [];
        adjacency[a].push(b);
        adjacency[b].push(a);
        edges.add(a + "-" + b);
        edges.add(b + "-" + a); // undirected
    }

    // Step 3: Traverse shapes
    const visitedEdges = new Set();
    const shapes = [];

    function traverse(start) {
        const shape = [start];
        let current = start;

        while (true) {
            let next = adjacency[current]?.find(
                (n) => !visitedEdges.has(current + "-" + n)
            );
            if (!next) break; // dead end → open path

            // mark edge as visited
            visitedEdges.add(current + "-" + next);
            visitedEdges.add(next + "-" + current);



            if (next === start) {
                // closed loop, stop and keep the start repeated
                return { type: "closed", points: shape };
            }
            shape.push(next);
            current = next;
        }

        // open path → don't connect back to start
        return { type: "open", points: shape };
    }

    // Step 4: Walk through all nodes
    for (let [a, b] of newpath) {
        if (!visitedEdges.has(a + "-" + b)) {
            shapes.push(traverse(a));
        }
    }
    return shapes;
}

function swap(arr, i, j) {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}

// Animation
function animateLoop(timestamp, field, num_color, colorlist, increment, dampening, scale) {
    if (!isAnimating) {
        stopAnimation();
        return;
    }
    if (!lastUpdate) lastUpdate = timestamp;
    const elapsed = timestamp - lastUpdate;

    if (elapsed >= interval) {
        lastUpdate = timestamp - (elapsed % interval); // reset for next frame
        animate(field, num_color, colorlist, increment, dampening, scale);
    }

    animationID = requestAnimationFrame((ts) => {
        animateLoop(ts, field, num_color, colorlist, increment, dampening, scale);
    });
}

function animate(field, num_color, colorlist, increment, dampening, scale) {
    if (t == 0) {
        num_colors = num_color;
        colorlist = colorlist;
        currentField = field;
        incrementFactor = increment;
        dampeningFactor = dampening;
        scaleFactor = scale;
        console.log("Initialized animation parameters");
        console.log(typeof(scaleFactor), scaleFactor);
        console.log(typeof(dampeningFactor), dampeningFactor);
        console.log(typeof(incrementFactor), incrementFactor);
    }
    const svg = document.getElementById("heroMesh");
    const paths = svg.querySelectorAll('path');
    paths.forEach(p => p.remove());


    // All changes to the initial base is applied here
    let modulatedField =  generatePerlin(field, scale, dampening, t);
    // Redraw marching squares with updated values
    draw(modulatedField, num_color, colorlist);
    // Increment time
    t  += increment;
    t = Math.round(t * 10) /10;

    // Loop
}

function startAnimation(field, colors, colorlist, increment, dampening, scale) {
    console.log("increment: ", increment);
    if (!isAnimating) {
        isAnimating = true;
        lastUpdate = 0;

        animationID = requestAnimationFrame((timestamp) => {
            animateLoop(timestamp, field, colors, colorlist, increment, dampening, scale);
        });
    }
    
}
function stopAnimation() {
    isAnimating = false;
    if (animationID) {
        cancelAnimationFrame(animationID);
        //animationID = null;
    }
    console.log("animation stopped");
}
function resumeAnimation() {
    if (!isAnimating && field && field.length > 0) {
        isAnimating = true;
        lastUpdate = 0;
        animationID = requestAnimationFrame((ts) => {
            animateLoop(ts, currentField, num_colors, colorlist, incrementFactor, dampeningFactor, scaleFactor);
        });
        stopped = false;
        console.log("Animation resumed");
        
    } else if (isAnimating) {
        console.log("Animation is already running");
    } else {
        console.log("No animation to resume - initialize field first");
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // Page is not visible → stop animation
        stopAnimation();
        console.log("Animation paused (page hidden)");
    } else if (stopped == false){
        // Page is visible → resume animation
        resumeAnimation();
        console.log("Animation resumed (page visible)");
    }
    // if button pressed and viewer look away -> stop animation
    // if button not pressed and viewer looks away -> resume animation
});