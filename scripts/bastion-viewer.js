class EasyBastionViewer extends EasyBastionSheet {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(
    super.DEFAULT_OPTIONS,
    {
      id: "easy-bastion-viewer",
      classes: ["easy-bastion-window", "easy-bastion-viewer-window"],
      window: {
        title: "Просмотр Бастиона",
        resizable: true,
        contentClasses: ["standard-form"]
      }
    },
    { inplace: false }
  );

  constructor(options = {}) {
    super(options);

    this.readOnly = true;
    this.journal = options.journal ?? null;
  }

  static async open(initialData = {}, options = {}) {
    const app = new this({
      initialData,
      journal: options.journal ?? null
    });

    await app.render({ force: true });
    return app;
  }

	static async openFromJournal(journalRef) {
	  let journal = null;

	  if (!journalRef) {
		ui.notifications.warn("Не передан идентификатор журнала бастиона.");
		return null;
	  }

	  if (typeof journalRef === "string" && journalRef.includes(".")) {
		journal = await fromUuid(journalRef);
	  } else {
		journal = game.journal.get(journalRef);
	  }

	  if (!journal) {
		ui.notifications.warn("Журнал бастиона не найден.");
		return null;
	  }

	  const canView = journal.testUserPermission(
		game.user,
		CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
	  );

	  if (!canView) {
		ui.notifications.warn("У вас нет доступа к этому журналу бастиона.");
		return null;
	  }

	  const data = foundry.utils.deepClone(
		journal.getFlag("easy-bastion", "bastionData") ?? {}
	  );

	  return this.open(data, { journal });
	}

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.readOnly = true;
    context.showSaveButton = false;
    context.showAddOwnerButton = false;
    context.showRemoveOwnerButton = false;
    context.showOpenJournalButton = Boolean(this.journal);

    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    const root = this.element;
    if (!root) return;

    root.classList.add("easy-bastion-readonly");

    this.disableEditing(root);
    this.removeEditingControls(root);
    this.bindOpenJournal(root);
  }

  disableEditing(root) {
    const editableSelectors = [
      'input[type="text"]',
      'input[type="number"]',
      'input[type="checkbox"]',
      "textarea",
      "select"
    ];

    root.querySelectorAll(editableSelectors.join(", ")).forEach((el) => {
      if (el.classList.contains("bastion-open-journal")) return;

      if (el.matches('input[type="text"], input[type="number"], textarea')) {
        el.readOnly = true;
      }

      el.disabled = true;
      el.setAttribute("aria-disabled", "true");
      el.setAttribute("tabindex", "-1");
    });
  }

  removeEditingControls(root) {
    root.querySelector(".bastion-save")?.remove();
    root.querySelector(".bastion-add-owner")?.remove();
    root.querySelectorAll(".bastion-remove-owner").forEach((el) => el.remove());

    root.querySelectorAll(".owner-maintenance-input").forEach((input) => {
      input.disabled = true;
      input.setAttribute("tabindex", "-1");
    });
  }

  bindOpenJournal(root) {
    const oldButton = root.querySelector(".bastion-open-journal");
    if (!oldButton) return;

    const newButton = oldButton.cloneNode(true);
    oldButton.replaceWith(newButton);

    newButton.disabled = false;
    newButton.removeAttribute("aria-disabled");
    newButton.removeAttribute("tabindex");

    newButton.addEventListener("click", async (event) => {
      event.preventDefault();

      if (!this.journal) {
        ui.notifications.warn("Журнал бастиона не привязан.");
        return;
      }

      const canView = this.journal.testUserPermission(
        game.user,
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
      );

      if (!canView) {
        ui.notifications.warn("У вас нет доступа к журналу.");
        return;
      }

      await this.journal.sheet.render(true);
    });
  }
}

globalThis.EasyBastionViewer = EasyBastionViewer;
console.log("[easy-bastion] EasyBastionViewer loaded");