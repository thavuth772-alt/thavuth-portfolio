const form = document.getElementById("admissionForm");

if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();

    const button = form.querySelector("button");
    if (!button) return;

    button.textContent = "Saved ✓";
    button.disabled = true;
    button.style.opacity = ".75";

    setTimeout(() => {
      button.textContent = "Save & Continue →";
      button.disabled = false;
      button.style.opacity = "1";
    }, 1800);
  });
}

/*
 * WebMCP integration
 * Exposes useful CampusFlow actions to WebMCP-aware AI agents.
 * The feature is optional, so the website continues to work normally
 * in browsers that do not support document.modelContext.
 */
(async () => {
  if (!document.modelContext?.registerTool) return;

  const getApplicationStatus = () => {
    const activeStep =
      document.querySelector(".step.active, .step.current, [aria-current='step']");
    const statusText =
      document.querySelector(".status, .application-status, [data-status]");

    return {
      application: "CampusFlow College Admission",
      currentStep: activeStep?.textContent?.trim() || "Personal Information",
      status: statusText?.textContent?.trim() || "Draft saved",
      url: window.location.href
    };
  };

  await document.modelContext.registerTool({
    name: "get_application_status",
    title: "Get application status",
    description:
      "Get the current CampusFlow college admission application step and status.",
    inputSchema: {
      type: "object",
      properties: {}
    },
    annotations: {
      readOnlyHint: true
    },
    execute: async () => getApplicationStatus()
  });

  await document.modelContext.registerTool({
    name: "save_application",
    title: "Save admission application",
    description:
      "Save the currently entered CampusFlow college admission application data in the page.",
    inputSchema: {
      type: "object",
      properties: {}
    },
    annotations: {
      readOnlyHint: false,
      consequentialHint: true
    },
    execute: async () => {
      if (!form) return { success: false, message: "Admission form not found." };

      const data = Object.fromEntries(new FormData(form).entries());
      localStorage.setItem("campusflow_application", JSON.stringify(data));

      const button = form.querySelector("button");
      if (button) {
        button.textContent = "Saved ✓";
        setTimeout(() => {
          button.textContent = "Save & Continue →";
        }, 1800);
      }

      return {
        success: true,
        message: "CampusFlow application saved successfully.",
        fieldsSaved: Object.keys(data)
      };
    }
  });

  await document.modelContext.registerTool({
    name: "open_application_section",
    title: "Open application section",
    description:
      "Navigate to a CampusFlow section such as overview, application, or features.",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["overview", "application", "features"],
          description: "The CampusFlow section to open."
        }
      },
      required: ["section"]
    },
    annotations: {
      readOnlyHint: false
    },
    execute: async ({ section }) => {
      const target = document.getElementById(section);
      if (!target) return { success: false, message: "Section not found." };

      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return {
        success: true,
        message: `Opened the ${section} section.`
      };
    }
  });
})();
