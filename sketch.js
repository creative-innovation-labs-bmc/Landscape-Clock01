let zoneParticles = [[], [], [], []]; 
let lastSecond, lastMinute;
let mainFont, footerFont, sidebarFont; 
let city = "", country = ""; 
let fontsLoaded = false;
let locationFetched = false;
const PARTICLES_PER_ZONE = 1000; 

function preload() {
  // Using simplified filenames for signage compatibility
  mainFont = loadFont('MP-B.ttf', () => { fontsLoaded = true; }, fontError);  
  footerFont = loadFont('MS-Bk.otf', null, fontError);
  sidebarFont = loadFont('MP-M.ttf', null, fontError); 
}

function fontError(err) {
  console.error("Font failed. Fallback active.");
  mainFont = "Arial";
  footerFont = "Georgia";
  sidebarFont = "Arial";
  fontsLoaded = true; // Force start if fonts fail
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
  loadJSON('https://ipapi.co/json/', handleLocation, (err) => {
    setTimeout(fetchLocation, 30000); // Retry every 30s if offline
  });
}

function handleLocation(data) {
  if (data && data.city) {
    city = data.city.toUpperCase();
    country = data.country_name.toUpperCase();
    locationFetched = true;
  }
}

function draw() {
  background(28, 27, 28); 

  if (!fontsLoaded) {
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    text("INITIALIZING ARCHITECTURAL ENGINE...", width / 2, height / 2);
    return;
  }

  let h = nf(hour(), 2);
  let m = nf(minute(), 2);
  let s = nf(second(), 2);
  let digits = [h[0], h[1], m[0], m[1]];
  
  let dateStr = day() + " " + ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"][month() - 1] + " " + year();
  let dayStr = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][new Date().getDay()];
  let sidebarText = (locationFetched ? city + ", " + country + " — " : "") + dateStr + " — " + dayStr;

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

  drawLayout(h + ":" + m + ":" + s, sidebarText);
}

function drawLayout(time, sidebarText) {
  let zoneW = width / 4;
  let dividerLerp = map(sin(frameCount * 0.008), -1, 1, 0, 0.3);
  let dividerCol = lerpColor(color('#FFFFFF'), color('#4e5859'), dividerLerp);

  for (let i = 0; i < 4; i++) {
    let startX = i * zoneW;
    
    textFont(footerFont);
    fill(255); 
    noStroke();
    textAlign(LEFT, BOTTOM);
    textSize(60); 
    text(time, startX + 60, height - 20);

    push();
    textFont(sidebarFont);
    fill('#BBB6C3'); 
    translate(startX + zoneW - 70, height - 25);
    rotate(-HALF_PI); 
    textAlign(LEFT, CENTER);
    textSize(20); 
    text(sidebarText, 0, 0);
    pop();

    // REMOVED THE LAST DIVIDER
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