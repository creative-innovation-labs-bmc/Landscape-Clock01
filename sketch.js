let zoneParticles = [[], [], [], []]; 
let lastSecond, lastMinute;
let mainFont, footerFont, sidebarFont; 
let city = "", country = ""; 
let locationFetched = false;
const PARTICLES_PER_ZONE = 800; 

function preload() {
  mainFont = loadFont('MP-B.ttf');  
  footerFont = loadFont('MS-Bk.otf');
  sidebarFont = loadFont('MP-M.ttf'); 
}

function setup() {
  createCanvas(1920, 1080); 
  fetchLocation();

  let zoneWidth = width / 4; 
  for (let z = 0; z < 4; z++) {
    let minX = z * zoneWidth;
    let maxX = (z + 1) * zoneWidth;
    for (let i = 0; i < PARTICLES_PER_ZONE; i++) {
      zoneParticles[z].push(new Particle(minX, maxX, z));
    }
  }

  lastSecond = second();
  lastMinute = minute();
}

function fetchLocation() {
  if (locationFetched) return;
  loadJSON('https://ipapi.co/json/', handleLocation, (err) => setTimeout(fetchLocation, 30000));
}

function handleLocation(data) {
  if (data && data.city) {
    city = data.city.toUpperCase().substring(0, 12);
    country = data.country_name.toUpperCase().substring(0, 12);
    locationFetched = true;
  }
}

function draw() {
  background(28, 27, 28); 

  let h = nf(hour(), 2);
  let m = nf(minute(), 2);
  let s = nf(second(), 2);
  let digits = [h[0], h[1], m[0], m[1]];
  
  let months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  let days = ["SUN", "MON", "TUES", "WED", "THURS", "FRI", "SAT"];
  
  let dateStr = day() + " " + months[month() - 1] + " " + year();
  let dayStr = days[new Date().getDay()];
  
  // New Sidebar: Date and Day only
  let dateText = dateStr + " — " + dayStr;
  // New Top Text: Location only
  let locationText = (locationFetched ? city + ", " + country : "");

  if (second() !== lastSecond) {
    applyVibration(18); 
    lastSecond = second();
  }
  
  if (minute() !== lastMinute) {
    shatterEffect();
    lastMinute = minute();
  }

  let zoneWidth = width / 4;
  for (let z = 0; z < 4; z++) {
    let xOffset = (z * zoneWidth) + (zoneWidth / 2);
    let yOffset = height / 2 - 140; 
    let pts = textToPoints(digits[z], xOffset, yOffset, 850, 9); 

    for (let i = 0; i < zoneParticles[z].length; i++) {
      let p = zoneParticles[z][i];
      if (i < pts.length) { p.setTarget(pts[i].x, pts[i].y); } 
      else { p.setTarget(null, null); }
      p.behaviors(xOffset, yOffset);
      p.update();
      p.show(xOffset, yOffset);
    }
  }

  drawLayout(h + ":" + m + ":" + s, dateText, locationText);
}

function drawLayout(time, sidebarText, topText) {
  let zoneW = width / 4;
  let dividerLerp = map(sin(frameCount * 0.008), -1, 1, 0, 0.3);
  let dividerCol = lerpColor(color('#FFFFFF'), color('#4e5859'), dividerLerp);

  for (let i = 0; i < 4; i++) {
    let startX = i * zoneW;
    
    // TOP LOCATION DISPLAY (The red line area)
    textFont(sidebarFont);
    fill('#BBB6C3');
    noStroke();
    textAlign(LEFT, TOP);
    textSize(20);
    text(topText, startX + 60, 40);

    // FOOTER: Time display
    textFont(footerFont);
    fill(255); 
    noStroke();
    textAlign(LEFT, BOTTOM);
    textSize(60); 
    text(time, startX + 60, height - 20);

    // SIDEBAR: Date and Day only
    push();
    textFont(sidebarFont);
    fill('#BBB6C3'); 
    translate(startX + zoneW - 70, height - 25);
    rotate(-HALF_PI); 
    textAlign(LEFT, CENTER);
    textSize(20); 
    text(sidebarText, 0, 0);
    pop();

    if (i < 3) {
      stroke(dividerCol);
      strokeWeight(2.0); 
      line((i + 1) * zoneW, 0, (i + 1) * zoneW, height);
    }
  }
}

function applyVibration(s) {
  for (let z = 0; z < 4; z++) {
    for (let p of zoneParticles[z]) { p.applyForce(p5.Vector.random2D().mult(random(s))); }
  }
}

function shatterEffect() {
  for (let z = 0; z < 4; z++) {
    for (let p of zoneParticles[z]) { p.applyForce(p5.Vector.random2D().mult(random(300, 600))); }
  }
}

function textToPoints(txt, x, y, size, step) {
  let pts = [];
  let t = createGraphics(1000, 1000); 
  t.pixelDensity(1);
  t.textFont(mainFont); 
  t.textSize(size * 0.5); 
  t.textAlign(CENTER, CENTER);
  t.fill(255);
  t.text(txt, 500, 500);
  t.loadPixels();
  for (let i = 0; i < t.width; i += step) {
    for (let j = 0; j < t.height; j += step) {
      if (t.pixels[(i + j * t.width) * 4] > 127) {
        pts.push({ x: x + (i - 500) * 2, y: y + (j - 500) * 2 });
      }
    }
  }
  t.remove();
  return pts;
}

class Particle {
  constructor(minX, maxX, zoneIndex) {
    this.minX = minX;
    this.maxX = maxX;
    this.zoneIndex = zoneIndex;
    this.pos = createVector(random(this.minX, this.maxX), random(height));
    this.target = createVector(this.pos.x, this.pos.y);
    this.vel = createVector();
    this.acc = createVector();
    this.rActiveBase = 8.4; 
    this.rIdle = 5.6;       
    this.maxspeed = 22;
    this.maxforce = 2.0;
    this.colorActive = color('#89C925'); 
    this.colorIdle = color('#2A3320'); 
    this.currentColor = color('#2A3320');
  }

  setTarget(x, y) {
    if (x) { this.target.set(x, y); this.isTargeted = true; } 
    else { this.isTargeted = false; }
  }

  behaviors(cX, cY) {
    if (this.isTargeted) {
      this.applyForce(this.arrive(this.target));
    } else {
      let breathPhase = frameCount * 0.008 + (this.zoneIndex * PI/2);
      let breathingStrength = map(sin(breathPhase), -1, 1, 0.01, 0.08);
      let n = noise(this.pos.x * 0.003, this.pos.y * 0.003, frameCount * 0.005);
      this.applyForce(p5.Vector.fromAngle(TWO_PI * n).mult(0.1));
      let zoneCenter = createVector(cX, cY);
      this.applyForce(p5.Vector.sub(zoneCenter, this.pos).setMag(breathingStrength));
    }
    this.applyForce(p5.Vector.random2D().mult(0.2));
  }

  applyForce(f) { this.acc.add(f); }

  update() {
    this.vel.add(this.acc).limit(this.maxspeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.vel.mult(0.92);
    if (this.pos.x < this.minX || this.pos.x > this.maxX) { this.vel.x *= -1; }
    if (this.pos.y < 0 || this.pos.y > height) { this.vel.y *= -1; }
  }

  show(cX, cY) {
    let targetC = this.isTargeted ? this.colorActive : this.colorIdle;
    this.currentColor = lerpColor(this.currentColor, targetC, 0.08);
    stroke(this.currentColor);
    
    if (this.isTargeted) {
      let d = dist(this.pos.x, this.pos.y, cX, cY);
      let radialScale = map(d, 0, 400, 3.5, 0.8);
      radialScale = constrain(radialScale, 0.8, 3.5);
      strokeWeight(this.rActiveBase * radialScale);
      point(this.pos.x, this.pos.y);
    } else {
      let breathPhase = frameCount * 0.01 + (this.zoneIndex * PI/2) + (this.pos.x * 0.005);
      let currentR = map(sin(breathPhase), -1, 1, this.rIdle * 0.8, this.rIdle * 2.5);
      strokeWeight(currentR); 
      point(this.pos.x, this.pos.y); 
    }
  }

  arrive(t) {
    let d = p5.Vector.sub(t, this.pos);
    let s = d.mag() < 120 ? map(d.mag(), 0, 120, 0, this.maxspeed) : this.maxspeed;
    return p5.Vector.sub(d.setMag(s), this.vel).limit(this.maxforce);
  }
}