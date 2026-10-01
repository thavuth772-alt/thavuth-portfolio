const form = document.getElementById("admissionForm");
const statusElement = document.getElementById("applicationStatus");

const FIELD_NAMES = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "programme",
  "address"
];

function getFormData() {
  if (!form) return {};

  return Object.fromEntries(new FormData(form).entries());
}

function getMissingRequiredFields() {
  if (!form) return ["admissionForm"];

  return Array.from(form.querySelectorAll("[required]"))
    .filter(field => !field.value.trim())
    .map(field => field.name || field.id || field.type);
}

function saveApplicationData() {
  if (!form) {
    return {
      success: false,
      message: "Admission form not found."
    };
  }

  const data = getFormData();
  localStorage.setItem("campusflow_application", JSON.stringify(data));

  if (statusElement) {
    statusElement.textContent = "● Application saved";
  }

  return {
    success: true,
    message: "CampusFlow application saved successfully.",
    fieldsSaved: Object.keys(data)
  };
}

function showSavedState() {
  const button = form?.querySelector("button[type='submit']");
  if (!button) return;

  const originalText = button.textContent;
  button.textContent = "Saved ✓";
  button.disabled = true;
  button.style.opacity = ".75";

  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
    button.style.opacity = "1";
  }, 1800);
}

if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();

    const validation = validateApplication();

    if (!validation.valid) {
      form.reportValidity();
      return;
    }

    saveApplicationData();
    showSavedState();
  });

  // Restore the last locally saved application when the page opens.
  try {
    const saved = JSON.parse(
      localStorage.getItem("campusflow_application") || "null"
    );

    if (saved) {
      FIELD_NAMES.forEach(name => {
        const field = form.elements[name];
        if (field && saved[name] !== undefined) {
          field.value = saved[name];
        }
      });
    }
  } catch (error) {
    console.warn("Could not restore saved application.", error);
  }
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
    const activeStep = document.querySelector(
      ".step.active, .step.current, [aria-current='step']"
    );

    const savedData = localStorage.getItem("campusflow_application");

    return {
      application: "CampusFlow College Admission",
      currentStep:
        activeStep?.textContent?.trim() || "Personal Information",
      status: savedData ? "Application saved" : "Draft saved",
      saved: Boolean(savedData),
      url: window.location.href
    };
  };

  const validateApplication = () => {
    if (!form) {
      return {
        valid: false,
        missingFields: ["admissionForm"],
        message: "Admission form not found."
      };
    }

    const missingFields = getMissingRequiredFields();
    const valid = missingFields.length === 0 && form.checkValidity();

    return {
      valid,
      missingFields,
      message: valid
        ? "All required admission fields are valid."
        : "Please complete the required admission fields."
    };
  };

  await document.modelContext.registerTool({
    name: "get_application_status",
    title: "Get application status",
    description:
      "Get the current CampusFlow college admission application step and saved status.",
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

      if (!target) {
        return {
          success: false,
          message: "Section not found."
        };
      }

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      return {
        success: true,
        message: `Opened the ${section} section.`
      };
    }
  });

  await document.modelContext.registerTool({
    name: "fill_application_form",
    title: "Fill admission application",
    description:
      "Fill the CampusFlow college admission form with a student's personal information.",
    inputSchema: {
      type: "object",
      properties: {
        firstName: {
          type: "string",
          description: "Student's first name."
        },
        lastName: {
          type: "string",
          description: "Student's last name."
        },
        email: {
          type: "string",
          format: "email",
          description: "Student's email address."
        },
        phone: {
          type: "string",
          description: "Student's phone number."
        },
        programme: {
          type: "string",
          enum: [
            "B.Sc. Computer Science",
            "BCA",
            "B.Com",
            "BBA"
          ],
          description: "Student's preferred programme."
        },
        address: {
          type: "string",
          description: "Student's address."
        }
      },
      required: [
        "firstName",
        "lastName",
        "email",
        "phone",
        "programme"
      ]
    },
    annotations: {
      readOnlyHint: false
    },
    execute: async ({
      firstName,
      lastName,
      email,
      phone,
      programme,
      address = ""
    }) => {
      if (!form) {
        return {
          success: false,
          message: "Admission form not found."
        };
      }

      form.elements.firstName.value = firstName;
      form.elements.lastName.value = lastName;
      form.elements.email.value = email;
      form.elements.phone.value = phone;
      form.elements.programme.value = programme;
      form.elements.address.value = address;

      form.elements.firstName.dispatchEvent(
        new Event("input", { bubbles: true })
      );
      form.elements.email.dispatchEvent(
        new Event("input", { bubbles: true })
      );

      return {
        success: true,
        message: "Student admission form filled successfully.",
        fieldsFilled: [
          "firstName",
          "lastName",
          "email",
          "phone",
          "programme",
          "address"
        ]
      };
    }
  });

  await document.modelContext.registerTool({
    name: "validate_application",
    title: "Validate admission application",
    description:
      "Check whether all required CampusFlow admission fields are completed and valid.",
    inputSchema: {
      type: "object",
      properties: {}
    },
    annotations: {
      readOnlyHint: true
    },
    execute: async () => validateApplication()
  });

  await document.modelContext.registerTool({
    name: "save_application",
    title: "Save admission application",
    description:
      "Validate and save the currently entered CampusFlow college admission application in the browser.",
    inputSchema: {
      type: "object",
      properties: {}
    },
    annotations: {
      readOnlyHint: false,
      consequentialHint: true
    },
    execute: async () => {
      const validation = validateApplication();

      if (!validation.valid) {
        return {
          success: false,
          message: validation.message,
          missingFields: validation.missingFields
        };
      }

      const result = saveApplicationData();
      showSavedState();

      return result;
    }
  });
})();
