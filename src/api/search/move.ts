import * as vscode from "vscode";

import { Context, Direction } from "..";

/**
 * Moves the given position towards the given direction as long as the given
 * function returns a non-`undefined` value.
 *
 * @see moveWhile.backward,takeWhile.forward
 */
export function moveWith<T>(
  direction: Direction,
  reduce: moveWith.Reduce<T>,
  startState: T,
  origin: vscode.Position,
): vscode.Position {
  return direction === Direction.Backward
    ? moveWith.backward(reduce, startState, origin)
    : moveWith.forward(reduce, startState, origin);
}

export namespace moveWith {
  /**
   * A reduce function passed to `moveWith`.
   */
  export interface Reduce<T> {
    (character: string, state: T): T | undefined;
  }

  /**
   * Whether the last call to `moveWith` (and variants) reached the edge of the
   * document.
   */
  export declare const reachedDocumentEdge: boolean;

  /**
   * Moves the given position backward as long as the given predicate is true.
   *
   * ### Example
   *
   * ```js
   * assert.deepStrictEqual(
   *   moveWith.backward((c, i) => +c === +i - 1 ? c : undefined,
   *                     "8", new vscode.Position(0, 8)),
   *   new vscode.Position(0, 7),
   * );
   * ```
   *
   * With:
   * ```
   * 1234578
   * ```
   */
  export function backward<T>(reduce: Reduce<T>, startState: T, origin: vscode.Position) {
    didReachDocumentEdge = false;

    const document = Context.current.document,
          currentLineText = document.lineAt(origin).text;
    let state: T | undefined = startState;

    for (let i = origin.character - 1; i >= 0; i--) {
      if ((state = reduce(currentLineText[i], state)) === undefined) {
        return new vscode.Position(origin.line, i + 1);
      }
    }

    for (let line = origin.line - 1; line >= 0; line--) {
      const lineText = document.lineAt(line).text;

      if ((state = reduce("\n", state)) === undefined) {
        return new vscode.Position(line, 0);
      }

      for (let i = lineText.length - 1; i >= 0; i--) {
        if ((state = reduce(lineText[i], state)) === undefined) {
          return i === lineText.length - 1
            ? new vscode.Position(line + 1, 0)
            : new vscode.Position(line, i + 1);
        }
      }
    }

    didReachDocumentEdge = true;
    return new vscode.Position(0, 0);
  }

  /**
   * Moves the given position forward as long as the given predicate is true.
   *
   * ### Example
   *
   * ```js
   * assert.deepStrictEqual(
   *   moveWith.forward((c, i) => +c === +i + 1 ? c : undefined,
   *                    "1", new vscode.Position(0, 8)),
   *   new vscode.Position(0, 7),
   * );
   * ```
   *
   * With:
   * ```
   * 1234578
   * ```
   */
  export function forward<T>(reduce: Reduce<T>, startState: T, origin: vscode.Position) {
    didReachDocumentEdge = false;

    const document = Context.current.document,
          currentLineText = document.lineAt(origin).text;
    let state: T | undefined = startState;

    for (let i = origin.character; i < currentLineText.length; i++) {
      if ((state = reduce(currentLineText[i], state)) === undefined) {
        return new vscode.Position(origin.line, i);
      }
    }

    if ((state = reduce("\n", state)) === undefined) {
      return new vscode.Position(origin.line, currentLineText.length);
    }

    for (let line = origin.line + 1; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;

      for (let i = 0; i < lineText.length; i++) {
        if ((state = reduce(lineText[i], state)) === undefined) {
          return new vscode.Position(line, i);
        }
      }

      if ((state = reduce("\n", state)) === undefined) {
        return new vscode.Position(line, lineText.length);
      }
    }

    didReachDocumentEdge = true;
    return document.lineAt(document.lineCount - 1).range.end;
  }

  /**
   * Same as `moveWith`, but using raw char codes.
   *
   * @see moveWith,byCharCode.backward,byCharCode.forward
   */
  export function byCharCode<T>(
    direction: Direction,
    reduce: byCharCode.Reduce<T>,
    startState: T,
    origin: vscode.Position,
  ): vscode.Position {
    return direction === Direction.Backward
      ? byCharCode.backward(reduce, startState, origin)
      : byCharCode.forward(reduce, startState, origin);
  }

  export namespace byCharCode {
    /**
     * A reduce function passed to `moveWith.byCharCode`.
     */
    export interface Reduce<T> {
      (charCode: number, state: T): T | undefined;
    }

    /**
     * Same as `moveWith.backward`, but using raw char codes.
     *
     * @see moveWith.backward
     */
    export function backward<T>(reduce: Reduce<T>, startState: T, origin: vscode.Position) {
      didReachDocumentEdge = false;

      const document = Context.current.document,
            currentLineText = document.lineAt(origin).text;
      let state: T | undefined = startState;

      for (let i = origin.character - 1; i >= 0; i--) {
        if ((state = reduce(currentLineText.charCodeAt(i), state)) === undefined) {
          return new vscode.Position(origin.line, i + 1);
        }
      }

      for (let line = origin.line - 1; line >= 0; line--) {
        const lineText = document.lineAt(line).text;

        if ((state = reduce(10 /* \n */, state)) === undefined) {
          return new vscode.Position(line, 0);
        }

        for (let i = lineText.length - 1; i >= 0; i--) {
          if ((state = reduce(lineText.charCodeAt(i), state)) === undefined) {
            return i === lineText.length - 1
              ? new vscode.Position(line + 1, 0)
              : new vscode.Position(line, i + 1);
          }
        }
      }

      didReachDocumentEdge = true;
      return new vscode.Position(0, 0);
    }

    /**
     * Same as `moveWith.forward`, but using raw char codes.
     *
     * @see moveWith.forward
     */
    export function forward<T>(reduce: Reduce<T>, startState: T, origin: vscode.Position) {
      didReachDocumentEdge = false;

      const document = Context.current.document,
            currentLineText = document.lineAt(origin).text;
      let state: T | undefined = startState;

      for (let i = origin.character; i < currentLineText.length; i++) {
        if ((state = reduce(currentLineText.charCodeAt(i), state)) === undefined) {
          return new vscode.Position(origin.line, i);
        }
      }

      if ((state = reduce(10 /* \n */, state)) === undefined) {
        return new vscode.Position(origin.line, currentLineText.length);
      }

      for (let line = origin.line + 1; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;

        for (let i = 0; i < lineText.length; i++) {
          if ((state = reduce(lineText.charCodeAt(i), state)) === undefined) {
            return new vscode.Position(line, i);
          }
        }

        if ((state = reduce(10 /* \n */, state)) === undefined) {
          return new vscode.Position(line, lineText.length);
        }
      }

      didReachDocumentEdge = true;
      return document.lineAt(document.lineCount - 1).range.end;
    }
  }
}

/**
 * Moves the given position towards the given direction as long as the given
 * predicate is true.
 *
 * @see moveWhile.backward,takeWhile.forward
 */
export function moveWhile(
  direction: Direction,
  predicate: moveWhile.Predicate,
  origin: vscode.Position,
): vscode.Position {
  return direction === Direction.Backward
    ? moveWhile.backward(predicate, origin)
    : moveWhile.forward(predicate, origin);
}

export namespace moveWhile {
  /**
   * A predicate passed to `moveWhile`.
   */
  export interface Predicate {
    (character: string): boolean;
  }

  /**
   * Whether the last call to `moveWhile` (and variants) reached the edge of the
   * document.
   */
  export declare const reachedDocumentEdge: boolean;

  /**
   * Moves the given position backward as long as the given predicate is true.
   *
   * ### Example
   *
   * ```js
   * assert.deepStrictEqual(
   *   moveWhile.backward((c) => /\w/.test(c), new vscode.Position(0, 3)),
   *   new vscode.Position(0, 0),
   * );
   *
   * assert.deepStrictEqual(
   *   moveWhile.backward((c) => c === 'c', new vscode.Position(0, 3)),
   *   new vscode.Position(0, 2),
   * );
   *
   * assert.deepStrictEqual(
   *   moveWhile.backward((c) => c === 'b', new vscode.Position(0, 3)),
   *   new vscode.Position(0, 3),
   * );
   * ```
   *
   * With:
   * ```
   * abc
   * ```
   */
  export function backward(predicate: Predicate, origin: vscode.Position): vscode.Position {
    return moveWith.backward((ch) => predicate(ch) ? null : undefined, null, origin);
  }

  /**
   * Moves the given position forward as long as the given predicate is true.
   *
   * ### Example
   *
   * ```js
   * assert.deepStrictEqual(
   *   moveWhile.forward((c) => /\w/.test(c), new vscode.Position(0, 0)),
   *   new vscode.Position(0, 3),
   * );
   *
   * assert.deepStrictEqual(
   *   moveWhile.forward((c) => c === 'a', new vscode.Position(0, 0)),
   *   new vscode.Position(0, 1),
   * );
   *
   * assert.deepStrictEqual(
   *   moveWhile.forward((c) => c === 'b', new vscode.Position(0, 0)),
   *   new vscode.Position(0, 0),
   * );
   * ```
   *
   * With:
   * ```
   * abc
   * ```
   */
  export function forward(predicate: Predicate, origin: vscode.Position): vscode.Position {
    return moveWith.forward((ch) => predicate(ch) ? null : undefined, null, origin);
  }

  /**
   * Same as `moveWith`, but using raw char codes.
   *
   * @see moveWith,byCharCode.backward,byCharCode.forward
   */
  export function byCharCode(
    direction: Direction,
    predicate: byCharCode.Predicate,
    origin: vscode.Position,
  ): vscode.Position {
    return direction === Direction.Backward
      ? byCharCode.backward(predicate, origin)
      : byCharCode.forward(predicate, origin);
  }

  export namespace byCharCode {
    /**
     * A predicate passed to `moveWhile.byCharCode`.
     */
    export interface Predicate {
      (charCode: number): boolean;
    }

    /**
     * Same as `moveWhile.backward`, but using raw char codes.
     *
     * @see moveWhile.backward
     */
    export function backward(predicate: Predicate, origin: vscode.Position): vscode.Position {
      return moveWith.byCharCode.backward((ch) => predicate(ch) ? null : undefined, null, origin);
    }

    /**
     * Same as `moveWhile.forward`, but using raw char codes.
     *
     * @see moveWhile.forward
     */
    export function forward(predicate: Predicate, origin: vscode.Position): vscode.Position {
      return moveWith.byCharCode.forward((ch) => predicate(ch) ? null : undefined, null, origin);
    }
  }
}

let didReachDocumentEdge = false;
const getReachedDocumentEdge = {
  get() {
    return didReachDocumentEdge;
  },
};

for (const obj of [moveWith, moveWhile, moveWith.byCharCode, moveWhile.byCharCode]) {
  Object.defineProperty(obj, "reachedDocumentEdge", getReachedDocumentEdge);
}