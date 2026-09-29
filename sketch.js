let squareSize = 200;
let pressed = false;   // 手指是否按在方块上
let pressing = 0;      // 0~1 按压强度，平滑过渡
let dragX = 0;         // 手指拖动偏移
let dragY = 0;
let ripples = [];      // 触摸涟漪

// 陀螺仪驱动的倾斜（平滑后的值）
let tiltX = 0;
let tiltY = 0;
let tiltZ = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  lockGestures();                      // 锁定手势，避免下拉刷新/缩放干扰画布
  enableSensorTap('轻触屏幕以启用陀螺仪');
}

function draw() {
  background(24, 22, 30);

  const gyroOn = window.sensorsEnabled === true;

  // --- 读取陀螺仪（p5 内置全局值，p5-phone 只负责开门） ---
  if (gyroOn) {
    const rx = isNaN(rotationX) ? 0 : rotationX;
    const ry = isNaN(rotationY) ? 0 : rotationY;
    const rz = isNaN(rotationZ) ? 0 : rotationZ;
    // 倾斜量映射成位移/旋转，做缓动让动作不抖
    tiltX = lerp(tiltX, constrain(ry, -45, 45), 0.08);
    tiltY = lerp(tiltY, constrain(rx, -45, 45), 0.08);
    tiltZ = lerp(tiltZ, constrain(rz, -90, 90), 0.08);
  } else {
    tiltX = lerp(tiltX, 0, 0.08);
    tiltY = lerp(tiltY, 0, 0.08);
    tiltZ = lerp(tiltZ, 0, 0.08);
  }

  // 按压强度缓动
  pressing = lerp(pressing, pressed ? 1 : 0, 0.2);

  drawSquare(gyroOn);
  updateRipples();

  // 底部提示
  noStroke();
  fill(200, 190, 230, 150);
  textAlign(CENTER, CENTER);
  textSize(14);
  if (!gyroOn) {
    text('轻触屏幕启用陀螺仪', width / 2, height - 40);
  } else {
    text('倾斜手机移动方块 · 按住拖动方块', width / 2, height - 40);
  }
}

function drawSquare(gyroOn) {
  // 位置：居中 + 陀螺仪倾斜位移 + 手指拖动位移
  const tiltOffX = gyroOn ? map(tiltX, -45, 45, -1, 1) * width * 0.22 : 0;
  const tiltOffY = gyroOn ? map(tiltY, -45, 45, -1, 1) * height * 0.22 : 0;

  const cx = width / 2 + tiltOffX + dragX;
  const cy = height / 2 + tiltOffY + dragY;

  const s = squareSize * (1 - pressing * 0.12);
  const rot = gyroOn ? radians(tiltZ) * 0.35 : 0;   // 随 Z 轴轻微旋转

  // 地面投影：方块越"倾斜"，影子偏得越远
  noStroke();
  fill(0, 0, 0, 60);
  ellipseMode(CENTER);
  ellipse(cx - tiltOffX * 0.5, cy + s * 0.55, s * 0.9, s * 0.22);

  push();
  translate(cx, cy);
  rotate(rot);

  // 光晕
  rectMode(CENTER);
  for (let i = 4; i > 0; i--) {
    const glow = s * (1 + i * 0.18);
    fill(190, 170, 255, 12 + pressing * 10);
    rect(0, 0, glow, glow, 24);
  }

  // 淡紫色方块本体：按压时变亮
  const r = lerp(200, 230, pressing);
  const g = lerp(180, 215, pressing);
  const b = lerp(245, 255, pressing);
  fill(r, g, b);
  stroke(255, 255, 255, 60 + pressing * 140);
  strokeWeight(2);
  rect(0, 0, s, s, 18);

  // 内部高光/阴影：随倾斜方向移动，做出立体感
  noStroke();
  const hx = map(tiltX, -45, 45, s * 0.18, -s * 0.18) * (gyroOn ? 1 : 0);
  const hy = map(tiltY, -45, 45, s * 0.18, -s * 0.18) * (gyroOn ? 1 : 0);
  fill(255, 255, 255, 70);
  circle(-hx, -hy, s * 0.35);
  fill(120, 95, 200, 60 + pressing * 80);
  circle(hx, hy, s * 0.3);

  // 中心标记
  fill(120, 95, 200, 90 + pressing * 140);
  circle(0, 0, 20 + pressing * 26);

  pop();
}

// 在方块范围内（含边距）
function overSquare() {
  const tiltOffX = window.sensorsEnabled ? map(tiltX, -45, 45, -1, 1) * width * 0.22 : 0;
  const tiltOffY = window.sensorsEnabled ? map(tiltY, -45, 45, -1, 1) * height * 0.22 : 0;
  const cx = width / 2 + tiltOffX + dragX;
  const cy = height / 2 + tiltOffY + dragY;
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
    dragX += movementX;
    dragY += movementY;
    const maxOffset = min(width, height) / 2 - squareSize / 2;
    dragX = constrain(dragX, -maxOffset, maxOffset);
    dragY = constrain(dragY, -maxOffset, maxOffset);
    if (frameCount % 6 === 0) {
      ripples.push({ x: mouseX, y: mouseY, r: 6, a: 140 });
    }
  }
  return false;
}

function mouseReleased() {
  pressed = false;
  dragX = 0;
  dragY = 0;
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
