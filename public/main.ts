interface Point {
    x: number;
    y: number;
  }
  
  class Snake {
    segments: Point[] = [];
    speed: number = 2;
    head: Point;
  
    constructor(start: Point) {
      this.head = start;
      // Initialize with several segments
      for (let i = 0; i < 10; i++) {
        this.segments.push({ x: start.x - i * 10, y: start.y });
      }
    }
  
    update(target: Point) {
      // Move the head toward the target using a simple interpolation
      let dx = target.x - this.head.x;
      let dy = target.y - this.head.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        this.head.x += (dx / dist) * this.speed;
        this.head.y += (dy / dist) * this.speed;
      }
      // Insert new head position and remove tail to simulate movement
      this.segments.unshift({ x: this.head.x, y: this.head.y });
      this.segments.pop();
    }
  
    grow(amount: number) {
      // Append additional segments to simulate growth
      for (let i = 0; i < amount; i++) {
        let tail = this.segments[this.segments.length - 1];
        this.segments.push({ x: tail.x, y: tail.y });
      }
    }
  
    render(ctx: CanvasRenderingContext2D) {
      ctx.strokeStyle = "#0f0";
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = 0; i < this.segments.length; i++) {
        const seg = this.segments[i];
        if (i === 0) {
          ctx.moveTo(seg.x, seg.y);
        } else {
          ctx.lineTo(seg.x, seg.y);
        }
      }
      ctx.stroke();
    }
  }
  
  class Pellet {
    pos: Point;
    radius: number = 5;
    constructor(pos: Point) {
      this.pos = pos;
    }
    render(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "#f00";
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    socket: WebSocket;
    mousePos: Point = { x: 0, y: 0 };
    snake: Snake;
    pellets: Pellet[] = [];
    cameraZoom: number = 1;
  
    constructor() {
      this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
      this.ctx = this.canvas.getContext('2d')!;
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      this.setupInput();
      this.initWebSocket();
      // Start the snake in the center of the canvas
      this.snake = new Snake({ x: this.canvas.width / 2, y: this.canvas.height / 2 });
      // Generate some pellets randomly in a larger game world
      for (let i = 0; i < 50; i++) {
        this.pellets.push(new Pellet({
          x: Math.random() * 2000 - 1000,
          y: Math.random() * 2000 - 1000
        }));
      }
      requestAnimationFrame(() => this.gameLoop());
    }
  
    resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  
    setupInput() {
      this.canvas.addEventListener('mousemove', (e) => {
        this.mousePos = { x: e.clientX, y: e.clientY };
      });
      // Support touch input for mobile devices
      this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        this.mousePos = { x: touch.clientX, y: touch.clientY };
      }, { passive: false });
    }
  
    initWebSocket() {
      // Connect to the WebSocket server
      this.socket = new WebSocket('ws://localhost:8080');
      this.socket.onopen = () => {
        console.log("Connected to game server");
      };
      this.socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.type === 'grow') {
          // Increase snake length upon receiving a grow event from the server
          this.snake.grow(data.amount);
        }
        // Additional state updates (e.g., positions of other players) can be handled here
      };
    }
  
    gameLoop() {
      this.update();
      this.render();
      requestAnimationFrame(() => this.gameLoop());
    }
  
    update() {
      this.snake.update(this.mousePos);
      // Check for collisions with pellets
      this.pellets = this.pellets.filter(pellet => {
        const dx = pellet.pos.x - this.snake.head.x;
        const dy = pellet.pos.y - this.snake.head.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < pellet.radius + 5) { // simple collision threshold
          // Notify the server that a pellet was eaten
          this.socket.send(JSON.stringify({ type: 'pelletEaten', pelletPos: pellet.pos }));
          return false; // Remove the pellet from the game
        }
        return true;
      });
    }
  
    render() {
      this.ctx.save();
      // Clear the canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Translate the canvas so the snake's head is centered
      const translateX = this.canvas.width / 2 - this.snake.head.x;
      const translateY = this.canvas.height / 2 - this.snake.head.y;
      this.ctx.translate(translateX, translateY);
      // Render pellets and the snake
      this.pellets.forEach(p => p.render(this.ctx));
      this.snake.render(this.ctx);
      this.ctx.restore();
    }
  }
  
  window.onload = () => {
    new Game();
  };
  