import * as vscode from "vscode";

import { ExpectedDocument } from "../utils";

const executeCommand = vscode.commands.executeCommand;

suite("select-line-end.md", function () {
  // Set up document.
  let document: vscode.TextDocument,
      editor: vscode.TextEditor;

  this.beforeAll(async () => {
    document = await vscode.workspace.openTextDocument();
    editor = await vscode.window.showTextDocument(document);

    await executeCommand("dance.dev.setSelectionBehavior", { mode: "normal", value: "caret" });
  });

  this.afterAll(async () => {
    await executeCommand("workbench.action.closeActiveEditor");
  });

  // Each test sets up using its previous document, and notifies its
  // dependents that it is done by writing its document to `documents`.
  // This ensures that tests are executed in the right order, and that we skip
  // tests whose dependencies failed.
  const notifyDependents: Record<string, (document: ExpectedDocument | undefined) => void> = {},
        documents: Record<string, Promise<ExpectedDocument | undefined>> = {
          "initial-1": Promise.resolve(ExpectedDocument.parseIndented(12, `\
            the quick brown fox
                      ^^^ 0
          `)),

          "line-start-1": new Promise((resolve) => notifyDependents["line-start-1"] = resolve),
          "line-start-extend-1": new Promise((resolve) => notifyDependents["line-start-extend-1"] = resolve),
          "line-start-extend-character-1": new Promise((resolve) => notifyDependents["line-start-extend-character-1"] = resolve),
          "line-end-1": new Promise((resolve) => notifyDependents["line-end-1"] = resolve),
          "line-end-character-1": new Promise((resolve) => notifyDependents["line-end-character-1"] = resolve),
          "line-end-extend-1": new Promise((resolve) => notifyDependents["line-end-extend-1"] = resolve),
        };

  test("transition initial-1 > line-start-1                 ", async function () {
    const beforeDocument = await documents["initial-1"];

    if (beforeDocument === undefined) {
      notifyDependents["line-start-1"](undefined);
      this.skip();
    }

    const afterDocument = ExpectedDocument.parseIndented(6, `\
      the quick brown fox
      |^^^^^^^^^^^^ 0
    `);

    try {
      // Set-up document to be in expected initial state.
      await beforeDocument.apply(editor);

      // Perform all operations.
      await executeCommand("dance.select.lineStart");

      // Ensure document is as expected.
      afterDocument.assertEquals(editor);

      // Test passed, allow dependent tests to run.
      notifyDependents["line-start-1"](afterDocument);
    } catch (e) {
      notifyDependents["line-start-1"](undefined);

      throw e;
    }
  });

  test("transition initial-1 > line-start-extend-1          ", async function () {
    const beforeDocument = await documents["initial-1"];

    if (beforeDocument === undefined) {
      notifyDependents["line-start-extend-1"](undefined);
      this.skip();
    }

    const afterDocument = ExpectedDocument.parseIndented(6, `\
      the quick brown fox
      |^^^^^^^^^ 0
    `);

    try {
      // Set-up document to be in expected initial state.
      await beforeDocument.apply(editor);

      // Perform all operations.
      await executeCommand("dance.select.lineStart.extend");

      // Ensure document is as expected.
      afterDocument.assertEquals(editor);

      // Test passed, allow dependent tests to run.
      notifyDependents["line-start-extend-1"](afterDocument);
    } catch (e) {
      notifyDependents["line-start-extend-1"](undefined);

      throw e;
    }
  });

  test("transition initial-1 > line-start-extend-character-1", async function () {
    const beforeDocument = await documents["initial-1"];

    if (beforeDocument === undefined) {
      notifyDependents["line-start-extend-character-1"](undefined);
      this.skip();
    }

    const afterDocument = ExpectedDocument.parseIndented(6, `\
      the quick brown fox
      |^^^^^^^^^^ 0
    `);

    try {
      // Set-up document to be in expected initial state.
      await beforeDocument.apply(editor);

      // Perform all operations.
      await executeCommand("dance.dev.setSelectionBehavior", { mode: "normal", value: "character" });
      await executeCommand("dance.select.lineStart.extend");
      await executeCommand("dance.dev.setSelectionBehavior", { mode: "normal", value: "caret" });

      // Ensure document is as expected.
      afterDocument.assertEquals(editor);

      // Test passed, allow dependent tests to run.
      notifyDependents["line-start-extend-character-1"](afterDocument);
    } catch (e) {
      notifyDependents["line-start-extend-character-1"](undefined);

      throw e;
    }
  });

  test("transition initial-1 > line-end-1                   ", async function () {
    const beforeDocument = await documents["initial-1"];

    if (beforeDocument === undefined) {
      notifyDependents["line-end-1"](undefined);
      this.skip();
    }

    const afterDocument = ExpectedDocument.parseIndented(6, `\
      the quick brown fox
                   ^^^^^^ 0
    `);

    try {
      // Set-up document to be in expected initial state.
      await beforeDocument.apply(editor);

      // Perform all operations.
      await executeCommand("dance.select.lineEnd");

      // Ensure document is as expected.
      afterDocument.assertEquals(editor);

      // Test passed, allow dependent tests to run.
      notifyDependents["line-end-1"](afterDocument);
    } catch (e) {
      notifyDependents["line-end-1"](undefined);

      throw e;
    }
  });

  test("transition initial-1 > line-end-character-1         ", async function () {
    const beforeDocument = await documents["initial-1"];

    if (beforeDocument === undefined) {
      notifyDependents["line-end-character-1"](undefined);
      this.skip();
    }

    const afterDocument = ExpectedDocument.parseIndented(6, `\
      the quick brown fox
                  ^^^^^^^ 0
    `);

    try {
      // Set-up document to be in expected initial state.
      await beforeDocument.apply(editor);

      // Perform all operations.
      await executeCommand("dance.dev.setSelectionBehavior", { mode: "normal", value: "character" });
      await executeCommand("dance.select.lineEnd");
      await executeCommand("dance.dev.setSelectionBehavior", { mode: "normal", value: "caret" });

      // Ensure document is as expected.
      afterDocument.assertEquals(editor);

      // Test passed, allow dependent tests to run.
      notifyDependents["line-end-character-1"](afterDocument);
    } catch (e) {
      notifyDependents["line-end-character-1"](undefined);

      throw e;
    }
  });

  test("transition initial-1 > line-end-extend-1            ", async function () {
    const beforeDocument = await documents["initial-1"];

    if (beforeDocument === undefined) {
      notifyDependents["line-end-extend-1"](undefined);
      this.skip();
    }

    const afterDocument = ExpectedDocument.parseIndented(6, `\
      the quick brown fox
                ^^^^^^^^^ 0
    `);

    try {
      // Set-up document to be in expected initial state.
      await beforeDocument.apply(editor);

      // Perform all operations.
      await executeCommand("dance.select.lineEnd.extend");

      // Ensure document is as expected.
      afterDocument.assertEquals(editor);

      // Test passed, allow dependent tests to run.
      notifyDependents["line-end-extend-1"](afterDocument);
    } catch (e) {
      notifyDependents["line-end-extend-1"](undefined);

      throw e;
    }
  });
});