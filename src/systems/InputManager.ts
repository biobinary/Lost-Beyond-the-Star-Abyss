import { toast } from "sonner";

export class InputManager {
  public moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  };
  
  public mouse = {
    dx: 0,
    dy: 0,
  };
  
  public scrollDirection = 0;

  public isPointerLocked = false;
  public justJumped = false;
  public isShooting = false;
  public isReloading = false;
  
  private rendererDomElement: HTMLElement;

  constructor(rendererDomElement: HTMLElement) {
    this.rendererDomElement = rendererDomElement;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.rendererDomElement.addEventListener("click", this.requestPointerLock);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("wheel", this.onWheel, { passive: false });
  }

  public dispose() {
    this.rendererDomElement.removeEventListener("click", this.requestPointerLock);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("wheel", this.onWheel);
  }

  private requestPointerLock = () => {
    this.rendererDomElement.requestPointerLock();
  }

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.rendererDomElement;
    if (!this.isPointerLocked) {
      window.dispatchEvent(new CustomEvent('togglePause'));
    }
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isPointerLocked) return;
    this.mouse.dx = event.movementX;
    this.mouse.dy = event.movementY;
  };

  public clearMouseMovement() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
  }

  private onWheel = (event: WheelEvent) => {
    if (!this.isPointerLocked) return;
    event.preventDefault();
    this.scrollDirection = event.deltaY > 0 ? 1 : -1;
  };

  private onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case "KeyW": this.moveState.forward = true; break;
      case "KeyS": this.moveState.backward = true; break;
      case "KeyA": this.moveState.left = true; break;
      case "KeyD": this.moveState.right = true; break;
      case "Space": this.justJumped = true; break;
      case "ShiftLeft": this.moveState.sprint = true; break;
      case "KeyR": this.isReloading = true; break;
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    switch (event.code) {
      case "KeyW": this.moveState.forward = false; break;
      case "KeyS": this.moveState.backward = false; break;
      case "KeyA": this.moveState.left = false; break;
      case "KeyD": this.moveState.right = false; break;
      case "ShiftLeft": this.moveState.sprint = false; break;
    }
  };
  
  private onMouseDown = (event: MouseEvent) => {
    if (event.button === 0) this.isShooting = true;
  }

  private onMouseUp = (event: MouseEvent) => {
    if (event.button === 0) this.isShooting = false;
  }
}