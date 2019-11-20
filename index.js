import Vue, { ref, reactive, onUnmounted, computed } from "./vue.js";
import "https://unpkg.com/vue-p5@0.8.0-rc4/dist/vue-p5.js";
import "https://cdnjs.cloudflare.com/ajax/libs/tone/13.8.28/Tone.js";

const DEFAULT = {
  template: `<vue-p5 v-on="{ setup, draw }" style="width: 100%; height: 100%;"></vue-p5>`,
  setup: `const dist = new Tone.Distortion().toMaster();
const osc = new Tone.Oscillator(140, 'sine').connect(dist).start();
var noiseSynth = new Tone.NoiseSynth().connect(dist);

return { osc, dist, noiseSynth }`,
  sketch: {
    setup: `sketch.frameRate(10);`,
    draw: `const { osc, dist, noiseSynth } = scope;

noiseSynth.set("noise.type", (sketch.frameCount % 2 === 0) ? "brown" : "white"); 
sketch.frameCount % 2 && noiseSynth.triggerAttackRelease("8n");

osc.frequency.value = sketch.frameCount * 20 % 90;
osc.mute = sketch.frameCount * 10 % 10;
osc.partialCount = sketch.frameCount % 2;
dist.distortion = Math.random() * 1000;

sketch.colorMode(sketch.HSB, 5);
sketch.frameRate(10);
sketch.background(sketch.frameCount % 5, 1, 1);

const x2 = sketch.frameCount * 20 % sketch.width;
const y2 = sketch.frameCount * 20 % sketch.height;
sketch.stroke(5 - sketch.frameCount % 5, 1, 1);
sketch.strokeWeight(sketch.frameCount % 20);
sketch.line(30, 20, x2, y2);    
sketch.line(x2, 20, Math.random() * 100, y2);        
`    
  }
};

const tryFn = (object, str, default_, setErr) => {
  try {
    const result = new Function('scope', str)(object);
    setErr('');
    return result ? result : default_;
  } catch (error) {
    setErr(error);
    return default_;
  }
};


new Vue({
  el: "#app",
  components: {
    Editable: () => import("./components/editable.js")
  },
  setup() {
    const error = reactive({
      sketchsetup: '',
      sketchdraw: '',
      setup: ''
    });
    const template = ref("");
    const setup = ref(DEFAULT.setup);
    const sketch = reactive({ ...DEFAULT.sketch });
    return {
      template,
      setup,
      sketch,
      error,
      create: computed(() => {
        setup.value;
        sketch.setup;
        sketch.draw;
        return {
          components: { VueP5 },
          template: `<div ref="parent" style="width: 100%; height: 100%;">${DEFAULT.template}${template.value}</div>`,
          setup(_, { refs }) {
            const context = new AudioContext();
            Tone.setContext(context);
            const results = tryFn(
              { Tone },
              setup.value,
              {},
              err => (error["setup"] = err)
            );
            const factory = (fn, str) =>
              tryFn(
                results,
                `return function ${fn}(sketch){${str}}`,
                () => null,
                err => (error[fn] = err)
              );
            onUnmounted(() => context.close());
            return {
              setup: _sketch => {
                _sketch.frameRate(2);
                _sketch.createCanvas(
                  refs.parent.clientWidth,
                  refs.parent.clientHeight
                );
                try {
                  return factory("sketchsetup", sketch.setup)(_sketch);
                } catch (err) {
                  error["sketchsetup"] = err;
                }
              },
              draw: _sketch => {
                try {
                  return factory("sketchdraw", sketch.draw)(_sketch);
                } catch (err) {
                  error["sketchdraw"] = err;
                }
              }
            };
          }
        };
      })
    };
  }
});
