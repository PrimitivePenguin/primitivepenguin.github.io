let animationID = null;
let isAnimating = false;
let currentSvg = null;
let currentPoints = [];
let scale = 20;
let gravityEnabled = true; // Gravity toggle
let gravityStrength = 0.2; 
let maxGravityDistance = 100; // Max distance for gravity effects
let repulsionDistance = 5; // Distance at which repulsion starts
let repulsionStrength = 0; // Strength of repulsion force
let maxVelocity = 3; // Maximum velocity before damping kicks in
let dampingFactor = 1; // How much to reduce velocity when over max (0-1)

class Point {
  constructor(x, y, r, vx, vy, id, mass = 1) {
    this.x = x;
    this.y = y;
    this.r = r; // gravity is proportionate to radius
    this.gravity = r;
    this.mass = mass || r;
    this.vx = vx;
    this.vy = vy;
    this.id = id;
    // Force of gravity
    this.gravityX = 0;
    this.gravityY = 0;
  }
  resetGravity() {
    this.gravityX = 0;
    this.gravityY = 0;
  }
  addGravity(forceX, forceY) {
    if (gravityEnabled) {
      this.gravityX += forceX;
      this.gravityY += forceY;
    }
  }
  // Update position and bounce off walls
  update(width, height) {
    if (gravityEnabled) {
      this.vx += this.gravityX;
      this.vy += this.gravityY;
    }
    
    // Apply velocity damping if over max velocity
    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > maxVelocity) {
      // Calculate how much over the limit we are (1.0 = at limit, 2.0 = double the limit, etc.)
      const speedRatio = currentSpeed / maxVelocity;
      
      // Progressive damping - more damping as speed increases further past limit
      const dampingAmount = Math.pow(dampingFactor, speedRatio - 1);
      
      this.vx *= dampingAmount;
      this.vy *= dampingAmount;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off walls
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;

    // Keep within bounds
    this.x = Math.max(0, Math.min(this.x, width));
    this.y = Math.max(0, Math.min(this.y, height));
  }
}

class Edge {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}
class Triangle {
  constructor(p1, p2, p3) {
    this.points = [p1, p2, p3];
  }
}

// Hash map for edge location
function proximityHash(points) {
    const proximity = new Map();
    for (let i = 0; i < points.length; i++) {
        for (let j = i +1; j < points.length; j++) {
            const p1 = points[i];
            const p2 = points[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const r1 = p1.r * scale;
            const r2 = p2.r * scale;

            let state = null; // state determines both the line, and if gravity affects each other

            if (distance <= r1 && distance <= r2) { // inside both
                state = "0"; // inside both 
            } else if (distance < r1 && distance > r2) {
                state = "1"; // inside 1
            } else if (distance > r1 && distance < r2) {
                state = "2"; // inside 2
            } else {
                state = "-1"; // outside
            }

            const key = `${p1.id},${p2.id}`;
            proximity.set(key, {
              state: state,
              distance: distance,
              p1: p1,
              p2: p2
            });
        }
    }
    return proximity;
}

// Calculate force magnitude based on distance (attraction/repulsion)
function calculateForce(distance, mass1, mass2) {
  if (distance <= 0) return 0;
  
  if (distance < repulsionDistance) {
    // Repulsion force - stronger as objects get closer
    const repulsionFactor = Math.min((repulsionDistance - distance) / 2* repulsionDistance, 1);
    return -repulsionStrength * repulsionFactor * repulsionFactor * mass1 * mass2;
  } else {
    // Attraction force - inverse square law with distance scaling
    const minDistance = Math.max(distance, 10); // Prevent division by very small numbers
    const attractionFactor = distance / maxGravityDistance; // Scale with distance
    return gravityStrength * attractionFactor * (mass1 * mass2) / (minDistance * minDistance) * 1000;
  }
}

// Calculate and apply gravity forces
function applyGravity(points) {
  if (!gravityEnabled) return;

  // Reset all gravity forces
  points.forEach(p => p.resetGravity());

  const proximity = proximityHash(points);

  for (let [key, data] of proximity.entries()) {
    const { state, distance, p1, p2 } = data;

    if (gravityEnabled === false || distance === 0) continue;

    // Calculate unit direction vector
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const unitX = dx / distance;
    const unitY = dy / distance;

    switch (state) {
      case "0":
        // Both points affect each other
        const force1to2 = calculateForce(distance, p1.mass, p2.mass);
        const force2to1 = calculateForce(distance, p2.mass, p1.mass);
        
        p2.addGravity(unitX * force1to2, unitY * force1to2);
        p1.addGravity(-unitX * force2to1, -unitY * force2to1);
        break;

      case "1":
        // Only p1 affects p2 (p2 is in p1's range)
        const force1 = calculateForce(distance, p1.mass, p2.mass);
        p2.addGravity(unitX * force1, unitY * force1);
        break;

      case "2":
        // Only p2 affects p1 (p1 is in p2's range)
        const force2 = calculateForce(distance, p2.mass, p1.mass);
        p1.addGravity(-unitX * force2, -unitY * force2);
        break;
    }
  }
}

// Draw points as circles
function drawPoints(svg, points) {
  // Remove old points
  svg.querySelectorAll("circle").forEach(c => c.remove());
  // Remove only non-velocity lines
  svg.querySelectorAll("line:not([data-type='velocity'])").forEach(l => l.remove());
  svg.querySelectorAll("line").forEach(l => l.remove());

  points.forEach(p => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y);
    circle.setAttribute("r", p.r);
    circle.setAttribute("fill", "white");
    svg.appendChild(circle);

    const effect_radius = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    effect_radius.setAttribute("cx", p.x);
    effect_radius.setAttribute("cy", p.y);
    effect_radius.setAttribute("r", p.r * scale);
    effect_radius.setAttribute("fill", "none");
    effect_radius.setAttribute("stroke", "white");
    effect_radius.setAttribute("stroke-opacity", "0.5");
    svg.appendChild(effect_radius);

    // Draw repulsion radius
    const repulsion_radius = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    repulsion_radius.setAttribute("cx", p.x);
    repulsion_radius.setAttribute("cy", p.y);
    repulsion_radius.setAttribute("r", repulsionDistance);
    repulsion_radius.setAttribute("fill", "none");
    repulsion_radius.setAttribute("stroke", "red");
    repulsion_radius.setAttribute("stroke-opacity", "0.3");
    repulsion_radius.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(repulsion_radius);

    const velocity = document.createElementNS("http://www.w3.org/2000/svg", "line");
    velocity.setAttribute("x1", p.x);
    velocity.setAttribute("y1", p.y);
    velocity.setAttribute("x2", p.x + p.vx * 10);
    velocity.setAttribute("y2", p.y + p.vy * 10);
    
    // Color velocity vector based on speed - red if over max velocity
    const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    const velocityColor = currentSpeed > maxVelocity ? "rgba(255,100,100,0.8)" : "rgba(255,255,255,0.5)";
    velocity.setAttribute("stroke", velocityColor);
    velocity.setAttribute("stroke-opacity", "0.8");
    velocity.setAttribute("data-type", "velocity"); // Mark as velocity line
    svg.appendChild(velocity);
    
    // Draw gravity force vector if gravity is enabled and force is significant
    if (gravityEnabled && (Math.abs(p.gravityX) > 0.01 || Math.abs(p.gravityY) > 0.01)) {
      const gravityVector = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gravityVector.setAttribute("x1", p.x);
      gravityVector.setAttribute("y1", p.y);
      gravityVector.setAttribute("x2", p.x + p.gravityX * 50);
      gravityVector.setAttribute("y2", p.y + p.gravityY * 50);
      
      // Color based on force direction (red for repulsion, green for attraction)
      const forceColor = (p.gravityX * p.gravityX + p.gravityY * p.gravityY) > 0 ? 
        (p.gravityX > 0 || p.gravityY > 0 ? "rgba(100,255,100,0.7)" : "rgba(255,100,100,0.7)") : 
        "rgba(255,100,100,0.7)";
      
      gravityVector.setAttribute("stroke", forceColor);
      gravityVector.setAttribute("stroke-width", "2");
      gravityVector.setAttribute("data-type", "gravity");
      svg.appendChild(gravityVector);
    }
  });
}

// Draw lines only if the points are within the each other's effect radius -> hash table between each point

function drawLines(svg, points) {
  // Remove old lines that is not velocity or gravity
  svg.querySelectorAll("line:not([data-type='velocity']):not([data-type='gravity'])").forEach(l => l.remove());

  // hash for every line -> if line is not in radius, then no
  const proximity = proximityHash(points);
  for (let [key,data] of proximity.entries()) {
    const {state, distance, p1, p2} = data;
    if (state === "-1") continue; // Skip if both outside
    console.log("key is:", key);
    const [id1,id2] = key.split(",").map(Number); // Get point ids

    if (!p1 || !p2) continue; // Safety check

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    
    // Color lines based on distance - red for repulsion zone, white for attraction
    if (distance < repulsionDistance) {
      line.setAttribute("stroke", "rgba(255,100,100,0.6)");
      line.setAttribute("stroke-width", "2");
    } else if (state === "0") {
      line.setAttribute("stroke", "rgba(255,255,255,0.5)");
      line.setAttribute("stroke-width", "1");
    } else {
      line.setAttribute("stroke", "rgba(255,255,255,0.2)");
      line.setAttribute("stroke-width", "1");
    }
    svg.appendChild(line);
  }
}

function initRandomPoints(svg, count = 10, base = 1.5) {
  const width = svg.clientWidth;
  const height = svg.clientHeight;
  const points = [];

  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 2 -1 + 3; // Random radius between 2 and 7
    const speed = Math.random() - 0.5 + base; // Random speed between base-0.5 and base+0.5
    const angle = Math.random() * 2 * Math.PI;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const id = i;
    console.log("id is:", id);
    points.push(new Point(x, y, r, vx, vy, id));
  }
  
  // Store references for control
  currentSvg = svg;
  currentPoints = points;

  // Start animation
  isAnimating = true;
  animate(svg, points);
}

// Functions related to animation
function animate(svg, points) {
    if (!isAnimating) return;

    const width = svg.clientWidth;
    const height = svg.clientHeight;

    // Apply gravity
    if (gravityEnabled) {
      applyGravity(points);
    }

    points.forEach(p => p.update(width, height));

    // Draw the points
    drawPoints(svg, points);
    drawLines(svg, points);

  animationID = requestAnimationFrame(() => animate(svg, points));
}
function stopAnimation() {
  isAnimating = false;
  if (animationID) {
    cancelAnimationFrame(animationID);
    animationID = null;
  }
  console.log("animation stopped");
}

function resumeAnimation() {
    if (!isAnimating && currentSvg && currentPoints.length > 0) {
        isAnimating = true;
        animate(currentSvg, currentPoints);
        console.log("Animation resumed");
    } else if (isAnimating) {
        console.log("Animation is already running");
    } else {
        console.log("No animation to resume - initialize points first");
    }
}

// Gravity control functions
function toggleGravity() {
  gravityEnabled = !gravityEnabled;
  console.log("Gravity", gravityEnabled ? "enabled" : "disabled");
}

function setGravityStrength(strength) {
  gravityStrength = Math.max(0, strength);
  console.log("Gravity strength set to:", gravityStrength);
}

function setRepulsionDistance(distance) {
  repulsionDistance = Math.max(1, distance);
  console.log("Repulsion distance set to:", repulsionDistance);
}

function setRepulsionStrength(strength) {
  repulsionStrength = Math.max(0, strength);
  console.log("Repulsion strength set to:", repulsionStrength);
}

function setMaxVelocity(velocity) {
  maxVelocity = Math.max(0.1, velocity);
  console.log("Max velocity set to:", maxVelocity);
}

function setDampingFactor(factor) {
  dampingFactor = Math.max(0.1, Math.min(1.0, factor));
  console.log("Damping factor set to:", dampingFactor);
}

function enableGravity() {
  gravityEnabled = true;
  console.log("Gravity enabled");
}

function disableGravity() {
  gravityEnabled = false;
  console.log("Gravity disabled");
}