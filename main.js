class Drawer{
	constructor(canvas){
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.scale = 500;
		this.origin = { x: 400, y: 400 };
	}
	clear(){
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
	drawrods(rods) {
		rods.forEach(rod => {
			const cos = Math.cos(rod.theta);
			const sin = Math.sin(rod.theta);

			const half = rod.length / 2;

			const x1 = rod.cx + cos * (-half);
			const y1 = rod.cy + sin * (-half);

			const x2 = rod.cx + cos * (half);
			const y2 = rod.cy + sin * (half);

			this.drawLine(x1, y1, x2, y2);

			const coloredPoints = rod.points.map(p => {
				const px = rod.cx + cos * p.x - sin * p.y;
				const py = rod.cy + sin * p.x + cos * p.y;
				return {x:px, y:py, color:p.mass<0.01?"black":p.mass>0?"red":"blue"};
			});
			this.drawPoints(coloredPoints);
		});
	}
	toX(x) {
		return this.origin.x + x * this.scale;
	}
	 toY(y) {
		return this.origin.y - y * this.scale;
	}
	drawLine(x1, y1, x2, y2){
		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.moveTo(this.toX(x1), this.toY(y1));
		this.ctx.lineTo(this.toX(x2), this.toY(y2));
		this.ctx.stroke();
	}
	drawPoint(x, y, color) {
		this.ctx.beginPath();
		this.ctx.arc(this.toX(x), this.toY(y), 5, 0, Math.PI * 2);
		this.ctx.fillStyle = color;
		this.ctx.fill();
	}
	drawPoints(points, color=null){
		if(color == null){
			points.forEach(a => {
				this.drawPoint(a.x, a.y, a.color);
			});
		}else{
			points.forEach(a => {
				this.drawPoint(a.x, a.y, color);
			});
		}
	}
}
class Simulation{
	constructor(){
		this.dt = 0.1;
		this.frame = 0;
		this.rods = [];
		this.attractors = [];
	}
	setup(){
		this.dt = 0.1;
		this.frame = 0;
		this.rods = [];
		this.attractors = [];
		const Nj = 1;
		const Ni = 2;
		for(let j=0;j<Nj;j++){
			for(let i=0;i<Ni;i++){
				this.rods.push({
					cx: (i-(Ni-1)/2)/2,
					cy: (j-(Nj-1)/2)/2,
					theta: (Math.random()-0.5)/100,
					omega: 0,
					length: 0.3,
					points: [
						{ x: 0, y: 0, mass: 0},
						{ x: 0.15, y: 0, mass: 1 },
						{ x: -0.15, y: 0, mass: -1 },
					]
				});
			}
		}
	}
	// 時間を進める
	update() {
		const masses = this.getAllMasses();

		this.rods.forEach(rod => {
			const cos = Math.cos(rod.theta);
			const sin = Math.sin(rod.theta);

			let totalTorque = 0;

			rod.points.forEach(p => {
				// 自分の点のワールド座標
				const px = rod.cx + cos * p.x - sin * p.y;
				const py = rod.cy + sin * p.x + cos * p.y;

				masses.forEach(m => {
					const dx = m.x - px;
					const dy = m.y - py;
					const r2 = dx * dx + dy * dy;
					const r = Math.sqrt(r2);

					if (r < 0.001) return;
					// 重力も磁力も引き合う力は距離の自乗に反比例します。
					// そのため万有引力の公式にマイナスをつけて単純化のために係数を1として係数を取っ払った公式
					// これを磁力の式として使っています。
					const F = -(m.mass * p.mass) / r2;

					const Fx = F * dx / r;
					const Fy = F * dy / r;

					// 中心からのベクトル
					const rx = px - rod.cx;
					const ry = py - rod.cy;

					totalTorque += rx * Fy - ry * Fx;
				});
			});

			// 本来はトルクと角加速度は別物であり角加速度を算出するには,
			// 慣性モーメントという係数をかける必要があります.
			// しかし単純にするために係数を1としています。
			const alpha = totalTorque;
			rod.omega += alpha * this.dt;
			rod.theta += rod.omega * this.dt;
			rod.omega *= 0.99;
		});
		this.frame++;
	}
	getAllMasses(){
		const masses = [];

		this.attractors.forEach(a => {
			masses.push({
				x: a.x,
				y: a.y,
				mass: a.mass
			});
		});

		this.rods.forEach(rod => {
			const cos = Math.cos(rod.theta);
			const sin = Math.sin(rod.theta);

			rod.points.forEach(p => {
				const px = rod.cx + cos * p.x - sin * p.y;
				const py = rod.cy + sin * p.x + cos * p.y;

				masses.push({
					x: px,
					y: py,
					mass: p.mass
				});
			});
		});

		return masses;
	}
}
function plotDatas(datas, width, height) {
	/*
	ChatGPT
	JavaScript,グラフ datasという{x:小数, y:小数}がたくさん入った配列と500, 500のようなwidth, heightが渡されたとき、
	500x500のcanvas用意し、datasの各最小値最大値を計算し、座標変換をしてその点をプロットし、
	グローバル変数のgraphという要素に追加するような関数を作ってください
	*/
	if (!datas || datas.length === 0) return;

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	graph.appendChild(canvas);

	const ctx = canvas.getContext("2d");

	// --- min / max ---
	let minX = Infinity, maxX = -Infinity;
	let minY = Infinity, maxY = -Infinity;

	for (const d of datas) {
		if (d.x < minX) minX = d.x;
		if (d.x > maxX) maxX = d.x;
		if (d.y < minY) minY = d.y;
		if (d.y > maxY) maxY = d.y;
	}

	const rangeX = maxX - minX || 1;
	const rangeY = maxY - minY || 1;

	// --- 点描画 ---
	ctx.fillStyle = "black";

	for (const d of datas) {
		const nx = (d.x - minX) / rangeX;
		const ny = (d.y - minY) / rangeY;

		const cx = nx * width;
		const cy = height - (ny * height);

		ctx.fillRect(cx, cy, 2, 2);
	}

	// --- x軸の目盛り ---
	ctx.strokeStyle = "black";
	ctx.fillStyle = "black";
	ctx.font = "10px sans-serif";
	ctx.textAlign = "center";

	const tickCount = 10; // 分割数

	for (let i = 0; i <= tickCount; i++) {
		const t = i / tickCount;

		// canvas上の位置
		const x = t * width;

		// 実際の値
		const value = minX + t * rangeX;

		// 目盛り線
		ctx.beginPath();
		ctx.moveTo(x, height);
		ctx.lineTo(x, height - 5);
		ctx.stroke();

		// ラベル（小数調整）
		const label = Number.isInteger(minX) && Number.isInteger(maxX)
		? Math.round(value)
		: value.toFixed(2);

		ctx.fillText(label+"HZ", x, height - 7);
	}
}
let graph = document.getElementById("graph");

let outputHz = document.getElementById("outputHz");
let rangeHz = document.getElementById("rangeHz");
let rangeHzvalue = 0;

const simulation = new Simulation();
simulation.setup();

const drawer = new Drawer(document.getElementById("canvas"));
function sumAbsDiff(datas) {
	let sum = 0;
	for (let i = 1; i < datas.length; i++) {
		sum += Math.abs(datas[i] - datas[i - 1]);
	}
	return sum;
}
let min = 0, max = 5;
rangeHz.min = min;
rangeHz.max = max;
const plotdatas = [];
for(let hz=min;hz<max;hz+=0.01){
	simulation.setup();
	rangeHzvalue = hz;
	for(let i=0;i<1000;i++){
		simulation.update();
		simulation.rods[0].theta = Math.PI/180*20*Math.sin(simulation.frame/60*Math.PI*2 * rangeHzvalue);
	}
	let datas = [];
	for(let i=0;i<300;i++){
		simulation.update();
		simulation.rods[0].theta = Math.PI/180*20*Math.sin(simulation.frame/60*Math.PI*2 * rangeHzvalue);
		datas.push(simulation.rods[1].theta);
	}
	const sumdiff = sumAbsDiff(datas);
	console.log(`hz = ${hz.toFixed(4)} sumdiff = ${sumdiff}`);
	plotdatas.push({x: hz, y:sumdiff});
}
plotDatas(plotdatas, 800, 800);

function loop() {
	drawer.clear();
	if(rangeHzvalue != rangeHz.valueAsNumber){
		rangeHzvalue = rangeHz.valueAsNumber;
		outputHz.innerText = rangeHzvalue;
		simulation.setup();
	}
	drawer.drawPoints(simulation.attractors, "green");
	drawer.drawrods(simulation.rods);
	simulation.update();
	simulation.rods[0].theta = Math.PI/180*20*Math.sin(simulation.frame/60*Math.PI*2 * rangeHzvalue);
	requestAnimationFrame(loop);
}

loop();