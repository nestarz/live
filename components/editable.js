import Vue, { computed, ref, createElement as h, onMounted } from "../vue.js";
import "https://unpkg.com/prismjs";
import cssLoader from "../utils/css-loader.js";
cssLoader(
  "https://cdn.jsdelivr.net/npm/prism-themes/themes/prism-synthwave84.css"
);

export default {
  props: {
    lang: { type: String, default: "js" },
    content: { type: String, default: "your code..." }
  },
  setup(props, { emit, refs }) {
    const content = ref(props.content);
    const highlighted = computed(() =>
      Prism.highlight(props.content, Prism.languages[props.lang])
    );
    onMounted(() =>
      refs.element.addEventListener("paste", e => {
        e.preventDefault();
        const text = (e.originalEvent || e).clipboardData.getData("text/plain");
        window.document.execCommand(
          "insertHTML",
          false,
          text.replace("/\x0D/g", "\\n")
        );
      })
    );
    return () =>
      h(
        "div",
        {
          style: {
            position: "relative",
            display: "flex",
            "flex-direction": "column",
            padding: "1rem"
          }
        },
        [
          h("pre", {
            class: "language-",
            style: {
              position: "absolute",
              "pointer-events": "none",
              inset: 0,
              margin: 0,
              background: "none",
              padding: "inherit"
            },
            domProps: { innerHTML: highlighted.value }
          }),
          h(
            "pre",
            {
              ref: "element",
              class: "language-",
              style: {
                opacity: 1,
                margin: 0,
                height: "100%",
                width: "100%",
                background: "none",
                outline: "none",
                padding: 0
              },
              attrs: { contenteditable: true },
              on: {
                input: event => emit("update:content", event.target.innerText)
              }
            },
            content.value
          )
        ]
      );
  }
};
