import * as vscode from "vscode";

import { Context, EditorRequiredError, insertUndoStop } from "../api";
import { Extension } from "../state/extension";
import { Register, Registers } from "../state/registers";

/**
 * Indicates that a register is expected; if no register is given, the
 * specified default should be given instead.
 */
export type RegisterOr<_Default extends keyof Registers,
                       Flags extends Register.Flags = Register.Flags.None>
  = Register.WithFlags<Flags>;

/**
 * Indicates that an input is expected; if no input is given, the specified
 * function will be used to update the input value in subsequent executions of
 * this command.
 */
export interface InputOr<T> {
  (promptDefaultInput: () => T): T;
  (promptDefaultInput: () => Thenable<T>): Thenable<T>;
}

/**
 * Indicates that an input is expected.
 */
export type Input<T> = T | undefined;

/**
 * A function used to update the input value in subsequent executions of this
 * command.
 */
export interface SetInput<T> {
  (input: T): void;
}

/**
 * Indicates that a value passed as a command argument is expected.
 */
export type Argument<T> = T;

/**
 * The type of a `Context` passed to a command, based on whether the command
 * requires an active text editor or not.
 */
export type ContextType<RequiresActiveEditor extends boolean = boolean>
  = RequiresActiveEditor extends true ? Context : Context.WithoutActiveEditor;

/**
 * The type of the handler of a `CommandDescriptor`.
 */
export interface Handler<RequiresActiveEditor extends boolean = boolean> {
  (context: ContextType<RequiresActiveEditor>,
   argument: Record<string, any>): unknown | Thenable<unknown>;
}

/**
 * The descriptor of a command.
 */
export class CommandDescriptor<Flags extends CommandDescriptor.Flags = CommandDescriptor.Flags> {
  public get requiresActiveEditor() {
    return (this.flags & CommandDescriptor.Flags.RequiresActiveEditor) !== 0;
  }

  public constructor(
    /**
     * The unique identifier of the command.
     */
    public readonly identifier: string,

    /**
     * The handler of the command.
     */
    public readonly handler: Handler<Flags extends CommandDescriptor.Flags.RequiresActiveEditor
                                     ? true : false>,

    /**
     * The flags of the command.
     */
    public readonly flags: Flags,
  ) {
    Object.freeze(this);
  }

  /**
   * Executes the command with the given argument.
   */
  public replay(context: ContextType<Flags extends CommandDescriptor.Flags.RequiresActiveEditor
                                     ? true : false>, argument: Record<string, any>) {
    return this.handler(context, argument);
  }

  /**
   * Invokes the command with the given argument.
   */
  public invokeSafely(extension: Extension, argument: unknown) {
    return extension.runPromiseSafely(
      async () => {
        const context = Context.create(extension, this);

        if (this.requiresActiveEditor && !(context instanceof Context)) {
          throw new EditorRequiredError();
        }

        const ownedArgument = Object.assign({}, argument) as Record<string, unknown>;

        if (ownedArgument.count === undefined && extension.currentCount !== 0) {
          ownedArgument.count = extension.currentCount;
        }
        if (ownedArgument.register === undefined && extension.currentRegister !== undefined) {
          ownedArgument.register = extension.currentRegister;
        }

        extension.currentCount = 0;
        extension.currentRegister = undefined;

        const result = await this.handler(context as any, ownedArgument);

        // Record command *after* executing it, to ensure it did not encounter
        // an error.
        extension.recorder.recordCommand(this, ownedArgument);

        if (this.requiresActiveEditor) {
          await (context as Context).insertUndoStop();
        }

        return result;
      },
      () => undefined,
      (e) => `error executing command "${this.identifier}": ${e.message}`,
    );
  }

  /**
   * Registers the command for use by VS Code.
   */
  public register(extension: Extension): vscode.Disposable {
    return vscode.commands.registerCommand(
      this.identifier,
      (argument) => this.invokeSafely(extension, argument),
    );
  }
}

export namespace CommandDescriptor {
  /**
   * Flags describing the behavior of some commands.
   */
  export const enum Flags {
    /** No specific behavior. */
    None = 0b0000,

    /** An active editor must be available. */
    RequiresActiveEditor = 0b0001,

    /** The command should not be replayed in macros and repeats. */
    DoNotReplay = 0b0010,
  }
}

/**
 * A record from command identifier to command descriptor.
 */
export interface Commands {
  readonly [commandIdentifier: string]: CommandDescriptor;
}
