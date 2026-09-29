let squareSize = 200;
let pressed = false;   // 手指是否按在方块上
let pressing = 0;      // 0~1 按压强度，平滑过渡
let offsetX = 0;       // 拖动偏移
let offsetY = 0;
let ripples = [];      // 触摸涟漪

function setup() {
  createCanvas(windowWidth, windowHeight);
  lockGestures();      // 锁定手势，避免下拉刷新/缩放干扰画布
}

function draw() {
  background(24, 22, 30);

  // 按压强度缓动
  pressing = lerp(pressing, pressed ? 1 : 0, 0.2);

  drawSquare();
  updateRipples();

  // 提示文字
  noStroke();
  fill(200, 190, 230, 140);
  textAlign(CENTER, CENTER);
  textSize(14);
  text('按住 / 拖动淡紫色方块', width / 2, height - 40);
}

function drawSquare() {
  const cx = width / 2 + offsetX;
  const cy = height / 2 + offsetY;

  const s = squareSize * (1 - pressing * 0.12);

  // 光晕
  noStroke();
  for (let i = 4; i > 0; i--) {
    const glow = s * (1 + i * 0.18);
    fill(190, 170, 255, 12 + pressing * 10);
    rectMode(CENTER);
    rect(cx, cy, glow, glow, 24);
  }

  // 淡紫色方块本体：按压时变亮
  const r = lerp(200, 230, pressing);
  const g = lerp(180, 215, pressing);
  const b = lerp(245, 255, pressing);
  fill(r, g, b);
  stroke(255, 255, 255, 60 + pressing * 140);
  strokeWeight(2);
  rectMode(CENTER);
  rect(cx, cy, s, s, 18);

  // 按压时中心的小标记
  noStroke();
  fill(120, 95, 200, 90 + pressing * 140);
  circle(cx, cy, 20 + pressing * 26);
}

// 在方块范围内（含边距）
function overSquare() {
  const cx = width / 2 + offsetX;
  const cy = height / 2 + offsetY;
  const half = squareSize / 2 + 30;
  return abs(mouseX - cx) < half && abs(mouseY - cy) < half;
}

function mousePressed() {
  if (overSquare()) {
    pressed = true;
    ripples.push({ x: mouseX, y: mouseY, r: 10, a: 200 });
  }
  return false; // 让 p5-phone 继续管理触摸
}

function mouseDragged() {
  if (pressed) {
    offsetX += movementX;
    offsetY += movementY;
    const maxOffset = min(width, height) / 2 - squareSize / 2;
    offsetX = constrain(offsetX, -maxOffset, maxOffset);
    offsetY = constrain(offsetY, -maxOffset, maxOffset);
    if (frameCount % 6 === 0) {
      ripples.push({ x: mouseX, y: mouseY, r: 6, a: 140 });
    }
  }
  return false;
}

function mouseReleased() {
  pressed = false;
  offsetX = 0;
  offsetY = 0;
  ripples.push({ x: width / 2, y: height / 2, r: 40, a: 220 });
  return false;
}

function updateRipples() {
  noFill();
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.r += 6;
    rp.a -= 8;
    stroke(210, 195, 255, max(rp.a, 0));
    strokeWeight(2);
    circle(rp.x, rp.y, rp.r * 2);
    if (rp.a <= 0) ripples.splice(i, 1);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
