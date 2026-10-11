import type {
  ChatInputCommandInteraction,
  ClientEvents,
  Collection,
  Message,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

type AnySlashBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
| SlashCommandSubcommandsOnlyBuilder;

export interface SlashCommand {
  data: AnySlashBuilder;
  execute: (interaction: ChatInputCommandInteraction) => unknown;
}

export interface PrefixCommand {
  name: string;
  aliases?: string[];
  description?: string;
  execute: (message: Message, args: string[]) => unknown;
}

export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  description?: string;
  execute: (...args:ClientEvents[K] ) => unknown;
}

export function defineEvent<K extends keyof ClientEvents>(event: Event<K>): Event<K> {
  return event;
}

declare module "discord.js" {
  interface Client {
    slashCommands: Collection<string, SlashCommand>;
    prefixCommands: Collection<string, PrefixCommand>;
  }
}