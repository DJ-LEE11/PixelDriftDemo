import {
    _decorator,
    Color,
    Component,
    EventKeyboard,
    EventTouch,
    Graphics,
    Input,
    input,
    KeyCode,
    Label,
    Node,
    ResolutionPolicy,
    UITransform,
    Vec3,
    view,
} from 'cc';

const { ccclass } = _decorator;

type Obstacle = {
    node: Node;
    speed: number;
};

@ccclass('GameController')
export class GameController extends Component {
    private readonly designWidth = 720;
    private readonly designHeight = 1280;
    private readonly roadHalfWidth = 270;
    private readonly playerWidth = 92;
    private readonly playerHeight = 150;

    private player!: Node;
    private scoreLabel!: Label;
    private hintLabel!: Label;
    private gameOverLabel!: Label;
    private obstacles: Obstacle[] = [];
    private targetX = 0;
    private score = 0;
    private spawnTimer = 0;
    private spawnInterval = 0.82;
    private running = true;
    private leftPressed = false;
    private rightPressed = false;

    start(): void {
        view.setDesignResolutionSize(
            this.designWidth,
            this.designHeight,
            ResolutionPolicy.FIXED_WIDTH,
        );

        const canvasTransform = this.node.getComponent(UITransform);
        canvasTransform?.setContentSize(this.designWidth, this.designHeight);

        this.drawBackground();
        this.createHud();
        this.createPlayer();
        this.bindInput();
        this.resetGame();
    }

    onDestroy(): void {
        input.off(Input.EventType.TOUCH_START, this.onTouch, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouch, this);
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    update(deltaTime: number): void {
        if (!this.running) {
            return;
        }

        if (this.leftPressed) {
            this.targetX -= 520 * deltaTime;
        }
        if (this.rightPressed) {
            this.targetX += 520 * deltaTime;
        }

        const maxX = this.roadHalfWidth - this.playerWidth / 2 - 12;
        this.targetX = Math.max(-maxX, Math.min(maxX, this.targetX));
        const current = this.player.position;
        const nextX = current.x + (this.targetX - current.x) * Math.min(1, deltaTime * 11);
        this.player.setPosition(nextX, current.y, 0);

        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnObstacle();
            this.spawnInterval = Math.max(0.42, 0.82 - this.score * 0.004);
        }

        for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
            const obstacle = this.obstacles[i];
            const position = obstacle.node.position;
            obstacle.node.setPosition(position.x, position.y - obstacle.speed * deltaTime, 0);

            if (this.isColliding(obstacle.node)) {
                this.endGame();
                return;
            }

            if (obstacle.node.position.y < -this.designHeight / 2 - 100) {
                obstacle.node.destroy();
                this.obstacles.splice(i, 1);
                this.score += 1;
                this.scoreLabel.string = `SCORE  ${this.score}`;
            }
        }
    }

    private drawBackground(): void {
        const background = new Node('Background');
        background.setSiblingIndex(0);
        this.node.addChild(background);
        const transform = background.addComponent(UITransform);
        transform.setContentSize(this.designWidth, this.designHeight);
        const graphics = background.addComponent(Graphics);

        graphics.fillColor = new Color(8, 14, 30, 255);
        graphics.rect(-360, -640, 720, 1280);
        graphics.fill();

        graphics.fillColor = new Color(20, 29, 49, 255);
        graphics.roundRect(-290, -640, 580, 1280, 26);
        graphics.fill();

        graphics.lineWidth = 6;
        graphics.strokeColor = new Color(34, 211, 238, 130);
        graphics.moveTo(-290, -640);
        graphics.lineTo(-290, 640);
        graphics.moveTo(290, -640);
        graphics.lineTo(290, 640);
        graphics.stroke();

        graphics.lineWidth = 5;
        graphics.strokeColor = new Color(148, 163, 184, 90);
        for (let y = -600; y < 640; y += 115) {
            graphics.moveTo(0, y);
            graphics.lineTo(0, y + 58);
        }
        graphics.stroke();

        for (let y = -610; y < 640; y += 90) {
            graphics.fillColor = new Color(217, 70, 239, 95);
            graphics.circle(-326, y, 5);
            graphics.circle(326, y + 35, 5);
            graphics.fill();
        }
    }

    private createHud(): void {
        const title = this.createLabel('PIXEL DRIFT', 42, new Color(103, 232, 249, 255));
        title.node.setPosition(0, 555, 0);
        title.isBold = true;

        this.scoreLabel = this.createLabel('SCORE  0', 30, new Color(241, 245, 249, 255));
        this.scoreLabel.node.setPosition(0, 500, 0);

        this.hintLabel = this.createLabel('拖动屏幕控制赛车  ·  避开障碍', 24, new Color(148, 163, 184, 255));
        this.hintLabel.node.setPosition(0, -555, 0);

        this.gameOverLabel = this.createLabel('', 34, new Color(255, 255, 255, 255));
        this.gameOverLabel.node.setPosition(0, 80, 0);
        this.gameOverLabel.lineHeight = 50;
        this.gameOverLabel.isBold = true;
    }

    private createPlayer(): void {
        this.player = new Node('Player');
        this.node.addChild(this.player);
        const transform = this.player.addComponent(UITransform);
        transform.setContentSize(this.playerWidth, this.playerHeight);
        const graphics = this.player.addComponent(Graphics);

        graphics.fillColor = new Color(34, 211, 238, 255);
        graphics.roundRect(-46, -75, 92, 150, 24);
        graphics.fill();
        graphics.fillColor = new Color(15, 23, 42, 255);
        graphics.roundRect(-30, -35, 60, 72, 15);
        graphics.fill();
        graphics.fillColor = new Color(217, 70, 239, 255);
        graphics.roundRect(-35, 48, 70, 14, 7);
        graphics.fill();

        this.player.setPosition(0, -390, 0);
    }

    private createLabel(text: string, fontSize: number, color: Color): Label {
        const node = new Node(`Label-${text}`);
        this.node.addChild(node);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(680, 120);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
    }

    private bindInput(): void {
        input.on(Input.EventType.TOUCH_START, this.onTouch, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouch, this);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onTouch(event: EventTouch): void {
        if (!this.running) {
            this.resetGame();
            return;
        }

        const visibleWidth = view.getVisibleSize().width;
        const ratio = event.getUILocation().x / visibleWidth;
        this.targetX = (ratio - 0.5) * this.designWidth;
    }

    private onKeyDown(event: EventKeyboard): void {
        if (!this.running && (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.ENTER)) {
            this.resetGame();
            return;
        }
        this.leftPressed = event.keyCode === KeyCode.ARROW_LEFT || event.keyCode === KeyCode.KEY_A
            ? true
            : this.leftPressed;
        this.rightPressed = event.keyCode === KeyCode.ARROW_RIGHT || event.keyCode === KeyCode.KEY_D
            ? true
            : this.rightPressed;
    }

    private onKeyUp(event: EventKeyboard): void {
        if (event.keyCode === KeyCode.ARROW_LEFT || event.keyCode === KeyCode.KEY_A) {
            this.leftPressed = false;
        }
        if (event.keyCode === KeyCode.ARROW_RIGHT || event.keyCode === KeyCode.KEY_D) {
            this.rightPressed = false;
        }
    }

    private spawnObstacle(): void {
        const node = new Node('Obstacle');
        this.node.addChild(node);
        node.setSiblingIndex(1);
        const width = 80 + Math.random() * 34;
        const height = 105 + Math.random() * 45;
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);
        const graphics = node.addComponent(Graphics);
        const color = Math.random() > 0.5
            ? new Color(251, 113, 133, 255)
            : new Color(250, 204, 21, 255);
        graphics.fillColor = color;
        graphics.roundRect(-width / 2, -height / 2, width, height, 18);
        graphics.fill();
        graphics.fillColor = new Color(15, 23, 42, 210);
        graphics.roundRect(-width * 0.3, -height * 0.18, width * 0.6, height * 0.36, 10);
        graphics.fill();

        const minX = -this.roadHalfWidth + width / 2 + 18;
        const maxX = this.roadHalfWidth - width / 2 - 18;
        node.setPosition(minX + Math.random() * (maxX - minX), 720, 0);
        this.obstacles.push({ node, speed: 470 + Math.min(this.score * 7, 280) });
    }

    private isColliding(obstacle: Node): boolean {
        const playerPosition = this.player.position;
        const obstaclePosition = obstacle.position;
        const obstacleTransform = obstacle.getComponent(UITransform);
        if (!obstacleTransform) {
            return false;
        }
        return Math.abs(playerPosition.x - obstaclePosition.x)
                < (this.playerWidth + obstacleTransform.width) * 0.42
            && Math.abs(playerPosition.y - obstaclePosition.y)
                < (this.playerHeight + obstacleTransform.height) * 0.42;
    }

    private endGame(): void {
        this.running = false;
        this.gameOverLabel.string = `撞车了！\n得分 ${this.score}\n\n点击屏幕重新开始`;
        this.hintLabel.string = '也可以按空格键重新开始';
    }

    private resetGame(): void {
        for (const obstacle of this.obstacles) {
            obstacle.node.destroy();
        }
        this.obstacles.length = 0;
        this.score = 0;
        this.scoreLabel.string = 'SCORE  0';
        this.spawnTimer = 0;
        this.spawnInterval = 0.82;
        this.targetX = 0;
        this.player.setPosition(new Vec3(0, -390, 0));
        this.gameOverLabel.string = '';
        this.hintLabel.string = '拖动屏幕控制赛车  ·  避开障碍';
        this.running = true;
    }
}
