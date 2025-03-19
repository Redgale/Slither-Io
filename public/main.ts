const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const socket = new WebSocket("wss://slither-io-mt3p.onrender.com");

interface SnakeSegment {
  x: number;
  y: number;
}

class Snake {
  body: SnakeSegment[];
  color: string;
  speed: number;
  direction: { x: number; y: number };

  constructor() {
    this.body = [{ x: canvas.width / 2, y: canvas.height / 2 }];
    this.color = "lime";
    this.speed = 5;
    this.direction = { x: 0, y: 0 };
  }

  move() {
    const head = {
      x: this.body[0].x + this.direction.x * this.speed,
      y: this.body[0].y + this.direction.y * this.speed,
    };

    this.body.unshift(head);
    this.body.pop();
  }

  grow(amount: number) {
    for (let i = 0; i < amount; i++) {
      this.body.push({ ...this.body[this.body.length - 1] });
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    this.body.forEach((segment) => {
      ctx.beginPath();
      ctx.arc(segment.x, segment.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  updateDirection(mouseX: number, mouseY: number) {
    const angle = Math.atan2(mouseY - this.body[0].y, mouseX - this.body[0].x);
    this.direction = { x: Math.cos(angle), y: Math.sin(angle) };
  }
}

// Initialize the snake
const playerSnake = new Snake();

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  playerSnake.move();
  playerSnake.draw();
  requestAnimationFrame(gameLoop);
}

// Handle mouse movement
canvas.addEventListener("mousemove", (event) => {
  playerSnake.updateDirection(event.clientX, event.clientY);
});

// WebSocket handling
socket.onopen = () => {
  console.log("Connected to WebSocket server");
};

socket.onmessage = (message) => {
  const data = JSON.parse(message.data);
  if (data.type === "grow") {
    playerSnake.grow(data.amount);
  }
};

socket.onerror = (error) => {
  console.error("WebSocket error:", error);
};

socket.onclose = () => {
  console.log("WebSocket connection closed");
};

// Start the game loop
gameLoop();
