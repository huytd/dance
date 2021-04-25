import * as assert from "assert";

import { Builder, unindent } from "../../meta";
import { stringifyExpectedDocument } from "./build-utils";

export async function build(builder: Builder) {
  const modules = await builder.getApiModules();

  return modules.map((module) => {
    const examples = module.functions.flatMap((f) => f.examples.map((example) => {
      const match = exampleRe.exec(example);

      assert(match !== null, "Example does not have valid format");

      const [_, flags, code, before, after] = match;

      return {
        functionName: f.name,
        flags,
        code,
        before,
        after,
      } as Example;
    }));

    if (examples.length === 0) {
      return "";
    }

    const examplesPerFunction = new Map<string, number>();

    return unindent(4, `
      suite(${JSON.stringify(module.path)}, function () {
        ${examples.map((example) => {
          let testName = `function ${example.functionName}`;
          const examplesForFunction = examplesPerFunction.get(example.functionName);

          if (examplesForFunction === undefined) {
            examplesPerFunction.set(example.functionName, 1);
          } else {
            testName += `#${examplesForFunction}`;
            examplesPerFunction.set(example.functionName, examplesForFunction + 1);
          }

          const decls = [
            "editorState = extension.editors.getState(editor)!",
            "context = new Context(editorState, cancellationToken)",
          ];

          for (const name of ["before", "after"] as const) {
            const code = example[name];

            if (code !== undefined) {
              decls.push(`${name} = ${stringifyExpectedDocument(code, 22, 14)}`);
            }
          }

          return unindent(4, `
            test("${testName}", async function () {
              const ${decls.join(",\n                    ")};

              ${example.before !== undefined
                ? "await before.apply(editor);"
                : "// No setup needed."}

              await context.runAsync(async () => {${"\n"
                + example.code.replace(/^/gm, " ".repeat(16)).trimEnd()}
              });

              ${example.after !== undefined
                ? "after.assertEquals(editor);"
                : "// No expected end document."}
            });
          `);
        }).join("")}
      });
    `);
  }).join("") + "});\n";
}

interface Example {
  functionName: string;
  flags: string;
  code: string;
  before?: string;
  after?: string;
}

const exampleRe = /^```(.+)\n([\s\S]+?)^```\n+(?:^(?:Before|With):\n^```\n([\s\S]*?)^```\n+(?:^After:\n^```\n([\s\S]+?)^```)?)?/m;
