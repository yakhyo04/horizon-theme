export {};

declare global {
  interface Shopify {
    country: string;
    currency: {
      active: string;
      rate: string;
    };
    designMode: boolean;
    locale: string;
    shop: string;
    loadFeatures(features: ShopifyFeature[], callback?: LoadCallback): void;
    ModelViewerUI?: ModelViewer;
    visualPreviewMode: boolean;
  }

  interface Theme {
    translations: Record<string, string>;
    routes: {
      cart_add_url: string;
      cart_change_url: string;
      cart_update_url: string;
      cart_url: string;
      predictive_search_url: string;
      search_url: string;
    };
    utilities: {
      scheduler: {
        schedule: (task: () => void) => void;
      };
    };
    template: {
      name: string;
    };
    image_ratios: {
      landscape: string;
      portrait: string;
      square: string;
    };
    easings: {
      'power1.out': string;
      'power1.in': string;
      'power2.out': string;
      'power2.in': string;
      'power3.out': string;
      'power3.in': string;
      'power4.out': string;
      'power4.in': string;
    };
  }

  interface Window {
    Shopify: Shopify;
    gsap: GSAP;
  }

  declare const Shopify: Shopify;
  declare const Theme: Theme;
  declare const gsap: GSAP;

  interface GSAPTweenVars {
    [key: string]: any;
    duration?: number;
    delay?: number;
    ease?: string;
    stagger?: number | GSAPStaggerVars;
    onComplete?: () => void;
    onStart?: () => void;
    onUpdate?: () => void;
    onReverseComplete?: () => void;
    clearProps?: string | boolean;
    immediateRender?: boolean;
    overwrite?: boolean | string;
    paused?: boolean;
    repeat?: number;
    repeatDelay?: number;
    yoyo?: boolean;
    yoyoEase?: string | boolean;
  }

  interface GSAPStaggerVars {
    each?: number;
    amount?: number;
    from?: number | string | number[];
    grid?: number[] | 'auto';
    axis?: 'x' | 'y';
    ease?: string;
  }

  interface GSAPTimeline {
    to(targets: GSAPTarget, vars: GSAPTweenVars, position?: string | number): GSAPTimeline;
    from(targets: GSAPTarget, vars: GSAPTweenVars, position?: string | number): GSAPTimeline;
    fromTo(targets: GSAPTarget, fromVars: GSAPTweenVars, toVars: GSAPTweenVars, position?: string | number): GSAPTimeline;
    set(targets: GSAPTarget, vars: GSAPTweenVars, position?: string | number): GSAPTimeline;
    add(child: GSAPTimeline | GSAPTween | (() => void), position?: string | number): GSAPTimeline;
    addLabel(label: string, position?: string | number): GSAPTimeline;
    addPause(position?: string | number, callback?: () => void): GSAPTimeline;
    call(callback: () => void, params?: any[], position?: string | number): GSAPTimeline;
    play(from?: string | number, suppressEvents?: boolean): GSAPTimeline;
    pause(atTime?: string | number, suppressEvents?: boolean): GSAPTimeline;
    resume(): GSAPTimeline;
    reverse(from?: string | number, suppressEvents?: boolean): GSAPTimeline;
    restart(includeDelay?: boolean, suppressEvents?: boolean): GSAPTimeline;
    seek(position: string | number, suppressEvents?: boolean): GSAPTimeline;
    progress(value?: number, suppressEvents?: boolean): number | GSAPTimeline;
    totalProgress(value?: number, suppressEvents?: boolean): number | GSAPTimeline;
    time(value?: number, suppressEvents?: boolean): number | GSAPTimeline;
    totalTime(value?: number, suppressEvents?: boolean): number | GSAPTimeline;
    duration(value?: number): number | GSAPTimeline;
    totalDuration(value?: number): number | GSAPTimeline;
    kill(): GSAPTimeline;
    clear(includeLabels?: boolean): GSAPTimeline;
    invalidate(): GSAPTimeline;
    isActive(): boolean;
    timeScale(value?: number): number | GSAPTimeline;
    repeat(value?: number): number | GSAPTimeline;
    repeatDelay(value?: number): number | GSAPTimeline;
    yoyo(value?: boolean): boolean | GSAPTimeline;
    then(callback: () => void): Promise<void>;
  }

  interface GSAPTween {
    play(from?: string | number, suppressEvents?: boolean): GSAPTween;
    pause(atTime?: string | number, suppressEvents?: boolean): GSAPTween;
    resume(): GSAPTween;
    reverse(from?: string | number, suppressEvents?: boolean): GSAPTween;
    restart(includeDelay?: boolean, suppressEvents?: boolean): GSAPTween;
    seek(position: string | number, suppressEvents?: boolean): GSAPTween;
    progress(value?: number, suppressEvents?: boolean): number | GSAPTween;
    totalProgress(value?: number, suppressEvents?: boolean): number | GSAPTween;
    time(value?: number, suppressEvents?: boolean): number | GSAPTween;
    totalTime(value?: number, suppressEvents?: boolean): number | GSAPTween;
    duration(value?: number): number | GSAPTween;
    totalDuration(value?: number): number | GSAPTween;
    kill(): GSAPTween;
    invalidate(): GSAPTween;
    isActive(): boolean;
    timeScale(value?: number): number | GSAPTween;
    repeat(value?: number): number | GSAPTween;
    repeatDelay(value?: number): number | GSAPTween;
    yoyo(value?: boolean): boolean | GSAPTween;
    then(callback: () => void): Promise<void>;
  }

  type GSAPTarget = string | Element | Element[] | NodeList | null;

  interface GSAP {
    to(targets: GSAPTarget, vars: GSAPTweenVars): GSAPTween;
    from(targets: GSAPTarget, vars: GSAPTweenVars): GSAPTween;
    fromTo(targets: GSAPTarget, fromVars: GSAPTweenVars, toVars: GSAPTweenVars): GSAPTween;
    set(targets: GSAPTarget, vars: GSAPTweenVars): GSAPTween;
    timeline(vars?: GSAPTweenVars): GSAPTimeline;
    killTweensOf(targets: GSAPTarget, props?: string): void;
    getProperty(target: GSAPTarget, property: string, unit?: string): any;
    quickSetter(target: GSAPTarget, property: string, unit?: string): (value: any) => void;
    quickTo(target: GSAPTarget, property: string, vars?: GSAPTweenVars): (value: any, start?: any, startIsRelative?: boolean) => GSAPTween;
    isTweening(target: GSAPTarget): boolean;
    getTweensOf(target: GSAPTarget, onlyActive?: boolean): GSAPTween[];
    registerPlugin(...plugins: any[]): void;
    defaults(vars?: GSAPTweenVars): GSAPTweenVars;
    config(vars?: { autoSleep?: number; force3D?: boolean | 'auto'; nullTargetWarn?: boolean; units?: Record<string, string> }): void;
    ticker: {
      add(callback: (time: number, deltaTime: number, frame: number) => void): void;
      remove(callback: (time: number, deltaTime: number, frame: number) => void): void;
      fps(value?: number): number;
      lagSmoothing(threshold: number, adjustedLag: number): void;
      wake(): void;
      sleep(): void;
    };
    utils: {
      toArray<T extends Element = Element>(target: string | T | T[] | NodeList): T[];
      selector(scope: Element | string): (selector: string) => Element[];
      mapRange(inMin: number, inMax: number, outMin: number, outMax: number, value: number): number;
      clamp(min: number, max: number, value: number): number;
      wrap(min: number, max: number, value: number): number;
      wrapYoyo(min: number, max: number, value: number): number;
      distribute(vars: { base?: number; amount?: number; from?: number | string; grid?: number[] | 'auto'; axis?: 'x' | 'y'; ease?: string }): (index: number, target: Element, targets: Element[]) => number;
      random(min: number, max: number, snapIncrement?: number): number;
      random<T>(array: T[]): T;
      snap(snapIncrement: number | number[]): (value: number) => number;
      normalize(min: number, max: number, value: number): number;
      interpolate<T>(start: T, end: T, progress: number): T;
      unitize(func: (value: number) => number, unit?: string): (value: string | number) => string;
      shuffle<T>(array: T[]): T[];
      pipe(...functions: ((value: any) => any)[]): (value: any) => any;
    };
    parseEase(ease: string): (progress: number) => number;
    delayedCall(delay: number, callback: () => void, params?: any[]): GSAPTween;
    version: string;
  }

  type LoadCallback = (error: Error | undefined) => void;

  // Refer to https://github.com/Shopify/shopify/blob/main/areas/core/shopify/app/assets/javascripts/storefront/load_feature/load_features.js
  interface ShopifyFeature {
    name: string;
    version: string;
    onLoad?: LoadCallback;
  }

  // Refer to https://github.com/Shopify/model-viewer-ui/blob/main/src/js/model-viewer-ui.js
  interface ModelViewer {
    new (
      element: Element,
      options?: {
        focusOnPlay?: boolean;
      }
    ): ModelViewer;
    play(): void;
    pause(): void;
    toggleFullscreen(): void;
    zoom(amount: number): void;
    destroy(): void;
  }

  // Device Memory API - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
  interface Navigator {
    readonly deviceMemory?: number;
  }
}
