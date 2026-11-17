(() => {
  "use strict";

  const asset = "/assets/copilot-macos-ui-kit/toast/";
  // Class / Wrap Text map to the Figma component set. Optional slots map to
  // .Toast notification Base, shared by the live preview and every variant.
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

  function createToast(state, { interactive = false, closeLabel = "Dismiss notification" } = {}) {
    const { preset } = state;
    const toast = node("div", "copilot-toast");
    toast.dataset.toastClass = preset.id;
    toast.dataset.wrap = String(state.wrap);
    toast.style.setProperty("--toast-width", `${preset.width || 400}px`);
    if (state.showImage) {
      const slot = node("div", "copilot-toast-image");
      const crop = node("div", "copilot-toast-image-crop");
      if (preset.id === "survey") crop.classList.add("is-survey");
      crop.append(image(preset.image || "feature.png", "copilot-toast-thumbnail", 64, 64, !interactive));
      slot.append(crop);
      toast.append(slot);
    }
    if (state.showTitle || state.showDescription || state.showIcon) {
      const copy = node("div", "copilot-toast-copy");
      if (state.showTitle || state.showIcon) {
        const title = node("div", "copilot-toast-title");
        if (state.showIcon) title.append(image(preset.icon || "success.svg", "copilot-toast-icon", 20, 20, !interactive));
        if (state.showTitle) title.append(node("span", "copilot-toast-title-text", preset.title || "Explore A face to talk to"));
        copy.append(title);
      }
      if (state.showDescription) copy.append(node("p", "copilot-toast-description", preset.description || "Copilot can react and more in Voice."));
      toast.append(copy);
    }
    if (state.showButton) {
      const slot = node("div", "copilot-toast-action-slot");
      const action = node(interactive ? "button" : "span", "copilot-toast-action", preset.action || "Explore");
      if (interactive) { action.type = "button"; action.dataset.toastAction = ""; }
      slot.append(action);
      toast.append(slot);
    }
    if (state.showDismiss) {
      const dismiss = node(interactive ? "button" : "span", "copilot-toast-dismiss");
      if (interactive) {
        dismiss.type = "button";
        dismiss.dataset.toastDismiss = "";
        dismiss.setAttribute("aria-label", closeLabel);
      } else dismiss.setAttribute("aria-hidden", "true");
      dismiss.append(image("dismiss.svg", "copilot-toast-dismiss-icon", 12, 12, !interactive));
      toast.append(dismiss);
    }
    if (!toast.children.length) toast.classList.add("is-empty");
    return toast;
  }

  window.createToastShowcase = ({ isEnglish = false } = {}) => {
    const ui = isEnglish ? {
      title: "Toast notification", intro: "One component, different moments. Explore the properties and try each variation.",
      preview: "Interactive preview", properties: "Properties", type: "Class", wrap: "Wrap text",
      replay: "Replay", reset: "Reset", variants: "All variants", variantCount: "19 variations",
      wrapped: "Wrap text", hug: "Hug content", closed: "Notification dismissed", close: "Dismiss notification",
      action: (label) => `Clicked “${label}”`, shown: "Notification shown", empty: "Turn on a property to show content.",
      slots: { showImage: "Show image", showIcon: "Show icon", showTitle: "Show title", showDescription: "Show description", showButton: "Show button", showDismiss: "Show dismiss" },
    } : {
      title: "Toast notification", intro: "一个组件，适配不同场景。切换属性，体验每一种状态。",
      preview: "交互体验", properties: "组件属性", type: "类型", wrap: "文本换行",
      replay: "重新播放", reset: "重置", variants: "所有变体", variantCount: "19 个变体",
      wrapped: "文本换行", hug: "内容自适应", closed: "通知已关闭", close: "关闭通知",
      action: (label) => `已点击「${label}」`, shown: "通知已显示", empty: "打开属性开关以显示内容。",
      slots: { showImage: "显示图片", showIcon: "显示图标", showTitle: "显示标题", showDescription: "显示描述", showButton: "显示按钮", showDismiss: "显示关闭按钮" },
    };
    const events = new AbortController();
    const listen = (element, type, fn) => element.addEventListener(type, fn, { signal: events.signal });
    let state = defaults(classes[0]);
    const board = node("div", "toast-showcase");
    const brand = node("div", "toast-showcase-brand");
    brand.append(node("span", "", "Microsoft"), node("span", "", "Copilot Mac"));
    const heading = node("header", "toast-showcase-heading");
    heading.append(node("h3", "", ui.title), node("p", "", ui.intro));
    const playground = node("div", "toast-playground");
    const stage = node("div", "toast-preview");
    const toolbar = node("div", "toast-preview-toolbar");
    const replay = node("button", "toast-showcase-button", ui.replay);
    replay.type = "button";
    toolbar.append(node("h4", "", ui.preview), replay);
    const canvas = node("div", "toast-preview-canvas");
    const preview = node("div", "toast-preview-content");
    preview.setAttribute("role", "group");
    preview.setAttribute("aria-label", ui.preview);
    const empty = node("p", "toast-preview-empty");
    empty.hidden = true;
    canvas.append(preview, empty);
    const notice = node("p", "toast-preview-notice");
    notice.setAttribute("role", "status");
    stage.append(toolbar, canvas, notice);
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
        sample.append(node("figcaption", "", wrap ? ui.wrapped : ui.hug), createToast(defaults(preset, wrap)));
        samples.append(sample);
      });
      group.append(samples);
      gallery.append(group);
    });
    board.append(brand, heading, playground, galleryHeading, gallery);

    function render(message = "") {
      preview.hidden = false;
      empty.hidden = true;
      preview.replaceChildren(createToast(state, { interactive: true, closeLabel: ui.close }));
      if (preview.firstElementChild.classList.contains("is-empty")) {
        preview.hidden = true;
        empty.hidden = false;
        empty.textContent = ui.empty;
      }
      select.value = state.preset.id;
      toggles.forEach((input, key) => {
        input.checked = state[key];
        input.disabled = key === "wrap" && !!state.preset.wraps;
      });
      notice.textContent = message;
    }

    listen(select, "change", () => {
      state = defaults(classes.find((preset) => preset.id === select.value), state.wrap);
      render();
    });
    listen(replay, "click", () => render(ui.shown));
    listen(reset, "click", () => { state = defaults(classes[0]); render(); });
    listen(preview, "click", (event) => {
      if (event.target.closest("[data-toast-dismiss]")) {
        preview.hidden = true;
        empty.textContent = ui.closed;
        empty.hidden = false;
        notice.textContent = ui.closed;
        replay.focus({ preventScroll: true });
      } else if (event.target.closest("[data-toast-action]")) {
        notice.textContent = ui.action(state.preset.action || "Explore");
      }
    });
    render();
    return { element: board, destroy() { events.abort(); } };
  };
})();
