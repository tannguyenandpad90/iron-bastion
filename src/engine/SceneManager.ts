import type { Scene } from '../types';

export class SceneManager {
  private scenes = new Map<string, Scene>();
  private activeScene: Scene | null = null;

  register(scene: Scene) {
    this.scenes.set(scene.name, scene);
  }

  switch(name: string) {
    if (this.activeScene) {
      this.activeScene.destroy();
    }

    const scene = this.scenes.get(name);
    if (!scene) {
      throw new Error(`Scene "${name}" not found`);
    }

    this.activeScene = scene;
    this.activeScene.init();
  }

  update(dt: number) {
    if (this.activeScene) {
      this.activeScene.update(dt);
    }
  }

  getActive(): Scene | null {
    return this.activeScene;
  }

  destroy() {
    if (this.activeScene) {
      this.activeScene.destroy();
      this.activeScene = null;
    }
    this.scenes.clear();
  }
}
