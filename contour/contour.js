import { generatePerlin, gridRes } from "./perlin_gen.js";

// 2025/11/11 - Separated contour.js to make refactoring to include catmull-rom spline easier
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

class PVector {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.level = level;
    }
}


// 1. GENERATE FIELD
// Done with perlin_gen.js

// 2. LEVELS
// INPUT: number of colors wanted, types of colors
// OUTPUT: {levels: number[], colors: string[], step: number }
// ACTION: spaces levels evenly from minVal to maxVal and blends a colour for each
function levelColors(num_color, colorStops = [[0, 0, 0], [255, 255, 255]]) {
    const minVal = 0;
    const maxVal = 255;
    const levelStep = (maxVal - minVal) / num_color;
    const levels = [];
    const colors = [];

    for (let i = 0; i < num_color; i++) {
        levels.push(minVal + i * levelStep);

        // Find which colorStops we are between
        const t = num_color > 1 ? i / (num_color - 1) : 0; // normalized 0..1
        const scaled = t * (colorStops.length - 1);
        const idx = Math.floor(scaled);
        const frac = scaled - idx;

        const c1 = colorStops[idx];
        const c2 = colorStops[Math.min(idx + 1, colorStops.length - 1)];

        const r = Math.round(lerp(c1[0], c2[0], frac));
        const g = Math.round(lerp(c1[1], c2[1], frac));
        const b = Math.round(lerp(c1[2], c2[2], frac));

        colors.push(`rgb(${r},${g},${b})`);
    }

    return { levels, colors, step: levelStep };
}

// helper: linear interpolation
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// 3. SEGMENTS

// INPUT: a,b,c,d (the 4 points aroudn the main point), threshold: number
// OUTPUT: state 0 - 16
function getState(a, b, c, d, threshold) {
    // Find the corresponding level of the max and min
    // Return a 4-bit corner mask
    return ((a >= threshold) << 3 | (b >= threshold) << 2 | (c >= threshold) << 1 | (d >= threshold));
}


// INPUT:  (constant, indexed by state 0–15)
// OUTPUT: list of side pairs per state, e.g. [["a","d"], ["b","c"]]
// ACTION: lookup table of which cell sides each line connects
//         (a = top, b = right, c = bottom, d = left)
const CASES = [];

// INPUT:  side: "a" | "b" | "c" | "d", i, j: cell indices
// OUTPUT: edge ID (string "h:i:j" / "v:i:j", or a number for speed)
// ACTION: names the grid edge a point sits on, so both cells sharing
//         that edge produce the same ID
function edgeId(side, i, j) {}

// INPUT:  field: 2D array, nLevels: number, minVal: number, step: number
// OUTPUT: segsByLevel: array (one per level) of [edgeIdA, edgeIdB] pairs
// ACTION: one pass over all cells; uses the cell's min/max to find only
//         the levels that cross it, then adds that level's segments
function buildAllSegments(field, nLevels, minVal, step) {}


// ===================== 4. STITCH =====================

// INPUT:  segs: array of [edgeIdA, edgeIdB] pairs (one level)
// OUTPUT: chains: array of { ids: edgeId[] (in order), closed: boolean }
// ACTION: builds a neighbour map, walks open lines from their dead ends
//         first, then walks the remaining closed loops
function stitch(segs) {}


// ===================== 5. POINTS =====================

// INPUT:  id: edge ID, field: 2D array, threshold: number, res: number
// OUTPUT: [x, y] in pixels
// ACTION: places the point where the value crosses the threshold along
//         that edge (linear interpolation, not the midpoint)
function edgePoint(id, field, threshold, res) {}


// ===================== 6. CURVES =====================

// INPUT:  p: flat array [x0, y0, x1, y1, ...], closed: boolean
// OUTPUT: { n, x(i), y(i) }
// ACTION: safe neighbour lookup; wraps around for closed shapes,
//         repeats the end point for open ones
function accessor(p, closed) {}

// All curve functions share this shape:
// INPUT:  p: flat point array, closed: boolean, o: settings { tension, ... }, pen
// OUTPUT: none (writes commands to pen)

// ACTION: straight lines between points (jagged look)
CURVES.linear = function (p, closed, o, pen) {};

// ACTION: smooth curve through every point; o.tension 0 = straight, 1 = standard
CURVES.catmullRom = function (p, closed, o, pen) {};

// ACTION: softest curve; cuts inside corners and never overshoots;
//         open lines keep their exact endpoints
CURVES.bspline = function (p, closed, o, pen) {};

// ACTION: smooth curve through every point with continuous curvature;
//         closed shapes are padded with wrapped points and solved as open
CURVES.natural = function (p, closed, o, pen) {};

// INPUT:  v: Float64Array of one coordinate (all x values, or all y values)
// OUTPUT: Float64Array of slopes at each point
// ACTION: solves the natural spline's tridiagonal system (Thomas algorithm)
function solveNatural(v) {}


// ===================== 7. DRAW =====================

// INPUT:  (none)
// OUTPUT: pen with M, L, C, Z methods; toString() returns an SVG "d" string
// ACTION: collects drawing commands as text, with coordinates rounded to 2 decimals
class SvgPen {}

// INPUT:  ctx: CanvasRenderingContext2D
// OUTPUT: pen with M, L, C, Z methods
// ACTION: sends the same commands straight to canvas (moveTo, lineTo, bezierCurveTo, closePath)
function canvasPen(ctx) {}

// INPUT:  segs: one level's segments, th: threshold, field, res,
//         settings: { curve, tension }, pen
// OUTPUT: none (writes to pen)
// ACTION: "segments" mode draws raw segments with no stitching;
//         any other mode stitches, converts to points and calls CURVES[settings.curve]
function drawLevel(segs, th, field, res, settings, pen) {}

// INPUT:  svg: SVG element, pathString: string, color: string
// OUTPUT: none
// ACTION: adds one <path> element (SVG output only)
function drawPath(svg, pathString, color) {}


// ===================== 8. LOOP =====================

// INPUT:  now: timestamp from requestAnimationFrame
// OUTPUT: none
// ACTION: advances t by elapsed time, regenerates the field, clears the
//         canvas, runs steps 3–7 for every level, then requests the next frame
function frame(now) {}





// Drawing
export function draw(field, num_color, colorStops = [[0, 0, 0], [255, 255, 255]]) {
    const svg = document.getElementById("heroMesh");
    let cols = field.length;
    let rows = field[0].length;

    // Contour levels evenly spaced between min and max, each with a colour
    const { levels, colors } = levelColors(num_color, colorStops);
    
    // all svg path elements added here
    const svg_level = {};
    for (let i = 0; i < levels.length; i++) svg_level[i] = "";


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
                    const newPath = addMS(state, i, j, gridRes);
                    svg_level[levels.indexOf(threshold)] += newPath; // add string to svg_level[k]
                    //drawMarchingSquare(svg, state, i, j, res, color); 
                }
            }
        }
    }
    for (let k = 0; k < levels.length; k++) {
        if (svg_level[k] != "")  {
        let shapes = sortSVG(svg_level[k]);

        // shapes -> turn into catmull-rom spline, based 

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
        //console.log("Level:", k, "Shapes:", shapes);
        }
    }
}

// Call cubic bezier function based on time
// p0, p3 end points, p1, p2 are the weights
function cubicBezier(p0, p1, p2, p3, t, pFinal) {
    pFinal = pFinal || {};
    pFinal.x = Math.pow(1 - t, 3) * p0.x +
               Math.pow(1 - t, 2) * 3 *t * p1.x +
               (1 - t) * 3 * t * t * p2.x +
               t * t * t * p3.x;
    pFinal.y = Math.pow(1 - t, 3) * p0.y +
               Math.pow(1 - t, 2) * 3 *t * p1.y +
               (1 - t) * 3 * t * t * p2.y +
               t * t * t * p3.y;
    return pFinal;
}

// addMS M and L -> go through until go till endf
// ordered list of points
function clean_shape(svg) {
    // go through each 
}

function catmull_rom_spline(svg, pathString, color = "black") {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
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

