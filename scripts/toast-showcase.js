(() => {
  "use strict";

  const asset = "/assets/copilot-macos-ui-kit/toast/";
  // Class / Wrap Text map to the Figma component set. Optional slots map to
  // .Toast notification Base, shared by the preview and every variant.
  const classes = [
    { id: "feature", name: "Feature Discovery", title: "Explore A face to talk to", description: "Start a Voice conversation to see my new look.", image: "feature.png", action: "Explore", dismiss: true, width: 464 },
    { id: "podcast", name: "Podcast", title: "New podcast ready", description: "The secret lives of house cats.", image: "podcast.jpg", action: "Listen", dismiss: true },
    { id: "survey", name: "Survey", title: "We'd love your feedback", description: "Take a short survey to help us improve Copilot for Mac.", image: "survey.png", action: "Start survey", dismiss: true, wraps: [false] },
    { id: "research", name: "Research", title: "New research ready", description: "I just finished the research you asked for—let’s dive in!", action: "Go to report", dismiss: true },
    { id: "critical", name: "Critical", title: "Copilot is at capacity right now", description: "Please try again at another time.", icon: "critical.svg" },
    { id: "warning", name: "Warning", title: "Copilot is at capacity right now", icon: "warning.svg" },
    { id: "inline", name: "Inline", title: "Couldn’t complete your request", description: "Service is catching its breath. Let’s give it another go.", action: "Retry" },
    { id: "info-single", name: "Info/Single-line", description: "You've been chatting a while. Consider taking a break.", dismiss: true, width: 420 },
    { id: "info-multi", name: "Info/Multi-line", title: "Thanks for providing feedback!", description: "Your feedback helps me assist you better next time.", dismiss: true },
    { id: "settings", name: "Settings", title: "We got your feedback", icon: "success.svg" },
  ];
  const defaults = (preset, wrap = true) => ({
    preset, wrap: preset.wraps ? preset.wraps.includes(wrap) && wrap : wrap,
    showImage: !!preset.image, showIcon: !!preset.icon, showTitle: !!preset.title,
    showDescription: !!preset.description, showButton: !!preset.action, showDismiss: !!preset.dismiss,
  });

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function image(file, className, width, height, lazy) {
    const element = node("img", className);
    element.src = asset + file;
    element.alt = "";
    element.width = width;
    element.height = height;
    element.decoding = "async";
    if (lazy) element.loading = "lazy";
    return element;
  }

  function createToast(state, { lazy = true } = {}) {
    const { preset } = state;
    const toast = node("div", "copilot-toast");
    toast.dataset.toastClass = preset.id;
    toast.dataset.wrap = String(state.wrap);
    toast.style.setProperty("--toast-width", `${preset.width || 400}px`);
    if (state.showImage) {
      const slot = node("div", "copilot-toast-image");
      const crop = node("div", "copilot-toast-image-crop");
      if (preset.id === "survey") crop.classList.add("is-survey");
      crop.append(image(preset.image || "feature.png", "copilot-toast-thumbnail", 64, 64, lazy));
      slot.append(crop);
      toast.append(slot);
    }
    if (state.showTitle || state.showDescription || state.showIcon) {
      const copy = node("div", "copilot-toast-copy");
      if (state.showTitle || state.showIcon) {
        const title = node("div", "copilot-toast-title");
        if (state.showIcon) title.append(image(preset.icon || "success.svg", "copilot-toast-icon", 20, 20, lazy));
        if (state.showTitle) title.append(node("span", "copilot-toast-title-text", preset.title || "Explore A face to talk to"));
        copy.append(title);
      }
      if (state.showDescription) copy.append(node("p", "copilot-toast-description", preset.description || "Copilot can react and more in Voice."));
      toast.append(copy);
    }
    if (state.showButton) {
      const slot = node("div", "copilot-toast-action-slot");
      const action = node("span", "copilot-toast-action", preset.action || "Explore");
      slot.append(action);
      toast.append(slot);
    }
    if (state.showDismiss) {
      const dismiss = node("span", "copilot-toast-dismiss");
      dismiss.setAttribute("aria-hidden", "true");
      dismiss.append(image("dismiss.svg", "copilot-toast-dismiss-icon", 12, 12, lazy));
      toast.append(dismiss);
    }
    if (!toast.children.length) toast.classList.add("is-empty");
    return toast;
  }

  window.createToastShowcase = ({ isEnglish = false } = {}) => {
    const ui = isEnglish ? {
      title: "Toast notification", preview: "Toast preview", properties: "Properties", type: "Class", wrap: "Wrap text",
      reset: "Reset", variants: "All variants", variantCount: "19 variations",
      slots: { showImage: "Show image", showIcon: "Show icon", showTitle: "Show title", showDescription: "Show description", showButton: "Show button", showDismiss: "Show dismiss" },
    } : {
      title: "Toast notification", preview: "Toast 预览", properties: "组件属性", type: "类型", wrap: "文本换行",
      reset: "重置", variants: "所有变体", variantCount: "19 个变体",
      slots: { showImage: "显示图片", showIcon: "显示图标", showTitle: "显示标题", showDescription: "显示描述", showButton: "显示按钮", showDismiss: "显示关闭按钮" },
    };
    const events = new AbortController();
    const listen = (element, type, fn) => element.addEventListener(type, fn, { signal: events.signal });
    let state = defaults(classes[0]);
    const board = node("div", "toast-showcase");
    const brand = node("div", "toast-showcase-brand");
    brand.append(node("span", "", "Microsoft"), node("span", "", "Copilot Mac"));
    const heading = node("header", "toast-showcase-heading");
    heading.append(node("h3", "", ui.title));
    const playground = node("div", "toast-playground");
    const stage = node("div", "toast-preview");
    const canvas = node("div", "toast-preview-canvas");
    const preview = node("div", "toast-preview-content");
    preview.setAttribute("role", "group");
    preview.setAttribute("aria-label", ui.preview);
    canvas.append(preview);
    stage.append(canvas);
    const controls = node("div", "toast-properties");
    const controlsHeading = node("div", "toast-properties-heading");
    const reset = node("button", "toast-showcase-reset", ui.reset);
    reset.type = "button";
    controlsHeading.append(node("h4", "", ui.properties), reset);
    controls.append(controlsHeading);
    const typeLabel = node("label", "toast-property");
    typeLabel.append(node("span", "", ui.type));
    const select = node("select", "toast-class-select");
    select.setAttribute("aria-label", ui.type);
    classes.forEach((preset) => {
      const option = node("option", "", preset.name);
      option.value = preset.id;
      select.append(option);
    });
    typeLabel.append(select);
    controls.append(typeLabel);
    const toggles = new Map();
    const addToggle = (key, text) => {
      const label = node("label", "toast-property toast-property-toggle");
      const input = node("input", "toast-switch");
      input.type = "checkbox";
      input.name = key;
      input.setAttribute("role", "switch");
      label.append(node("span", "", text), input);
      controls.append(label);
      toggles.set(key, input);
      listen(input, "change", () => { state[key] = input.checked; render(); });
    };
    addToggle("wrap", ui.wrap);
    const divider = node("div", "toast-properties-base", ".Toast notification Base");
    controls.append(divider);
    Object.entries(ui.slots).forEach(([key, label]) => addToggle(key, label));
    playground.append(stage, controls);

    const galleryHeading = node("div", "toast-gallery-heading");
    galleryHeading.append(node("h4", "", ui.variants), node("span", "", ui.variantCount));
    const gallery = node("div", "toast-variant-gallery");
    classes.forEach((preset) => {
      const group = node("div", "toast-variant-group");
      group.append(node("h5", "", preset.name));
      const samples = node("div", "toast-variant-samples");
      (preset.wraps || [true, false]).forEach((wrap) => {
        const sample = node("figure", "toast-variant");
        sample.dataset.toastVariant = `${preset.id}-${wrap ? "wrap" : "hug"}`;
        sample.append(createToast(defaults(preset, wrap)));
        samples.append(sample);
      });
      group.append(samples);
      gallery.append(group);
    });
    board.append(brand, heading, playground, galleryHeading, gallery);

    function render() {
      const toast = createToast(state, { lazy: false });
      preview.replaceChildren(toast);
      preview.hidden = toast.classList.contains("is-empty");
      select.value = state.preset.id;
      toggles.forEach((input, key) => {
        input.checked = state[key];
        input.disabled = key === "wrap" && !!state.preset.wraps;
      });
    }

    listen(select, "change", () => {
      state = defaults(classes.find((preset) => preset.id === select.value), state.wrap);
      render();
    });
    listen(reset, "click", () => { state = defaults(classes[0]); render(); });
    render();
    return { element: board, destroy() { events.abort(); } };
  };
})();
